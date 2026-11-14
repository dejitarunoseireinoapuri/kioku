import { getAuth } from "firebase-admin/auth";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import type { App } from "firebase-admin/app";
import type { Firestore } from "firebase-admin/firestore";
import type { BackendRuntime } from "../firebase/runtime.js";
import { AccountError } from "../account/contracts.js";
import { GetConfiguration } from "../account/get-configuration.js";
import { FirestoreOwnerAccess } from "../firebase/owner-access.js";
import { verifyIdentity } from "../firebase/verify-identity.js";
import { FirestoreRoutingStore } from "../firebase/routing-store.js";
import { FirestoreSourceControlStore } from "../firebase/source-control-store.js";
import { FirestoreCaptureStore } from "../firebase/capture-store.js";
import { memoryProvider } from "../credential/memory-provider.js";
import { parseInput } from "../memory/contracts.js";
import { decisionInput, routingInput } from "./contracts.js";
import { RouteMessage } from "./route.js";
import { ApplyMessage } from "./apply.js";

export function conversationCallables(
  app: App,
  db: Firestore,
  runtime: BackendRuntime,
) {
  const store = new FirestoreRoutingStore(db);
  const sources = new FirestoreSourceControlStore(db);
  const route = new RouteMessage(store, sources);
  const apply = new ApplyMessage(
    store,
    sources,
    (memoryEpoch, receivedAt) =>
      new FirestoreCaptureStore(db, Date.now, { memoryEpoch, receivedAt }),
  );
  const access = new GetConfiguration(
    runtime.allowedEmail,
    new FirestoreOwnerAccess(db),
    Date.now,
  );
  const callable = (operation: "route" | "apply") =>
    onCall(
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
          if (request.rawRequest.rawBody.byteLength > 64_000)
            throw new AccountError("invalid-argument");
          const identity = await verifyIdentity(
            getAuth(app),
            request.rawRequest.get("Authorization"),
          );
          await access.execute(identity, { apiVersion: 1 });
          const reauthorize = async () => {
            const current = await verifyIdentity(
              getAuth(app),
              request.rawRequest.get("Authorization"),
            );
            if (current.uid !== identity.uid)
              throw new AccountError("permission-denied");
            // Initial admission is counted once. Final transactions recheck the enabled owner.
          };
          return operation === "route"
            ? await route.execute(
                identity.uid,
                parseInput(routingInput, request.data),
                () => memoryProvider(db, identity.uid),
                reauthorize,
              )
            : await apply.execute(
                identity.uid,
                parseInput(decisionInput, request.data),
                () => memoryProvider(db, identity.uid),
                reauthorize,
              );
        } catch (error) {
          if (error instanceof AccountError)
            throw new HttpsError(error.code, error.code);
          throw new HttpsError("unavailable", "unavailable");
        }
      },
    );
  return { routeMessage: callable("route"), applyMessage: callable("apply") };
}
