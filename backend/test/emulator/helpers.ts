import assert from "node:assert/strict";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { z } from "zod";

export const projectId = "demo-kioku-local";
export const region = "europe-west1";

// Destructive fixture setup is allowed only against these exact local emulators.
assert.equal(process.env.GCLOUD_PROJECT, projectId);
assert.equal(process.env.FIRESTORE_EMULATOR_HOST, "127.0.0.1:8087");
assert.equal(process.env.FIREBASE_AUTH_EMULATOR_HOST, "127.0.0.1:9097");
export const adminApp = initializeApp({ projectId }, "emulator-tests");
export const db = getFirestore(adminApp);

const authResult = z.object({ idToken: z.string(), localId: z.string() });

export async function signInGoogle(
  sub: string,
  email = "owner@example.test",
  verified = true,
) {
  const token = JSON.stringify({ sub, email, email_verified: verified });
  const response = await fetch(
    "http://127.0.0.1:9097/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=synthetic",
    {
      method: "POST",
      signal: AbortSignal.timeout(10_000),
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        postBody: new URLSearchParams({
          id_token: token,
          providerId: "google.com",
        }).toString(),
        requestUri: "http://localhost",
        returnSecureToken: true,
      }),
    },
  );
  assert.equal(response.status, 200, "Synthetic Google sign-in failed");
  return authResult.parse(await response.json());
}

export async function callConfiguration(
  token?: string,
  data: unknown = { apiVersion: 1 },
) {
  const response = await fetch(
    `http://127.0.0.1:5007/${projectId}/${region}/getConfiguration`,
    {
      method: "POST",
      signal: AbortSignal.timeout(20_000),
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ data }),
    },
  );
  const body: unknown = await response.json();
  return { status: response.status, body };
}
