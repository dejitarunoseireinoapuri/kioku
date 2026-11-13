import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, beforeEach, test } from "node:test";
import { deleteApp } from "firebase-admin/app";
import type { Memory, MemoryIntelligence } from "#memory-core/domain";
import { FirestoreQueryStore } from "../../src/firebase/query-store.js";
import { QueryMemory } from "../../src/query/query.js";
import { searchProjection } from "../../src/query/search-projection.js";
import { prepareSearch } from "../../src/setup/prepare-search.js";
import { parseInput } from "../../src/memory/contracts.js";
import { queryInput } from "../../src/query/contracts.js";
import { adminApp, db } from "./helpers.js";

const uid = "query-owner";
let now = Date.UTC(2026, 10, 13, 12);
const store = new FirestoreQueryStore(db, () => now);
const service = new QueryMemory(store, () => now);
const allowed = async () => {};
const vector = () => [1, ...Array.from({ length: 511 }, () => 0)];
const input = (text = "¿Qué película quiero ver?") => ({
  apiVersion: 1 as const,
  requestId: randomUUID(),
  text,
});
const provider: MemoryIntelligence = {
  extract: async () => {
    throw new Error("Queries cannot extract facts");
  },
  embed: async (texts) => texts.map(vector),
  answer: async (_question, _at, candidates) => ({
    status: "answered",
    answer: "Quieres ver la película ficticia Loto.",
    sourceIds: [candidates[0]!.memory.sourceId],
  }),
};

async function seed(
  owner = uid,
  legacy = false,
  lifecycle: Memory["lifecycle"] = "current",
) {
  const id = randomUUID();
  const source = {
    id,
    text: "Quiero ver la película ficticia Loto.",
    receivedAt: new Date(now).toISOString(),
    zone: "Europe/Madrid",
  };
  const memory: Memory = {
    id: `${id}-1`,
    sourceId: id,
    revision: 1,
    text: source.text,
    quote: source.text,
    receivedAt: source.receivedAt,
    zone: source.zone,
    kind: "intention",
    entities: ["Loto"],
    time: { precision: "unknown", value: null, end: null, quote: null },
    provenance: "personal",
    attribution: null,
    attributionEvidence: null,
    eventStatus: "planned",
    lifecycle,
    vector: vector(),
  };
  await db.doc(`accounts/${owner}/sources/${id}`).set(source);
  await db
    .doc(`accounts/${owner}/memories/${memory.id}`)
    .set({ ...memory, ...(legacy ? {} : searchProjection(memory)) });
  return { source, memory };
}
beforeEach(async () => {
  now = Date.UTC(2026, 10, 13, 12);
  await db.recursiveDelete(db.doc(`accounts/${uid}`));
  await db.recursiveDelete(db.doc("accounts/query-other"));
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

test("hybrid retrieval returns current own evidence, and query receipts contain neither question nor answer", async () => {
  const own = await seed();
  await seed("query-other");
  await seed(uid, false, "superseded");
  const turn = input();
  const result = await service.execute(
    uid,
    turn,
    async () => provider,
    allowed,
  );
  assert.equal(result.status, "answered");
  assert.deepEqual(
    result.sources.map((source) => source.sourceId),
    [own.source.id],
  );
  assert.equal((await db.collection(`accounts/${uid}/sources`).get()).size, 2);
  const receipts = JSON.stringify(
    (await db.collection(`accounts/${uid}/operations`).get()).docs.map((doc) =>
      doc.data(),
    ),
  );
  assert.equal(receipts.includes(turn.text), false);
  assert.equal(receipts.includes(result.text), false);
  let calls = 0;
  const replay = await service.execute(
    uid,
    turn,
    async () => {
      calls++;
      return provider;
    },
    allowed,
  );
  assert.equal(replay.status, "repeatRequired");
  assert.equal(calls, 0);
  await assert.rejects(store.begin(uid, { ...turn, text: "Otra pregunta" }), {
    message: "failed-precondition",
  });
});

test("no evidence is not evidence that an event never happened, and does not ask the answering model", async () => {
  const result = await service.execute(
    uid,
    input("¿Llamé a mi padre?"),
    async () => ({
      ...provider,
      answer: async () => {
        throw new Error("No evidence must bypass the model");
      },
    }),
    allowed,
  );
  assert.equal(result.status, "notFound");
  assert.deepEqual(result.sources, []);
});

test("question clarification is returned without turning the question into a memory", async () => {
  const fixture = await seed();
  const result = await service.execute(
    uid,
    input("¿Qué dijo Pablo?"),
    async () => ({
      ...provider,
      answer: async () => ({
        status: "needs_clarification",
        answer: "¿A cuál de las personas llamadas Pablo te refieres?",
        sourceIds: [fixture.source.id],
      }),
    }),
    allowed,
  );
  assert.equal(result.status, "needsClarification");
  assert.deepEqual(
    result.sources.map((source) => source.sourceId),
    [fixture.source.id],
  );
  assert.equal((await db.collection(`accounts/${uid}/memories`).get()).size, 1);
});

test("foreign identity and disabled owner cannot start, even with an existing request ID", async () => {
  await assert.rejects(store.begin("query-other", input()), {
    message: "permission-denied",
  });
  await db.doc("privateConfiguration/owner").update({ enabled: false });
  await assert.rejects(store.begin(uid, input()), {
    message: "permission-denied",
  });
});

test("a query ID cannot replace the receipt of an existing capture source", async () => {
  const fixture = await seed();
  await assert.rejects(
    store.begin(uid, { ...input(), requestId: fixture.source.id }),
    { message: "failed-precondition" },
  );
  assert.equal(
    (await db.collection(`accounts/${uid}/operations`).get()).empty,
    true,
  );
});

test("revocation after inference blocks the response and releases its lease", async () => {
  await seed();
  await assert.rejects(
    service.execute(
      uid,
      input(),
      async () => provider,
      async () => {
        await db.doc("privateConfiguration/owner").update({ enabled: false });
      },
    ),
    { message: "permission-denied" },
  );
  assert.equal(
    (await db.doc(`accounts/${uid}/runtime/capture`).get()).exists,
    false,
  );
});

test("changed canonical source after inference invalidates the whole response", async () => {
  const fixture = await seed();
  await assert.rejects(
    service.execute(
      uid,
      input(),
      async () => provider,
      async () => {
        await db
          .doc(`accounts/${uid}/sources/${fixture.source.id}`)
          .update({ text: "Fuente corregida ficticia" });
      },
    ),
    { message: "failed-precondition" },
  );
});

test("deleted or superseded memory cannot authorize a late answer", async () => {
  const fixture = await seed();
  await assert.rejects(
    service.execute(
      uid,
      input(),
      async () => provider,
      async () => {
        await db.doc(`accounts/${uid}/memories/${fixture.memory.id}`).delete();
      },
    ),
    { message: "failed-precondition" },
  );
});

test("foreign evidence selected by the model is rejected", async () => {
  await seed();
  await assert.rejects(
    service.execute(
      uid,
      input(),
      async () => ({
        ...provider,
        answer: async () => ({
          status: "answered",
          answer: "Dato inventado",
          sourceIds: [randomUUID()],
        }),
      }),
      allowed,
    ),
  );
});

test("concurrent duplicate runs once; a stale worker cannot confirm after lease replacement", async () => {
  const turn = input();
  const first = await store.begin(uid, turn);
  assert.ok("nonce" in first);
  assert.equal(
    ((await store.begin(uid, turn)) as { status: string }).status,
    "processing",
  );
  await assert.rejects(store.begin(uid, input()), {
    message: "resource-exhausted",
  });
  now += 240_001;
  const replacement = await store.begin(uid, turn);
  assert.ok("nonce" in replacement);
  await assert.rejects(
    store.finish(uid, first, {
      snapshot: { version: 4, memories: [], sources: [] },
      versions: [],
    }),
    { message: "failed-precondition" },
  );
  await store.fail(uid, first);
  assert.equal(
    (await db.doc(`accounts/${uid}/runtime/capture`).get()).get("nonce"),
    replacement.nonce,
  );
});

test("legacy projection is additive and bounded, and readiness fails closed until prepared", async () => {
  const fixture = await seed(uid, true);
  await db.doc("privateConfiguration/search").delete();
  await assert.rejects(store.begin(uid, input()), {
    message: "failed-precondition",
  });
  assert.deepEqual(await prepareSearch(db, uid, false), {
    checked: 1,
    changed: 1,
    applied: false,
  });
  assert.equal(
    (await db.doc(`accounts/${uid}/memories/${fixture.memory.id}`).get()).get(
      "searchSchema",
    ),
    undefined,
  );
  assert.deepEqual(await prepareSearch(db, uid, true), {
    checked: 1,
    changed: 1,
    applied: true,
  });
  assert.equal(
    (await store.retrieve(uid, "Película pendiente", vector())).snapshot
      .memories[0]?.id,
    fixture.memory.id,
  );
  assert.equal(
    (await db.doc(`accounts/${uid}/sources/${fixture.source.id}`).get()).get(
      "text",
    ),
    fixture.source.text,
  );
  assert.equal((await prepareSearch(db, uid, true)).changed, 0);
});

test("query protocol rejects injected identities, keys, oversized text and client clocks", () => {
  const valid = input();
  for (const invalid of [
    { ...valid, uid: "other" },
    { ...valid, at: "2027-01-01" },
    { ...valid, text: "x".repeat(2001) },
    { ...valid, text: `sk-${"x".repeat(30)}` },
  ]) {
    assert.throws(() => parseInput(queryInput, invalid), {
      message: "invalid-argument",
    });
  }
});
