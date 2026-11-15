import test, { beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { deleteApp } from "firebase-admin/app";
import { PresentSourceMemories } from "../../src/memory-control/presentation.js";
import { FirestoreSourceControlStore } from "../../src/firebase/source-control-store.js";
import { adminApp, db } from "./helpers.js";
import { seed, uid } from "./retirement-fixtures.js";

const root = db.doc(`accounts/${uid}`);
const store = new FirestoreSourceControlStore(db);
const service = new PresentSourceMemories(store);
beforeEach(async () => {
  await db.recursiveDelete(root);
  await db
    .doc("privateConfiguration/owner")
    .set({ uid, enabled: true, window: 0, count: 1 });
  await db
    .doc("privateConfiguration/search")
    .set({ uid, schema: 1, ready: true });
});
after(async () => {
  await db.terminate();
  await deleteApp(adminApp);
});

test("authorized source presentation preserves canonical Firestore text and version", async () => {
  const target = await seed();
  const before = await store.details(uid, target.source.id);
  const result = await service.execute(
    uid,
    target.source.id,
    async () => ({
      async presentMemories() {
        return { items: target.memories.map(({ id, text }) => ({ id, text })) };
      },
      async reviewMemoryPresentation() {
        return {
          faithful: true,
          ownerPerspective: true,
          attributionPreserved: true,
        };
      },
    }),
    async () => {},
  );
  assert.equal(result.version, before.version);
  assert.deepEqual(await store.details(uid, target.source.id), before);
});

test("a foreign owner cannot trigger provider access or read a source presentation", async () => {
  const target = await seed();
  await root
    .collection("sources")
    .doc(target.source.id)
    .update({ ownerTextVersion: 1 });
  let called = false;
  await assert.rejects(
    service.execute(
      "other-owner",
      target.source.id,
      async () => {
        called = true;
        throw new Error("Provider must not be reached");
      },
      async () => {},
    ),
  );
  assert.equal(called, false);
});

test("server-marked owner text is returned without provider access or changing its facts", async () => {
  const target = await seed();
  await root
    .collection("sources")
    .doc(target.source.id)
    .update({ ownerTextVersion: 1 });
  const before = await store.details(uid, target.source.id);
  const result = await service.execute(
    uid,
    target.source.id,
    async () => {
      throw new Error("Current owner text must not be regenerated");
    },
    async () => {},
  );
  assert.deepEqual(result, before);
  assert.equal((await store.bundle(uid, target.source.id)).ownerTextVersion, 1);
});

test("owner text fast path reauthorizes and rejects retirement during its read", async () => {
  const target = await seed();
  await root
    .collection("sources")
    .doc(target.source.id)
    .update({ ownerTextVersion: 1 });
  let reauthorized = false;
  await assert.rejects(
    service.execute(
      uid,
      target.source.id,
      async () => {
        throw new Error("Provider must not be reached");
      },
      async () => {
        reauthorized = true;
        await root
          .collection("revocations")
          .doc(target.source.id)
          .set({ operationId: "withdrawn" });
      },
    ),
  );
  assert.equal(reauthorized, true);
});

test("unrecognized owner text versions keep independent legacy presentation verification", async () => {
  const target = await seed();
  await root
    .collection("sources")
    .doc(target.source.id)
    .update({ ownerTextVersion: 999 });
  assert.equal(
    (await store.bundle(uid, target.source.id)).ownerTextVersion,
    undefined,
  );
  await assert.rejects(
    service.execute(
      uid,
      target.source.id,
      async () => ({
        async presentMemories() {
          return {
            items: target.memories.map(({ id, text }) => ({ id, text })),
          };
        },
        async reviewMemoryPresentation() {
          return {
            faithful: false,
            ownerPerspective: true,
            attributionPreserved: true,
          };
        },
      }),
      async () => {},
    ),
  );
});

test("retiring a source while its presentation is computed prevents the stale response", async () => {
  const target = await seed();
  await assert.rejects(
    service.execute(
      uid,
      target.source.id,
      async () => ({
        async presentMemories() {
          return {
            items: target.memories.map(({ id, text }) => ({ id, text })),
          };
        },
        async reviewMemoryPresentation() {
          await root.collection("sources").doc(target.source.id).delete();
          return {
            faithful: true,
            ownerPerspective: true,
            attributionPreserved: true,
          };
        },
      }),
      async () => {},
    ),
  );
});
