import { getAuth } from "firebase-admin/auth";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import type { App } from "firebase-admin/app";
import type { Firestore } from "firebase-admin/firestore";
import type { BackendRuntime } from "../firebase/runtime.js";
import { AccountError } from "../account/contracts.js";
import { GetConfiguration } from "../account/get-configuration.js";
import { verifyIdentity } from "../firebase/verify-identity.js";
import { FirestoreOwnerAccess } from "../firebase/owner-access.js";
import { FirestoreQueryStore } from "../firebase/query-store.js";
import { memoryProvider } from "../credential/memory-provider.js";
import { parseInput } from "../memory/contracts.js";
import { queryInput } from "./contracts.js";
import { QueryMemory } from "./query.js";

export function queryCallable(
  app: App,
  db: Firestore,
  runtime: BackendRuntime,
) {
  const access = new GetConfiguration(
    runtime.allowedEmail,
    new FirestoreOwnerAccess(db),
    Date.now,
  );
  const query = new QueryMemory(new FirestoreQueryStore(db));
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
        if (request.rawRequest.rawBody.byteLength > 12_000)
          throw new AccountError("invalid-argument");
        const identity = await verifyIdentity(
          getAuth(app),
          request.rawRequest.get("Authorization"),
        );
        await access.execute(identity, { apiVersion: 1 });
        return await query.execute(
          identity.uid,
          parseInput(queryInput, request.data),
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
      } catch (error) {
        if (error instanceof AccountError)
          throw new HttpsError(error.code, error.code);
        throw new HttpsError("unavailable", "unavailable");
      }
    },
  );
}
