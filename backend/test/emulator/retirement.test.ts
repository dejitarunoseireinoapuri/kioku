import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, beforeEach, test } from "node:test";
import { deleteApp } from "firebase-admin/app";
import { FirestoreSourceRetirementStore } from "../../src/firebase/retirement-store.js";
import { FirestoreCaptureStore } from "../../src/firebase/capture-store.js";
import { FirestoreQueryStore } from "../../src/firebase/query-store.js";
import { at, fixture, seed, uid, vector } from "./retirement-fixtures.js";
import { adminApp, db } from "./helpers.js";

let now = at;
const store = new FirestoreSourceRetirementStore(db, () => now);
const capture = new FirestoreCaptureStore(db, () => now);
const query = new FirestoreQueryStore(db, () => now);
const root = db.doc(`accounts/${uid}`);
beforeEach(async () => {
  now = at;
  await db.recursiveDelete(root);
  await db.recursiveDelete(db.doc("accounts/retirement-other"));
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

test("a confirmed K2 capture stops being saved/readable after retirement, including stale lease completion", async () => {
  const { source, memories } = fixture();
  const work = await capture.begin(uid, {
    apiVersion: 1,
    requestId: source.id,
    mode: "tell",
    channel: "text",
    text: source.text,
    zone: source.zone,
  });
  assert.ok("lease" in work);
  const extraction = {
    status: "saved" as const,
    clarification: null,
    items: memories,
  };
  const snapshot = {
    version: 4 as const,
    sources: [work.lease.pending.turn],
    memories,
  };
  assert.equal(
    (await capture.finish(uid, work.lease, extraction, snapshot)).status,
    "saved",
  );
  assert.equal((await capture.operation(uid, source.id)).status, "saved");
  const scope = await store.inspect(uid, source.id);
  await store.retire(uid, randomUUID(), scope);
  assert.equal((await capture.operation(uid, source.id)).status, "expired");
  await assert.rejects(capture.source(uid, source.id), {
    message: "failed-precondition",
  });
  await assert.rejects(capture.finish(uid, work.lease, extraction, snapshot), {
    message: "failed-precondition",
  });
  await capture.fail(uid, work.lease);
  assert.equal((await capture.operation(uid, source.id)).status, "expired");
  assert.equal((await root.collection("sources").get()).empty, true);
});

test("only a lease tied to retired pending work is invalidated and replay is reauthorized", async () => {
  const { source } = await seed();
  const scope = await store.inspect(uid, source.id);
  const pendingId = randomUUID();
  const nonce = randomUUID();
  await root
    .collection("operations")
    .doc(pendingId)
    .set({ pending: { turn: source }, nonce });
  await root
    .collection("runtime")
    .doc("capture")
    .set({ nonce, expiresAtMs: now + 240_000 });
  const requestId = randomUUID();
  await store.retire(uid, requestId, scope);
  assert.equal(
    (await root.collection("runtime").doc("capture").get()).exists,
    false,
  );
  await db.doc("privateConfiguration/owner").update({ enabled: false });
  await assert.rejects(store.retire(uid, requestId, scope), {
    message: "permission-denied",
  });
});

test("retirement removes entire source and both indexed items atomically, preserving unrelated sources and accounts", async () => {
  const target = await seed();
  const other = await seed();
  const foreign = await seed("retirement-other");
  const before = (
    await root.collection("memories").doc(other.memories[0]!.id).get()
  ).data();
  const scope = await store.inspect(uid, target.source.id);
  const requestId = randomUUID();
  assert.equal(scope.memories.length, 2);
  assert.deepEqual(await store.retire(uid, requestId, scope), {
    status: "forgotten",
    operationId: requestId,
    sourceId: target.source.id,
    removedCount: 2,
  });
  assert.equal(
    (await root.collection("sources").doc(target.source.id).get()).exists,
    false,
  );
  assert.equal(
    (
      await root
        .collection("memories")
        .where("sourceId", "==", target.source.id)
        .get()
    ).empty,
    true,
  );
  assert.deepEqual(
    (await root.collection("memories").doc(other.memories[0]!.id).get()).data(),
    before,
  );
  assert.deepEqual(
    (await root.collection("sources").doc(other.source.id).get()).data(),
    other.source,
  );
  assert.deepEqual(
    (
      await db
        .doc(`accounts/retirement-other/sources/${foreign.source.id}`)
        .get()
    ).data(),
    foreign.source,
  );
  const tombstone = (
    await root.collection("revocations").doc(target.source.id).get()
  ).data();
  assert.deepEqual(Object.keys(tombstone!).sort(), [
    "inputHash",
    "operationId",
    "removedCount",
    "retiredAtMs",
  ]);
  assert.equal(JSON.stringify(tombstone).includes("Loto"), false);
  assert.equal("expiresAt" in tombstone!, false);
  const retrieved = await query.retrieve(uid, "Loto", vector());
  assert.equal(
    retrieved.snapshot.sources.some((source) => source.id === target.source.id),
    false,
  );
});

test("same command is idempotent concurrently and after receipt expiry; changed identity or scope conflicts", async () => {
  const { source } = await seed();
  const scope = await store.inspect(uid, source.id);
  const requestId = randomUUID();
  const [first, replay] = await Promise.all([
    store.retire(uid, requestId, scope),
    store.retire(uid, requestId, scope),
  ]);
  assert.deepEqual(first, replay);
  await root.collection("operations").doc(requestId).delete();
  now += 8 * 86_400_000;
  assert.deepEqual(await store.retire(uid, requestId, scope), first);
  await assert.rejects(store.retire(uid, randomUUID(), scope), {
    message: "failed-precondition",
  });
  await assert.rejects(
    store.retire(uid, requestId, {
      ...scope,
      expiresAtMs: scope.expiresAtMs + 1,
    }),
    { message: "failed-precondition" },
  );
  assert.equal((await root.collection("revocations").get()).size, 1);
});

test("changed source, changed item, changed membership and expired resolution never partially delete", async () => {
  for (const change of ["source", "item", "membership", "expiry"] as const) {
    const { source, memories } = await seed();
    const scope = await store.inspect(uid, source.id);
    if (change === "source")
      await root
        .collection("sources")
        .doc(source.id)
        .update({ text: "Un original cambiado." });
    if (change === "item")
      await root
        .collection("memories")
        .doc(memories[0]!.id)
        .update({ revision: 2 });
    if (change === "membership")
      await root
        .collection("memories")
        .doc(`${source.id}-3`)
        .set({ ...memories[0], id: `${source.id}-3` });
    if (change === "expiry") now += 300_001;
    await assert.rejects(store.retire(uid, randomUUID(), scope), {
      message: "failed-precondition",
    });
    assert.equal(
      (await root.collection("sources").doc(source.id).get()).exists,
      true,
    );
    assert.equal(
      (await root.collection("memories").doc(memories[0]!.id).get()).exists,
      true,
    );
    assert.equal(
      (await root.collection("revocations").doc(source.id).get()).exists,
      false,
    );
  }
});

test("disabled and other owners cannot inspect, retire, or replay a resolved target", async () => {
  const { source } = await seed();
  const scope = await store.inspect(uid, source.id);
  await assert.rejects(store.inspect("retirement-other", source.id), {
    message: "permission-denied",
  });
  await assert.rejects(store.retire("retirement-other", randomUUID(), scope), {
    message: "permission-denied",
  });
  await db.doc("privateConfiguration/owner").update({ enabled: false });
  await assert.rejects(store.retire(uid, randomUUID(), scope), {
    message: "permission-denied",
  });
  await assert.rejects(store.inspect(uid, source.id), {
    message: "permission-denied",
  });
  assert.equal(
    (await root.collection("sources").doc(source.id).get()).exists,
    true,
  );
});

test("old capture/query IDs and terminal receipts cannot recreate or claim a retired source", async () => {
  const { source } = await seed();
  await store.retire(uid, randomUUID(), await store.inspect(uid, source.id));
  await db.recursiveDelete(root.collection("operations"));
  await assert.rejects(
    capture.begin(uid, {
      apiVersion: 1,
      requestId: source.id,
      mode: "tell",
      channel: "text",
      text: source.text,
      zone: source.zone,
    }),
    { message: "failed-precondition" },
  );
  await assert.rejects(
    query.begin(uid, { apiVersion: 1, requestId: source.id, text: "Loto" }),
    { message: "failed-precondition" },
  );
  assert.equal((await capture.operation(uid, source.id)).status, "expired");
  await assert.rejects(capture.source(uid, source.id), {
    message: "failed-precondition",
  });
  assert.equal((await root.collection("sources").get()).empty, true);
});

test("an in-flight query cannot finish with evidence removed during inference", async () => {
  const { source } = await seed();
  const work = await query.begin(uid, {
    apiVersion: 1,
    requestId: randomUUID(),
    text: "Loto",
  });
  assert.ok(!("status" in work));
  const evidence = await query.retrieve(uid, "Loto", vector());
  await store.retire(uid, randomUUID(), await store.inspect(uid, source.id));
  await assert.rejects(query.finish(uid, work, evidence), {
    message: "failed-precondition",
  });
  assert.equal(
    (await query.retrieve(uid, "Loto", vector())).snapshot.memories.length,
    0,
  );
  await query.fail(uid, work);
});

test("linked pending text and saved receipts are scrubbed, while unrelated work and its lease survive", async () => {
  const { source } = await seed();
  const unrelated = randomUUID();
  const pendingId = randomUUID();
  await root
    .collection("operations")
    .doc(pendingId)
    .set({
      state: "failed",
      pending: { turn: source },
      question: "Loto?",
      nonce: "old",
    });
  await root
    .collection("operations")
    .doc(source.id)
    .set({ state: "saved", sourceId: source.id, nonce: "old" });
  await root
    .collection("operations")
    .doc(unrelated)
    .set({
      pending: { turn: { id: unrelated, text: "Otro asunto." } },
      nonce: "unrelated",
    });
  const lock = { nonce: "unrelated", expiresAtMs: now + 240_000 };
  await root.collection("runtime").doc("capture").set(lock);
  await store.retire(uid, randomUUID(), await store.inspect(uid, source.id));
  for (const id of [pendingId, source.id]) {
    const receipt = (await root.collection("operations").doc(id).get()).data();
    assert.deepEqual(Object.keys(receipt!).sort(), ["expiresAt", "kind"]);
    assert.equal((await capture.operation(uid, id)).status, "expired");
  }
  assert.deepEqual(
    (await root.collection("runtime").doc("capture").get()).data(),
    lock,
  );
  assert.equal(
    (await root.collection("operations").doc(unrelated).get()).get("nonce"),
    "unrelated",
  );
});

test("revocation blocks stale reconstructed canonical data and stale capture workers", async () => {
  const turn = {
    apiVersion: 1 as const,
    requestId: randomUUID(),
    mode: "tell" as const,
    channel: "text" as const,
    text: "Quiero ver Loto.",
    zone: "Europe/Madrid",
  };
  const work = await capture.begin(uid, turn);
  assert.ok("lease" in work);
  // Emulate an older snapshot being reintroduced by a future stale administrative job.
  const target = await seed();
  const memoryData = (
    await root.collection("memories").doc(target.memories[0]!.id).get()
  ).data()!;
  await store.retire(
    uid,
    randomUUID(),
    await store.inspect(uid, target.source.id),
  );
  await root.collection("sources").doc(target.source.id).set(target.source);
  await root.collection("memories").doc(target.memories[0]!.id).set(memoryData);
  await assert.rejects(capture.source(uid, target.source.id), {
    message: "failed-precondition",
  });
  await assert.rejects(query.retrieve(uid, "Loto", vector()), {
    message: "failed-precondition",
  });
  // A source revocation also wins over a valid, still-running capture lease.
  await root
    .collection("revocations")
    .doc(work.lease.pending.turn.id)
    .set({ retiredAtMs: now });
  await assert.rejects(
    capture.finish(
      uid,
      work.lease,
      { status: "ignored", clarification: null, items: [] },
      { version: 4, sources: [], memories: [] },
    ),
    { message: "failed-precondition" },
  );
});

test("oversized scope and operation collisions fail without deleting canonical content", async () => {
  const { source } = await seed();
  const scope = await store.inspect(uid, source.id);
  const collision = await seed();
  await assert.rejects(store.retire(uid, collision.source.id, scope), {
    message: "failed-precondition",
  });
  const requestId = randomUUID();
  await root.collection("operations").doc(requestId).set({ kind: "query" });
  await assert.rejects(store.retire(uid, requestId, scope), {
    message: "failed-precondition",
  });
  for (let index = 0; index < 9; index++)
    await root
      .collection("operations")
      .doc(randomUUID())
      .set({ sourceId: source.id });
  await assert.rejects(store.retire(uid, randomUUID(), scope), {
    message: "resource-exhausted",
  });
  assert.equal(
    (await root.collection("sources").doc(source.id).get()).exists,
    true,
  );
  assert.equal((await root.collection("revocations").get()).empty, true);
});
