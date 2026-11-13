import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, beforeEach, test } from "node:test";
import { deleteApp } from "firebase-admin/app";
import { CaptureMemory } from "../../src/memory/capture.js";
import { FirestoreCaptureStore } from "../../src/firebase/capture-store.js";
import { FirestoreMemoryBudget } from "../../src/firebase/memory-budget.js";
import type { CaptureInput } from "../../src/memory/contracts.js";
import type { MemoryIntelligence, Turn } from "#memory-core/domain";
import { adminApp, db } from "./helpers.js";

const uid = "capture-owner";
let now = Date.UTC(2026, 10, 13, 12);
const store = new FirestoreCaptureStore(db, () => now);
const capture = new CaptureMemory(store);
const allowed = async () => {};
const input = (text = "Quiero ver Perfect Days."): CaptureInput => ({
  apiVersion: 1,
  requestId: randomUUID(),
  mode: "tell",
  channel: "text",
  text,
  zone: "Europe/Madrid",
});
const intelligence: MemoryIntelligence = {
  async extract(turn: Turn) {
    return {
      status: "saved",
      clarification: null,
      items: [
        {
          text: turn.text,
          quote: turn.text,
          kind: "intention",
          entities: ["Perfect Days"],
          time: { precision: "unknown", value: null, end: null, quote: null },
          provenance: "personal",
          attribution: null,
          attributionEvidence: null,
          eventStatus: "planned",
          lifecycle: "current",
        },
      ],
    };
  },
  async embed(texts) {
    return texts.map(() => Array.from({ length: 512 }, () => 0.5));
  },
  async answer() {
    throw new Error("Queries are outside K2");
  },
};
beforeEach(async () => {
  now = Date.UTC(2026, 10, 13, 12);
  await db.recursiveDelete(db.doc(`accounts/${uid}`));
  await db
    .doc("privateConfiguration/owner")
    .set({ uid, enabled: true, window: 0, count: 1 });
});
after(async () => {
  await db.terminate();
  await deleteApp(adminApp);
});

test("source/items and receipt commit together; replay is idempotent and conflicting reuse fails", async () => {
  const turn = input();
  let calls = 0;
  const provider = async () => {
    calls++;
    return intelligence;
  };
  const saved = await capture.execute(uid, turn, provider, allowed);
  assert.equal(saved.status, "saved");
  assert.deepEqual(await capture.execute(uid, turn, provider, allowed), saved);
  assert.equal(calls, 1);
  assert.equal((await db.collection(`accounts/${uid}/sources`).get()).size, 1);
  assert.equal((await db.collection(`accounts/${uid}/memories`).get()).size, 1);
  assert.equal((await store.source(uid, turn.requestId)).text, turn.text);
  await assert.rejects(
    capture.execute(uid, { ...turn, text: "Otro relato" }, provider, allowed),
    { message: "failed-precondition" },
  );
  const receipt = (
    await db.doc(`accounts/${uid}/operations/${turn.requestId}`).get()
  ).data();
  assert.equal(receipt?.pending, null);
  assert.equal(JSON.stringify(receipt).includes("Perfect Days"), false);
});

test("clarification is not memory; only its revision can continue the original source", async () => {
  const turn = input("Él me dijo que quería ver Perfect Days.");
  const pending = await capture.execute(
    uid,
    turn,
    async () => intelligence,
    allowed,
  );
  assert.equal(pending.status, "needsClarification");
  if (pending.status !== "needsClarification") return;
  assert.equal(
    (await db.collection(`accounts/${uid}/sources`).get()).empty,
    true,
  );
  const answer = {
    apiVersion: 1 as const,
    requestId: randomUUID(),
    clarificationId: pending.clarificationId,
    expectedRevision: pending.revision,
    text: "Me refiero a Pablo.",
  };
  const saved = await capture.execute(
    uid,
    answer,
    async () => intelligence,
    allowed,
  );
  assert.equal(saved.status, "saved");
  assert.equal(
    (await store.source(uid, turn.requestId)).text,
    `${turn.text}\nAclaración: ${answer.text}`,
  );
  assert.equal((await store.operation(uid, turn.requestId)).status, "saved");
  await assert.rejects(
    capture.execute(
      uid,
      { ...answer, requestId: randomUUID() },
      async () => intelligence,
      allowed,
    ),
  );
});

test("failed provider leaves no canonical data; explicit retry keeps the same request identity", async () => {
  const turn = input();
  await assert.rejects(
    capture.execute(
      uid,
      turn,
      async () => ({
        ...intelligence,
        async embed() {
          throw new Error("Synthetic network failure");
        },
      }),
      allowed,
    ),
  );
  assert.equal(
    (await db.collection(`accounts/${uid}/sources`).get()).empty,
    true,
  );
  assert.equal((await store.operation(uid, turn.requestId)).status, "failed");
  assert.equal(
    (await capture.execute(uid, turn, async () => intelligence, allowed))
      .status,
    "saved",
  );
  assert.equal((await db.collection(`accounts/${uid}/sources`).get()).size, 1);
});

test("parallel operations are bounded, stale attempts cannot commit and disabled owners cannot read", async () => {
  const first = await store.begin(uid, input());
  assert.ok("lease" in first);
  await assert.rejects(store.begin(uid, input()), {
    message: "resource-exhausted",
  });
  await db.doc("privateConfiguration/owner").update({ enabled: false });
  await assert.rejects(store.operation(uid, first.lease.requestId), {
    message: "permission-denied",
  });
  await assert.rejects(
    store.source("different-owner", first.lease.pending.turn.id),
    { message: "permission-denied" },
  );
  await assert.rejects(
    store.finish(
      uid,
      first.lease,
      { status: "ignored", clarification: null, items: [] },
      { version: 4, sources: [], memories: [] },
    ),
    { message: "permission-denied" },
  );
  assert.equal(
    (await db.collection(`accounts/${uid}/sources`).get()).empty,
    true,
  );
});

test("late workers lose their lease; replay recovers only the new committed attempt", async () => {
  const turn = input();
  const first = await store.begin(uid, turn);
  assert.ok("lease" in first);
  now += 241_000;
  const second = await store.begin(uid, turn);
  assert.ok("lease" in second);
  await assert.rejects(
    store.finish(
      uid,
      first.lease,
      { status: "ignored", clarification: null, items: [] },
      { version: 4, sources: [], memories: [] },
    ),
    { message: "failed-precondition" },
  );
  assert.equal(
    (
      await store.finish(
        uid,
        second.lease,
        { status: "ignored", clarification: null, items: [] },
        { version: 4, sources: [], memories: [] },
      )
    ).status,
    "ignored",
  );
});

test("expired clarification exposes no question or source and rejects continuation", async () => {
  const turn = input("Él me dijo algo.");
  const result = await capture.execute(
    uid,
    turn,
    async () => intelligence,
    allowed,
  );
  assert.equal(result.status, "needsClarification");
  now += 86_400_001;
  assert.deepEqual(await store.operation(uid, turn.requestId), {
    apiVersion: 1,
    status: "expired",
    operationId: turn.requestId,
  });
  await assert.rejects(
    store.begin(uid, {
      apiVersion: 1,
      requestId: randomUUID(),
      clarificationId: turn.requestId,
      expectedRevision: 1,
      text: "Pablo",
    }),
  );
});

test("reauthorization failure after inference cannot save content", async () => {
  const turn = input();
  await assert.rejects(
    capture.execute(
      uid,
      turn,
      async () => intelligence,
      async () => {
        throw new Error("Synthetic revoked identity");
      },
    ),
  );
  assert.equal(
    (await db.collection(`accounts/${uid}/sources`).get()).empty,
    true,
  );
});

test("distributed budget admits bounded reservations and keeps only numeric usage", async () => {
  const day = new Date(now).toISOString().slice(0, 10);
  await db
    .doc(`accounts/${uid}/usage/${day}`)
    .set({ reservedUsd: 9.5, calls: 0 });
  const results = await Promise.allSettled(
    Array.from({ length: 4 }, () =>
      new FirestoreMemoryBudget(db, uid, now).reserve(0.25),
    ),
  );
  assert.equal(
    results.filter((value) => value.status === "fulfilled").length,
    2,
  );
  const data = (await db.doc(`accounts/${uid}/usage/${day}`).get()).data();
  assert.deepEqual(Object.keys(data!).sort(), [
    "calls",
    "expiresAt",
    "reservedUsd",
  ]);
  assert.equal(data?.reservedUsd, 10);
});

test("repeated ambiguity asks for a fresh explanation instead of an unanswerable clarification", async () => {
  const ambiguous: MemoryIntelligence = {
    ...intelligence,
    async extract() {
      return {
        status: "needs_clarification",
        clarification: "Falta contexto ficticio.",
        items: [],
      };
    },
  };
  let result = await capture.execute(
    uid,
    input("Un relato ficticio ambiguo."),
    async () => ambiguous,
    allowed,
  );
  for (let revision = 1; revision <= 2; revision++) {
    assert.equal(result.status, "needsClarification");
    if (result.status !== "needsClarification") return;
    result = await capture.execute(
      uid,
      {
        apiVersion: 1,
        requestId: randomUUID(),
        clarificationId: result.clarificationId,
        expectedRevision: result.revision,
        text: `Contexto ficticio ${revision}.`,
      },
      async () => ambiguous,
      allowed,
    );
  }
  assert.equal(result.status, "needsRetelling");
  assert.equal(
    (await db.collection(`accounts/${uid}/sources`).get()).empty,
    true,
  );
  const receipt = await db
    .doc(`accounts/${uid}/operations/${result.operationId}`)
    .get();
  assert.equal(receipt.get("pending"), null);
  assert.equal(receipt.get("question"), null);
});
