import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { AccountError } from "./account/contracts.js";
import { GetConfiguration } from "./account/get-configuration.js";
import { FirestoreOwnerAccess } from "./firebase/owner-access.js";
import { verifyIdentity } from "./firebase/verify-identity.js";
import {
  LOCAL_EMAIL,
  LOCAL_PROJECT,
  requireLocalRuntime,
} from "./firebase/runtime.js";

// A local-only entry point fails before initializing SDKs in any remote project.
requireLocalRuntime(process.env);
const app = initializeApp({ projectId: LOCAL_PROJECT });
const configuration = new GetConfiguration(
  LOCAL_EMAIL,
  new FirestoreOwnerAccess(getFirestore(app)),
  Date.now,
);

export const getConfiguration = onCall(
  {
    region: "europe-west1",
    timeoutSeconds: 15,
    maxInstances: 1,
    concurrency: 8,
  },
  async (request) => {
    try {
      if (!request.auth) throw new AccountError("unauthenticated");
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
