import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";

const projectId = "demo-kioku-local";
if (
    process.argv.slice(2).join(" ") !== "--local-trial" ||
    process.env.GCLOUD_PROJECT !== projectId ||
    process.env.FIREBASE_AUTH_EMULATOR_HOST !== "127.0.0.1:9097" ||
    process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:8087"
) {
    throw new Error("The location trial requires the isolated local emulators.");
}

const require = createRequire(new URL("../backend/package.json", import.meta.url));
const { initializeApp, deleteApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const identity = JSON.stringify({ sub: "kioku-location-trial", email: "owner@example.test", email_verified: true });
const response = await fetch("http://127.0.0.1:9097/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=synthetic", {
    method: "POST",
    signal: AbortSignal.timeout(10_000),
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
        postBody: new URLSearchParams({ id_token: identity, providerId: "google.com" }).toString(),
        requestUri: "http://localhost",
        returnSecureToken: false,
    }),
});
if (!response.ok) throw new Error("The local fixture sign-in did not succeed.");
const { localId: uid } = await response.json();
if (typeof uid !== "string" || !/^[A-Za-z0-9_-]{1,128}$/u.test(uid)) throw new Error("Invalid local fixture account.");

const app = initializeApp({ projectId }, "location-trial-setup");
const db = getFirestore(app);
try {
    await db.runTransaction(async (transaction) => {
        const owner = db.doc("privateConfiguration/owner");
        const ai = db.doc("privateConfiguration/ai");
        const runtime = db.doc(`accounts/${uid}/runtime/memory`);
        const [currentOwner, credential, currentRuntime] = await transaction.getAll(owner, ai, runtime);
        if (credential.exists || (currentOwner.exists && (currentOwner.get("uid") !== uid || currentOwner.get("enabled") !== true))) {
            throw new Error("An unexpected account or AI credential exists in the trial project.");
        }
        if (currentRuntime.exists && (currentRuntime.get("schemaVersion") !== 2 || currentRuntime.get("status") !== "active")) {
            throw new Error("The trial memory is not active.");
        }
        if (!currentOwner.exists) transaction.set(owner, { uid, enabled: true, window: 0, count: 1 });
        if (!currentRuntime.exists) transaction.set(runtime, { schemaVersion: 2, status: "active", generation: randomUUID(), revision: 0 });
    }, { maxAttempts: 3 });
} finally {
    await db.terminate();
    await deleteApp(app);
}

console.log("LOCATION_TRIAL_READY");
// The parent Firebase CLI keeps the three emulators open while this process runs.
const keepAlive = setInterval(() => undefined, 60_000);
for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, () => clearInterval(keepAlive));
