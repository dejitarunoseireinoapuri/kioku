import { AccountError } from "../account/contracts.js";

export const LOCAL_PROJECT = "demo-kioku-local";
export const LOCAL_EMAIL = "owner@example.test";

/** No production entry point until attestation, credentials and native setup are ready. */
export function requireLocalRuntime(env: NodeJS.ProcessEnv): void {
  if (
    env.FUNCTIONS_EMULATOR !== "true" ||
    env.GCLOUD_PROJECT !== LOCAL_PROJECT ||
    env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:8087" ||
    env.FIREBASE_AUTH_EMULATOR_HOST !== "127.0.0.1:9097"
  ) {
    throw new AccountError("failed-precondition");
  }
}
