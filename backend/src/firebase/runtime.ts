import { AccountError } from "../account/contracts.js";
import { z } from "zod";

export const LOCAL_PROJECT = "demo-kioku-local";
export const LOCAL_EMAIL = "owner@example.test";

export interface BackendRuntime {
  readonly production: boolean;
  readonly projectId: string;
  readonly allowedEmail: string;
  readonly appIds: readonly string[];
}

export function backendRuntime(env: NodeJS.ProcessEnv): BackendRuntime {
  if (env.FUNCTIONS_EMULATOR === "true") {
    requireLocalRuntime(env);
    return {
      production: false,
      projectId: LOCAL_PROJECT,
      allowedEmail: LOCAL_EMAIL,
      appIds: [],
    };
  }
  const android = env.KIOKU_ANDROID_APP_ID;
  const ios = env.KIOKU_IOS_APP_ID;
  if (
    env.KIOKU_ENVIRONMENT !== "production" ||
    env.GCLOUD_PROJECT !== "kioku-9454f" ||
    env.FIRESTORE_EMULATOR_HOST ||
    env.FIREBASE_AUTH_EMULATOR_HOST ||
    !z.email().safeParse(env.KIOKU_ALLOWED_EMAIL).success ||
    !android ||
    !/^1:1008044927836:android:[a-fA-F0-9]+$/.test(android) ||
    !ios ||
    !/^1:1008044927836:ios:[a-fA-F0-9]+$/.test(ios)
  ) {
    throw new AccountError("failed-precondition");
  }
  return {
    production: true,
    projectId: "kioku-9454f",
    allowedEmail: env.KIOKU_ALLOWED_EMAIL!,
    appIds: [android, ios],
  };
}

/** Emulator access is confined to the isolated synthetic project and exact loopback ports. */
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
