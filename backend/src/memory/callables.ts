import { getAuth } from "firebase-admin/auth";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import type { App } from "firebase-admin/app";
import type { Firestore } from "firebase-admin/firestore";
import type { BackendRuntime } from "../firebase/runtime.js";
import { verifyIdentity } from "../firebase/verify-identity.js";
import { AccountError } from "../account/contracts.js";
import { GetConfiguration } from "../account/get-configuration.js";
import { FirestoreOwnerAccess } from "../firebase/owner-access.js";
import { FirestoreCaptureStore } from "../firebase/capture-store.js";
import { CaptureMemory } from "./capture.js";
import { memoryProvider } from "../credential/memory-provider.js";
import {
  captureInput,
  clarificationInput,
  operationInput,
  parseInput,
  sourceInput,
} from "./contracts.js";
import type { CaptureResult } from "./contracts.js";

export function memoryCallables(
  app: App,
  db: Firestore,
  runtime: BackendRuntime,
) {
  const access = new GetConfiguration(
    runtime.allowedEmail,
    new FirestoreOwnerAccess(db),
    Date.now,
  );
  const store = new FirestoreCaptureStore(db),
    capture = new CaptureMemory(store);
  async function present(uid: string, result: CaptureResult) {
    return result.status === "saved"
      ? { ...result, source: await store.source(uid, result.sourceId) }
      : result;
  }
  function callable(
    operation:
      | "submitTurn"
      | "resolveClarification"
      | "getOperation"
      | "getSource",
  ) {
    return onCall(
      {
        region: "europe-west1",
        timeoutSeconds: 180,
        maxInstances: 1,
        concurrency: 4,
        enforceAppCheck: runtime.production,
        ...(runtime.production
          ? {
              serviceAccount:
                "kioku-runtime@kioku-9454f.iam.gserviceaccount.com",
              invoker: "public",
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
          if (request.rawRequest.rawBody.byteLength > 40_000)
            throw new AccountError("invalid-argument");
          const identity = await verifyIdentity(
            getAuth(app),
            request.rawRequest.get("Authorization"),
          );
          await access.execute(identity, { apiVersion: 1 });
          if (operation === "getOperation")
            return await present(
              identity.uid,
              await store.operation(
                identity.uid,
                parseInput(operationInput, request.data).requestId,
              ),
            );
          if (operation === "getSource")
            return {
              apiVersion: 1,
              ...(await store.source(
                identity.uid,
                parseInput(sourceInput, request.data).sourceId,
              )),
            };
          const input =
            operation === "submitTurn"
              ? parseInput(captureInput, request.data)
              : parseInput(clarificationInput, request.data);
          const result = await capture.execute(
            identity.uid,
            input,
            () => memoryProvider(db, identity.uid),
            async () => {
              const current = await verifyIdentity(
                getAuth(app),
                request.rawRequest.get("Authorization"),
              );
              if (current.uid !== identity.uid)
                throw new AccountError("permission-denied");
              await access.execute(current, { apiVersion: 1 });
            },
          );
          return await present(identity.uid, result);
        } catch (error) {
          if (error instanceof AccountError)
            throw new HttpsError(error.code, error.code);
          throw new HttpsError("unavailable", "unavailable");
        }
      },
    );
  }
  return {
    submitTurn: callable("submitTurn"),
    resolveClarification: callable("resolveClarification"),
    getOperation: callable("getOperation"),
    getSource: callable("getSource"),
  };
}
