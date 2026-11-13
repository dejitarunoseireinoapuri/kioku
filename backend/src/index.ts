import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { AccountError } from "./account/contracts.js";
import { GetConfiguration } from "./account/get-configuration.js";
import { FirestoreOwnerAccess } from "./firebase/owner-access.js";
import { verifyIdentity } from "./firebase/verify-identity.js";
import { FirestoreCredentialStore } from "./firebase/credential-store.js";
import { backendRuntime } from "./firebase/runtime.js";
import { memoryCallables } from "./memory/callables.js";

const runtime = backendRuntime(process.env);
const app = initializeApp({ projectId: runtime.projectId });
export const { submitTurn, resolveClarification, getOperation, getSource } =
  memoryCallables(app, getFirestore(app), runtime);
const configuration = new GetConfiguration(
  runtime.allowedEmail,
  new FirestoreOwnerAccess(getFirestore(app)),
  Date.now,
  new FirestoreCredentialStore(getFirestore(app)),
);

export const getConfiguration = onCall(
  {
    region: "europe-west1",
    timeoutSeconds: 15,
    maxInstances: 1,
    concurrency: 8,
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
      ) {
        throw new AccountError("permission-denied");
      }
      if (request.rawRequest.rawBody.byteLength > 256) {
        throw new AccountError("invalid-argument");
      }
      // Recheck disabled users/revoked sessions; callable parsing alone is insufficient.
      const identity = await verifyIdentity(
        getAuth(app),
        request.rawRequest.get("Authorization"),
      );
      return await configuration.execute(identity, request.data);
    } catch (error) {
      // Never return raw SDK errors, token claims, email or request data.
      if (error instanceof AccountError)
        throw new HttpsError(error.code, error.code);
      throw new HttpsError("unavailable", "unavailable");
    }
  },
);
