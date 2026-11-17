import { getAuth } from "firebase-admin/auth";
import type { App } from "firebase-admin/app";
import type { Firestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { z } from "zod";
import { AccountError } from "../account/contracts.js";
import { GetConfiguration } from "../account/get-configuration.js";
import { FirestoreOwnerAccess } from "../firebase/owner-access.js";
import { verifyIdentity } from "../firebase/verify-identity.js";
import type { BackendRuntime } from "../firebase/runtime.js";
import { v2Provider } from "../memory-v2/provider.js";
import { InterpretationError } from "#memory-v2/ai/contracts";
import { SourceError, formatSchema } from "./contracts.js";
import { ReferenceStore } from "./store.js";
import { uploadReference } from "./service.js";
import { questionReferences } from "./question.js";
import { importWebReference } from "./web-import.js";

const envelopeSchema = z.strictObject({
  apiVersion: z.literal(1),
  generation: z.uuid(),
  operation: z.enum([
    "catalog",
    "admit",
    "upload",
    "operation",
    "cancel",
    "read",
    "forget",
    "query",
    "web",
  ]),
  payload: z.record(z.string(), z.unknown()),
});
const operationSchema = z.strictObject({ requestId: z.uuid() });
const sourceSchema = z.strictObject({ id: z.uuid() });
const admissionSchema = z.strictObject({
  requestId: z.uuid(),
  title: z.string().trim().min(1).max(200),
  format: formatSchema,
  checksum: z.string().regex(/^[a-f0-9]{64}$/u),
});
let extracting = false;

export function referenceCallable(
  app: App,
  db: Firestore,
  runtime: BackendRuntime,
) {
  const access = new GetConfiguration(
    runtime.allowedEmail,
    new FirestoreOwnerAccess(db),
    Date.now,
  );
  const store = new ReferenceStore(db);
  return onCall(
    {
      region: "europe-west1",
      timeoutSeconds: 240,
      memory: "1GiB",
      maxInstances: 1,
      concurrency: 2,
      enforceAppCheck: runtime.production,
      ...(runtime.production
        ? {
            serviceAccount: "kioku-runtime@kioku-9454f.iam.gserviceaccount.com",
            invoker: "public" as const,
          }
        : {}),
    },
    async (request) => {
      try {
        if (!request.auth) throw new AccountError("unauthenticated");
        if (
          runtime.production &&
          !runtime.appIds.includes(request.app?.appId ?? "")
        )
          throw new AccountError("permission-denied");
        if (request.rawRequest.rawBody.byteLength > 9 * 1024 * 1024)
          throw new SourceError("too-large");
        const input = envelopeSchema.parse(request.data);
        const identity = await verifyIdentity(
          getAuth(app),
          request.rawRequest.get("Authorization"),
        );
        await access.execute(identity, { apiVersion: 1 });
        const actor = { uid: identity.uid, generation: input.generation };
        const reauthorize = async () => {
          const current = await verifyIdentity(
            getAuth(app),
            request.rawRequest.get("Authorization"),
          );
          if (current.uid !== actor.uid)
            throw new AccountError("permission-denied");
        };
        switch (input.operation) {
          case "web":
            if (!runtime.production)
              throw new AccountError("failed-precondition");
            return await importWebReference(
              store,
              actor,
              input.payload,
              reauthorize,
            );
          case "catalog": {
            z.strictObject({}).parse(input.payload);
            const catalog = await store.catalog(actor.uid, actor.generation);
            return {
              epoch: catalog.epoch,
              sources: catalog.sources.map((source) => ({
                id: source.id,
                revision: source.revision,
                title: source.title,
                partial: source.document.coverage === "partial",
                fragments: source.document.chunks.length,
              })),
            };
          }
          case "admit":
            return await store.begin(
              actor.uid,
              actor.generation,
              admissionSchema.parse(input.payload),
            );
          case "operation":
            return await store.operation(
              actor.uid,
              actor.generation,
              operationSchema.parse(input.payload).requestId,
            );
          case "cancel":
            return await store.cancel(
              actor.uid,
              actor.generation,
              operationSchema.parse(input.payload).requestId,
            );
          case "read":
            return await store.read(
              actor.uid,
              actor.generation,
              sourceSchema.parse(input.payload).id,
            );
          case "forget": {
            const source = z
              .strictObject({ id: z.uuid(), revision: z.uuid() })
              .parse(input.payload);
            await reauthorize();
            await store.forget(
              actor.uid,
              actor.generation,
              source.id,
              source.revision,
            );
            return { forgotten: true };
          }
          case "upload": {
            const upload = z
              .strictObject({ command: z.unknown(), lease: z.uuid() })
              .parse(input.payload);
            const command = z
              .object({ bytes: z.string().max(8 * 1024 * 1024) })
              .parse(upload.command);
            if (!command.bytes) throw new SourceError("invalid");
            if (extracting)
              throw new HttpsError("resource-exhausted", "reference-busy");
            extracting = true;
            try {
              await reauthorize();
              return await uploadReference(
                store,
                actor.uid,
                actor.generation,
                upload.command,
                upload.lease,
                { reauthorize },
              );
            } finally {
              extracting = false;
            }
          }
          case "query":
            return await questionReferences(
              db,
              actor,
              input.payload,
              async (epoch, validate) => {
                // Emulator suites cannot construct a paid provider; tests inject StructuredModel at the service boundary.
                if (!runtime.production)
                  throw new AccountError("failed-precondition");
                return v2Provider(
                  db,
                  actor.uid,
                  actor.generation,
                  epoch,
                  validate,
                );
              },
              reauthorize,
            );
        }
      } catch (error) {
        if (error instanceof HttpsError) throw error;
        if (error instanceof SourceError)
          throw new HttpsError(
            error.issue === "denied"
              ? "permission-denied"
              : "failed-precondition",
            `reference-${error.issue}`,
            { referenceIssue: error.issue },
          );
        if (error instanceof z.ZodError)
          throw new HttpsError("invalid-argument", "reference-invalid");
        if (error instanceof AccountError)
          throw new HttpsError(error.code, error.code);
        if (error instanceof InterpretationError)
          throw new HttpsError(
            error.code === "HTTP_429" ? "resource-exhausted" : "unavailable",
            "reference-ai-unavailable",
            { referenceIssue: "ai-unavailable" },
          );
        throw new HttpsError("unavailable", "reference-unavailable");
      }
    },
  );
}
