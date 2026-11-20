import { getAuth } from "firebase-admin/auth";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import type { App } from "firebase-admin/app";
import type { Firestore } from "firebase-admin/firestore";
import { ZodError } from "zod";
import { AccountError } from "../account/contracts.js";
import { GetConfiguration } from "../account/get-configuration.js";
import { FirestoreOwnerAccess } from "../firebase/owner-access.js";
import { verifyIdentity } from "../firebase/verify-identity.js";
import type { BackendRuntime } from "../firebase/runtime.js";
import { authorizeV2 } from "./access.js";
import {
  envelopeSchema,
  submitSchema,
  clarificationSchema,
  operationSchema,
  detailsSchema,
  sourceSchema,
  querySchema,
  changeSchema,
} from "./contracts.js";
import { routeSchema, applySchema } from "./route-contracts.js";
import { V2Capture } from "./capture.js";
import { V2WorkStore } from "./work-store.js";
import { V2Reader } from "./reader.js";
import { presentGroup, presentSaved } from "./presentation.js";
import { v2Provider } from "./provider.js";
import { queryV2 } from "./query.js";
import { changeV2 } from "./change.js";
import { routeV2, applyV2 } from "./route.js";

export function memoryV2Callable(
  app: App,
  db: Firestore,
  runtime: BackendRuntime,
) {
  const directLocations = runtime.directLocations;
  const access = new GetConfiguration(
    runtime.allowedEmail,
    new FirestoreOwnerAccess(db),
    Date.now,
  );
  return onCall(
    {
      region: "europe-west1",
      timeoutSeconds: 180,
      maxInstances: 1,
      concurrency: 4,
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
        if (request.rawRequest.rawBody.byteLength > 64_000)
          throw new AccountError("invalid-argument");
        const envelope = envelopeSchema.parse(request.data);
        const identity = await verifyIdentity(
          getAuth(app),
          request.rawRequest.get("Authorization"),
        );
        await access.execute(identity, { apiVersion: 1 });
        const uid = identity.uid,
          generation = envelope.generation!;
        const reauthorize = async () => {
          const current = await verifyIdentity(
            getAuth(app),
            request.rawRequest.get("Authorization"),
          );
          if (current.uid !== uid) throw new AccountError("permission-denied");
        };
        if (envelope.operation === "state")
          return db.runTransaction(
            async (tx) => {
              const state = await authorizeV2(tx, db, uid);
              return {
                apiVersion: 2,
                generation: state.generation,
                memoryEpoch: state.revision,
              };
            },
            { maxAttempts: 3 },
          );
        const payload = envelope.payload,
          reader = new V2Reader(db, uid, generation),
          model = (epoch: number) => v2Provider(db, uid, generation, epoch);
        switch (envelope.operation) {
          case "submit":
            return await new V2Capture(db, undefined, directLocations).execute(
              uid,
              generation,
              submitSchema.parse(payload),
              model,
              reauthorize,
            );
          case "clarify":
            return await new V2Capture(db).execute(
              uid,
              generation,
              clarificationSchema.parse(payload),
              model,
              reauthorize,
            );
          case "operation":
            return await presentSaved(
              db,
              uid,
              generation,
              await new V2WorkStore(db).operation(
                uid,
                generation,
                operationSchema.parse(payload).requestId,
              ),
            );
          case "details": {
            const input = detailsSchema.parse(payload);
            if (input.sourceId)
              return presentGroup(await reader.load(), input.sourceId);
            return {
              apiVersion: 2,
              memoryEpoch: (await reader.readRuntime()).revision,
            };
          }
          case "source": {
            const source = presentGroup(
              await reader.load(),
              sourceSchema.parse(payload).sourceId,
            );
            return {
              apiVersion: 2,
              sourceId: source.sourceId,
              text: source.text,
              receivedAt: source.receivedAt,
              sourceKind: source.sourceKind,
            };
          }
          case "query":
            return await queryV2(
              db,
              uid,
              generation,
              querySchema.parse(payload),
              model,
              reauthorize,
              directLocations,
            );
          case "change":
            return await changeV2(
              db,
              uid,
              generation,
              changeSchema.parse(payload),
              model,
              reauthorize,
              undefined,
              directLocations,
            );
          case "route":
            return await routeV2(
              db,
              uid,
              generation,
              routeSchema.parse(payload),
              model,
              reauthorize,
            );
          case "apply":
            return await applyV2(
              db,
              uid,
              generation,
              applySchema.parse(payload),
              model,
              reauthorize,
            );
        }
      } catch (error) {
        if (error instanceof AccountError)
          throw new HttpsError(error.code, error.code);
        if (error instanceof ZodError)
          throw new HttpsError("invalid-argument", "invalid-argument");
        throw new HttpsError("unavailable", "unavailable");
      }
    },
  );
}
