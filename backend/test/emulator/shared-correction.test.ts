import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, beforeEach, test } from "node:test";
import { deleteApp } from "firebase-admin/app";
import type {
  ChangeInput,
  ChangeIntelligence,
} from "../../src/memory-control/contracts.js";
import { ChangeMemory } from "../../src/memory-control/change.js";
import { FirestoreSourceControlStore } from "../../src/firebase/source-control-store.js";
import { seed, uid, at, vector } from "./retirement-fixtures.js";
import { adminApp, db } from "./helpers.js";

const store = new FirestoreSourceControlStore(db, () => at + 86400000);
const service = new ChangeMemory(store, () => at + 86400000);
const root = db.doc(`accounts/${uid}`);
beforeEach(async () => {
  await db.recursiveDelete(root);
  await db.doc("privateConfiguration/owner").set({ uid, enabled: true });
  await db
    .doc("privateConfiguration/search")
    .set({ uid, schema: 1, ready: true });
});
after(async () => {
  await db.terminate();
  await deleteApp(adminApp);
});

async function shared() {
  const fixture = await seed();
  for (const memory of fixture.memories)
    await root
      .collection("memories")
      .doc(memory.id)
      .update({ quote: fixture.source.text });
  const original = await store.details(uid, fixture.source.id);
  const input: ChangeInput = {
    apiVersion: 1,
    requestId: randomUUID(),
    sourceId: fixture.source.id,
    expectedVersion: original.version,
    memoryIds: [fixture.memories[1]!.id],
    action: "correct",
    correction: "Mi examen es el viernes.",
    zone: "Europe/Madrid",
  };
  const evidence = fixture.memories.map((m) => ({
    memoryId: m.id,
    quote: m.quote,
    timeQuote: null,
    attributionEvidence: null,
  }));
  let selections = 0;
  const ai: ChangeIntelligence = {
    extract: async (turn) => ({
      status: "saved",
      clarification: null,
      items: [
        {
          text: turn.text,
          quote: turn.text,
          kind: "intention",
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
      throw Error("Not a query");
    },
    reviewSourceChange: async () => ({
      authorized: true,
      unrelatedPreserved: true,
      noRemovedDataRemains: true,
    }),
    selectDuplicateFacts: async () => {
      selections++;
      return {
        memoryIds: input.memoryIds,
        evidence,
        unresolved: false,
        question: null,
      };
    },
  };
  return {
    input,
    original,
    fixture,
    evidence,
    ai,
    selections: () => selections,
  };
}

test("a malformed correction is clarified before shared evidence is separated; its clear replacement preserves the other fact", async () => {
  const data = await shared();
  const rejected = await service.execute(
    uid,
    { ...data.input, correction: "quiero jugary prender" },
    async () => ({
      ...data.ai,
      extract: async () => ({
        status: "needs_clarification",
        clarification:
          "Reescribe la frase completa con las palabras separadas.",
        items: [],
      }),
    }),
    async () => {},
  );
  assert.equal(rejected.status, "needsClarification");
  assert.match(rejected.text, /^No he modificado/);
  assert.equal(data.selections(), 0);
  assert.deepEqual(
    await store.details(uid, data.input.sourceId),
    data.original,
  );
  const saved = await service.execute(
    uid,
    { ...data.input, requestId: randomUUID() },
    async () => data.ai,
    async () => {},
  );
  assert.equal(saved.status, "corrected");
  assert.equal(data.selections(), 1);
  const details = await Promise.all(
    saved.sources.map((s) => store.details(uid, s.sourceId)),
  );
  assert.equal(details.length, 2);
  const kept = details.find((s) => s.sourceKind === "retained")!;
  assert.equal(kept.items.length, 1);
  assert.equal(kept.items[0]!.text, "Quiero ver Loto.");
  assert.equal(kept.receivedAt, data.original.receivedAt);
  assert.equal(kept.text.includes("martes"), false);
  assert.equal(
    details.find((s) => s.sourceKind === "correction")!.items[0]!.text,
    data.input.correction,
  );
  assert.equal(
    (await root.collection("revocations").doc(data.input.sourceId).get())
      .exists,
    true,
  );
});

for (const invalid of [
  "unresolved",
  "extra-target",
  "invented-evidence",
  "missing-evidence",
] as const) {
  test(`a shared correction with ${invalid} preserves the complete original without a partial commit`, async () => {
    const data = await shared();
    const result = await service.execute(
      uid,
      data.input,
      async () => ({
        ...data.ai,
        selectDuplicateFacts: async () => ({
          memoryIds:
            invalid === "extra-target"
              ? data.fixture.memories.map((m) => m.id)
              : data.input.memoryIds,
          evidence:
            invalid === "missing-evidence"
              ? []
              : invalid === "invented-evidence"
                ? data.evidence.map((e) => ({
                    ...e,
                    quote: "Invented literal",
                  }))
                : data.evidence,
          unresolved: invalid === "unresolved",
          question: null,
        }),
      }),
      async () => {},
    );
    assert.equal(result.status, "needsClarification");
    assert.deepEqual(
      await store.details(uid, data.input.sourceId),
      data.original,
    );
    assert.equal((await root.collection("revocations").get()).empty, true);
    assert.equal(await store.epoch(uid), 0);
  });
}

for (const revoked of [false, true]) {
  test(`a ${revoked ? "disabled owner" : "changed source"} during separation cannot commit a correction`, async () => {
    const data = await shared();
    let planned = false;
    await assert.rejects(
      service.execute(
        uid,
        data.input,
        async () => ({
          ...data.ai,
          selectDuplicateFacts: async (value) => {
            planned = true;
            if (revoked)
              await db
                .doc("privateConfiguration/owner")
                .update({ enabled: false });
            else
              await root
                .collection("sources")
                .doc(data.input.sourceId)
                .update({ memoryCount: 3 });
            return data.ai.selectDuplicateFacts!(value);
          },
        }),
        async () => {},
      ),
      { message: revoked ? "permission-denied" : "failed-precondition" },
    );
    assert.equal(planned, true);
    assert.equal((await root.collection("revocations").get()).empty, true);
    assert.equal((await root.collection("sources").get()).size, 1);
    assert.equal((await root.collection("memories").get()).size, 2);
  });
}
