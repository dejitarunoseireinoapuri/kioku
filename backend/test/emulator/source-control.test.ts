import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, beforeEach, test } from "node:test";
import { deleteApp } from "firebase-admin/app";
import type { Turn } from "#memory-core/domain";
import { ChangeMemory } from "../../src/memory-control/change.js";
import { changeInput } from "../../src/memory-control/contracts.js";
import type {
  ChangeInput,
  ChangeIntelligence,
} from "../../src/memory-control/contracts.js";
import { FirestoreSourceControlStore } from "../../src/firebase/source-control-store.js";
import { FirestoreCaptureStore } from "../../src/firebase/capture-store.js";
import { FirestoreQueryStore } from "../../src/firebase/query-store.js";
import { parseInput } from "../../src/memory/contracts.js";
import {
  retainedNotice,
  correctionNotice,
} from "../../src/memory-control/selection.js";
import { seed, uid, vector, at } from "./retirement-fixtures.js";
import { adminApp, db } from "./helpers.js";

let now = at + 86_400_000;
const store = new FirestoreSourceControlStore(db, () => now);
const service = new ChangeMemory(store, () => now);
const root = db.doc(`accounts/${uid}`);
const allowed = async () => {};
const intelligence: ChangeIntelligence = {
  extract: async (turn: Turn) => ({
    status: "saved",
    clarification: null,
    items: [
      {
        text: turn.text,
        quote: turn.text,
        kind: "fact",
        entities: [],
        time: { precision: "unknown", value: null, end: null, quote: null },
        provenance: "personal",
        attribution: null,
        attributionEvidence: null,
        eventStatus: "planned",
        lifecycle: "current",
      },
    ],
  }),
  embed: async (texts) => texts.map(vector),
  answer: async () => {
    throw new Error("Editing cannot answer questions");
  },
  reviewSourceChange: async () => ({
    authorized: true,
    unrelatedPreserved: true,
    noRemovedDataRemains: true,
  }),
};
beforeEach(async () => {
  now = at + 86_400_000;
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

async function command(
  action: "forget" | "correct" = "forget",
): Promise<ChangeInput> {
  const target = await seed();
  const details = await store.details(uid, target.source.id);
  return {
    apiVersion: 1,
    requestId: randomUUID(),
    sourceId: target.source.id,
    expectedVersion: details.version,
    memoryIds: [target.memories[action === "correct" ? 1 : 0]!.id],
    action,
    correction: action === "correct" ? "Mi examen es el viernes." : null,
    zone: "Europe/Madrid",
  };
}

test("selective forgetting retires all old copies but preserves the other subject and original time in a fresh source", async () => {
  const input = await command();
  const other = await seed();
  const result = await service.execute(
    uid,
    input,
    async () => intelligence,
    allowed,
  );
  assert.equal(result.status, "forgotten");
  assert.equal(result.memoryEpoch, 1);
  assert.equal(result.sources.length, 1);
  const details = await store.details(uid, result.sources[0]!.sourceId);
  assert.ok(details.text.startsWith(retainedNotice));
  assert.equal(details.text.includes("Loto"), false);
  assert.equal(details.items.length, 1);
  assert.equal(details.items[0]!.text, "El examen ficticio es el martes.");
  assert.equal(details.receivedAt, new Date(at).toISOString());
  const memory = (
    await root.collection("memories").doc(details.items[0]!.id).get()
  ).data();
  assert.equal(memory?.revision, 2);
  assert.equal(memory?.searchSchema, 1);
  assert.deepEqual(
    (await root.collection("sources").doc(other.source.id).get()).data(),
    other.source,
  );
  await assert.rejects(
    new FirestoreCaptureStore(db).source(uid, input.sourceId),
    { message: "failed-precondition" },
  );
  assert.equal(
    (
      await root
        .collection("memories")
        .where("sourceId", "==", input.sourceId)
        .get()
    ).empty,
    true,
  );
});

test("correction stores only the new owner-written fact, keeps the other subject, and uses the correction's own time", async () => {
  const input = await command("correct");
  const result = await service.execute(
    uid,
    input,
    async () => intelligence,
    allowed,
  );
  assert.equal(result.status, "corrected");
  assert.equal(result.sources.length, 2);
  const sources = await Promise.all(
    result.sources.map((item) => store.details(uid, item.sourceId)),
  );
  const preserved = sources.find((item) =>
    item.text.startsWith(retainedNotice),
  )!;
  const corrected = sources.find((item) =>
    item.text.startsWith(correctionNotice),
  )!;
  assert.ok(preserved.text.includes("Quiero ver Loto."));
  assert.equal(corrected.receivedAt, new Date(now).toISOString());
  assert.equal(corrected.items[0]!.text, input.correction);
  assert.equal(corrected.sourceKind, "correction");
  assert.equal(preserved.sourceKind, "retained");
  assert.equal(
    (await store.bundle(uid, corrected.sourceId)).ownerTextVersion,
    1,
  );
  assert.equal(
    (await store.bundle(uid, preserved.sourceId)).ownerTextVersion,
    undefined,
  );
  assert.equal(
    (await root.collection("memories").doc(corrected.items[0]!.id).get()).get(
      "revision",
    ),
    2,
  );
  assert.equal(
    sources.some((item) => item.text.includes("martes")),
    false,
  );
  const receipt = JSON.stringify(
    (await root.collection("operations").doc(input.requestId).get()).data(),
  );
  assert.equal(receipt.includes("viernes"), false);
  assert.equal(receipt.includes("martes"), false);
});

test("a semantic preservation failure or incomplete correction makes no canonical change", async () => {
  for (const blocked of [
    {
      ...intelligence,
      reviewSourceChange: async () => ({
        authorized: true,
        unrelatedPreserved: false,
        noRemovedDataRemains: true,
      }),
    },
    {
      ...intelligence,
      extract: async () => ({
        status: "needs_clarification" as const,
        clarification: "¿Qué dato quieres corregir?",
        items: [],
      }),
    },
  ]) {
    const input = await command("correct");
    const result = await service.execute(
      uid,
      input,
      async () => blocked,
      allowed,
    );
    assert.equal(result.status, "needsClarification");
    assert.equal(
      (await root.collection("sources").doc(input.sourceId).get()).exists,
      true,
    );
    assert.equal(await store.epoch(uid), 0);
    assert.equal((await root.collection("revocations").get()).empty, true);
  }
});

test("a source changed during review or a revoked identity cannot commit a prepared replacement", async () => {
  const input = await command();
  await assert.rejects(
    service.execute(
      uid,
      input,
      async () => ({
        ...intelligence,
        reviewSourceChange: async () => {
          await root
            .collection("memories")
            .doc(`${input.sourceId}-2`)
            .update({ revision: 2 });
          return {
            authorized: true,
            unrelatedPreserved: true,
            noRemovedDataRemains: true,
          };
        },
      }),
      allowed,
    ),
    { message: "failed-precondition" },
  );
  const revoked = await command("correct");
  await assert.rejects(
    service.execute(
      uid,
      revoked,
      async () => intelligence,
      async () => {
        throw new Error("Synthetic revocation");
      },
    ),
  );
  for (const id of [input.sourceId, revoked.sourceId])
    assert.equal((await root.collection("sources").doc(id).get()).exists, true);
  assert.equal(await store.epoch(uid), 0);
  assert.equal(
    (await root.collection("runtime").doc("capture").get()).exists,
    false,
  );
});

test("replays recover only the confirmed current result without inference; conflicting inputs and old UI versions fail", async () => {
  const input = await command("correct");
  const first = await service.execute(
    uid,
    input,
    async () => intelligence,
    allowed,
  );
  let calls = 0;
  assert.deepEqual(
    await service.execute(
      uid,
      input,
      async () => {
        calls++;
        return intelligence;
      },
      allowed,
    ),
    first,
  );
  assert.equal(calls, 0);
  await assert.rejects(
    service.execute(
      uid,
      { ...input, correction: "Otro dato" },
      async () => intelligence,
      allowed,
    ),
    { message: "failed-precondition" },
  );
  const stale = await command();
  await root
    .collection("sources")
    .doc(stale.sourceId)
    .update({ text: "Un original actualizado." });
  await assert.rejects(
    service.execute(uid, stale, async () => intelligence, allowed),
    { message: "failed-precondition" },
  );
  assert.equal(
    (await root.collection("sources").doc(stale.sourceId).get()).exists,
    true,
  );
  const staleItem = await command();
  await root
    .collection("memories")
    .doc(staleItem.memoryIds[0]!)
    .update({ revision: 2, text: "Un dato que ha cambiado." });
  await assert.rejects(
    service.execute(uid, staleItem, async () => intelligence, allowed),
    { message: "failed-precondition" },
  );
  assert.equal(
    (await root.collection("sources").doc(staleItem.sourceId).get()).exists,
    true,
  );
  now += 8 * 86_400_000;
  await assert.rejects(
    service.execute(uid, input, async () => intelligence, allowed),
    { message: "failed-precondition" },
  );
});

test("whole-source withdrawal needs no model and invalidates queries already using its original evidence", async () => {
  const input = await command();
  const bundle = await store.bundle(uid, input.sourceId);
  input.memoryIds = bundle.memories.map((item) => item.id);
  const result = await service.execute(
    uid,
    input,
    async () => {
      throw new Error("Full explicit withdrawal needs no model");
    },
    allowed,
  );
  assert.equal(result.status, "forgotten");
  assert.deepEqual(result.sources, []);
  const search = new FirestoreQueryStore(db, () => now);
  assert.equal(
    (await search.retrieve(uid, "Loto", vector())).snapshot.memories.length,
    0,
  );
});

test("owner, selected IDs, immutable revisions and secret-like corrections are validated before writing", async () => {
  const input = await command();
  await assert.rejects(store.details("different-owner", input.sourceId), {
    message: "permission-denied",
  });
  await assert.rejects(
    service.execute(
      uid,
      { ...input, memoryIds: [`${randomUUID()}-1`] },
      async () => intelligence,
      allowed,
    ),
    { message: "failed-precondition" },
  );
  assert.throws(() => parseInput(changeInput, { ...input, uid: "other" }), {
    message: "invalid-argument",
  });
  assert.throws(
    () =>
      parseInput(changeInput, {
        ...input,
        action: "correct",
        correction: `sk-${"x".repeat(24)}`,
      }),
    { message: "invalid-argument" },
  );
  assert.equal((await root.collection("revocations").get()).empty, true);
});
