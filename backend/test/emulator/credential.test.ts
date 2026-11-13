import assert from "node:assert/strict";
import { beforeEach, after, test } from "node:test";
import { deleteApp } from "firebase-admin/app";
import { FirestoreCredentialStore } from "../../src/firebase/credential-store.js";
import { PromoteCredential } from "../../src/credential/promote-credential.js";
import { adminApp, db } from "./helpers.js";

const owner = db.doc("privateConfiguration/owner");
const metadata = db.doc("privateConfiguration/ai");
const store = new FirestoreCredentialStore(db);
const version = "projects/kioku-9454f/secrets/kioku-openai-owner/versions/1";
const operationId = "7a49c804-39dd-4400-94d5-1b9e81308119";
beforeEach(async () => {
  await owner.set({ uid: "owner", enabled: true, window: 1, count: 1 });
  await metadata.delete();
});
after(async () => {
  await db.terminate();
  await deleteApp(adminApp);
});

test("server activates a validated reference and exposes only status and revision", async () => {
  const key = "sk-" + "synthetic".repeat(5);
  const service = new PromoteCredential(
    store,
    {
      stage: async () => version,
      discard: async () => {
        assert.fail("Unexpected discard");
      },
    },
    { validate: async () => true },
    () => 1000,
  );
  await service.execute({
    uid: "owner",
    expectedRevision: 0,
    operationId,
    key,
  });
  assert.deepEqual(await store.read("owner"), { ai: "ready", revision: 1 });
  assert.equal(
    JSON.stringify((await metadata.get()).data()).includes(key),
    false,
  );
  await assert.rejects(store.read("other"), { code: "permission-denied" });
});

test("concurrent credential activations cannot overwrite each others revision", async () => {
  const first = {
    uid: "owner",
    revision: 1,
    secretVersion: version,
    operationId,
    updatedAtMs: 1000,
  };
  const second = { ...first, secretVersion: version.replace("/1", "/2") };
  const results = await Promise.allSettled([
    store.activate(first, 0),
    store.activate(second, 0),
  ]);
  assert.equal(
    results.filter((result) => result.status === "fulfilled").length,
    1,
  );
  assert.equal(
    results.filter((result) => result.status === "rejected").length,
    1,
  );
  assert.equal((await store.current("owner"))?.revision, 1);
});

test("disabled owner, foreign secret reference and corrupt metadata fail closed", async () => {
  await owner.update({ enabled: false });
  await assert.rejects(store.read("owner"), { code: "permission-denied" });
  await owner.update({ enabled: true });
  await assert.rejects(
    store.activate(
      {
        uid: "owner",
        revision: 1,
        secretVersion: "projects/other/secrets/foreign/versions/1",
        operationId,
        updatedAtMs: 1000,
      },
      0,
    ),
    { code: "failed-precondition" },
  );
  await metadata.set({ uid: "owner", revision: "bad" });
  await assert.rejects(store.read("owner"), { code: "failed-precondition" });
});
