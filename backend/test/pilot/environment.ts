import { initializeApp, deleteApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { randomUUID } from "node:crypto";
import { z } from "zod";

export const projectId = "demo-kioku-sources";
if (
  process.env.GCLOUD_PROJECT !== projectId ||
  process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:8187" ||
  process.env.FIREBASE_AUTH_EMULATOR_HOST !== "127.0.0.1:9197"
)
  throw new Error("Reference pilot requires its isolated demo emulators.");
const app = initializeApp({ projectId }, "reference-pilot");
export const db = getFirestore(app);
export const auth = getAuth(app);

export async function pilotSession() {
  const response = await fetch(
    "http://127.0.0.1:9197/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=synthetic",
    {
      method: "POST",
      signal: AbortSignal.timeout(10_000),
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        postBody: new URLSearchParams({
          providerId: "google.com",
          id_token: JSON.stringify({
            sub: "reference-pilot-fictional-owner",
            email: "source-owner@example.test",
            email_verified: true,
          }),
        }).toString(),
        requestUri: "http://localhost",
        returnSecureToken: true,
      }),
    },
  );
  if (!response.ok) throw new Error("Synthetic sign-in unavailable.");
  return z
    .object({ idToken: z.string(), localId: z.string() })
    .parse(await response.json());
}

const session = await pilotSession();
export const uid = session.localId;
const owner = await db.doc("privateConfiguration/owner").get();
if (owner.exists && owner.get("uid") !== uid)
  throw new Error("Unexpected demo owner.");
await db.doc("privateConfiguration/owner").set({ uid, enabled: true });
const runtime = db.doc(`accounts/${uid}/runtime/memory`);
if (!(await runtime.get()).exists)
  await runtime.create({
    schemaVersion: 2,
    status: "active",
    generation: randomUUID(),
    revision: 0,
  });
export const generation = z
  .uuid()
  .parse((await runtime.get()).get("generation"));

export async function closePilotEnvironment() {
  await db.terminate();
  await deleteApp(app);
}
