import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, beforeEach, test } from "node:test";
import { deleteApp } from "firebase-admin/app";
import { OpenAiMemory } from "#memory-core/openai";
import { CaptureMemory } from "../../src/memory/capture.js";
import { FirestoreCaptureStore } from "../../src/firebase/capture-store.js";
import { adminApp, db } from "./helpers.js";

const uid = "capture-time-owner";
const store = new FirestoreCaptureStore(db, () =>
  Date.parse("2026-11-14T18:00:00Z"),
);
beforeEach(async () => {
  await db.recursiveDelete(db.doc(`accounts/${uid}`));
  await db.doc("privateConfiguration/owner").set({ uid, enabled: true });
});
after(async () => {
  await db.terminate();
  await deleteApp(adminApp);
});

function provider(invalid: boolean) {
  const items = [
    ["Pintaré el lunes.", "2026-11-16", "pasado mañana"],
    [
      "Iré al planetario el sábado.",
      "2026-11-21",
      invalid ? "el martes" : "el sábado",
    ],
  ].map(([text, value, evidenceText]) => ({
    text,
    evidenceId: "s1",
    kind: "intention",
    entities: [],
    provenance: "personal",
    attribution: null,
    attributionEvidenceId: null,
    eventStatus: "planned",
    lifecycle: "current",
    time: {
      precision: "day",
      value,
      end: null,
      evidenceId: "s1",
      evidenceText,
    },
  }));
  const transport: typeof fetch = async (url, options) => {
    if (String(url).endsWith("/embeddings"))
      return Response.json({
        data: items.map((_, index) => ({
          index,
          embedding: Array(512).fill(0.5),
        })),
        usage: { prompt_tokens: 1 },
      });
    const stage = JSON.parse(String(options?.body)).text.format.name;
    const output =
      stage === "memory_extraction"
        ? { status: "saved", clarification: null, items }
        : { decision: "accept", extraction: null, changes: [] };
    return Response.json({
      status: "completed",
      output: [
        {
          type: "message",
          content: [{ type: "output_text", text: JSON.stringify(output) }],
        },
      ],
      usage: { input_tokens: 1, output_tokens: 1 },
    });
  };
  return new OpenAiMemory(
    "sk-synthetic-test-only",
    { reserve: async () => {}, settle: async () => {} },
    transport,
  );
}

test("checking an obsolete receipt never retires a newer worker's lease", async () => {
  let now = Date.parse("2026-11-14T18:00:00Z");
  const timed = new FirestoreCaptureStore(db, () => now);
  const first = {
    apiVersion: 1 as const,
    requestId: randomUUID(),
    mode: "tell" as const,
    channel: "text" as const,
    text: "Primera prueba ficticia.",
    zone: "Europe/Madrid",
  };
  await timed.begin(uid, first);
  now += 240_001;
  const second = {
    ...first,
    requestId: randomUUID(),
    text: "Segunda prueba ficticia.",
  };
  const current = await timed.begin(uid, second);
  assert.ok("lease" in current);
  assert.equal((await timed.operation(uid, first.requestId)).status, "failed");
  assert.equal(
    (await timed.operation(uid, second.requestId)).status,
    "processing",
  );
  assert.equal(
    (await db.doc(`accounts/${uid}/runtime/capture`).get()).get("nonce"),
    current.lease.nonce,
  );
});

test("an expired capture lease fails its receipt and a late worker cannot commit", async () => {
  let now = Date.parse("2026-11-14T18:00:00Z");
  const timed = new FirestoreCaptureStore(db, () => now);
  const input = {
    apiVersion: 1 as const,
    requestId: randomUUID(),
    mode: "tell" as const,
    channel: "text" as const,
    text: "Dato ficticio.",
    zone: "Europe/Madrid",
  };
  const started = await timed.begin(uid, input);
  assert.ok("lease" in started);
  assert.equal(
    (await timed.operation(uid, input.requestId)).status,
    "processing",
  );
  now += 240_001;
  assert.equal((await timed.operation(uid, input.requestId)).status, "failed");
  assert.equal(
    (await db.doc(`accounts/${uid}/runtime/capture`).get()).exists,
    false,
  );
  await assert.rejects(
    timed.finish(
      uid,
      started.lease,
      { status: "ignored", clarification: null, items: [] },
      { version: 4, sources: [], memories: [] },
    ),
    { message: "failed-precondition" },
  );
  assert.equal((await db.collection(`accounts/${uid}/sources`).get()).size, 0);
  assert.equal((await timed.operation(uid, input.requestId)).status, "failed");
});

for (const invalid of [false, true])
  test(
    invalid
      ? "foreign temporal text creates only a failed receipt, no partial memory"
      : "two plans in one sentence commit distinct dates and one idempotent source",
    async () => {
      const capture = new CaptureMemory(store);
      const input = {
        apiVersion: 1 as const,
        requestId: randomUUID(),
        mode: "tell" as const,
        channel: "text" as const,
        zone: "Europe/Madrid",
        text: "Además de pintar pasado mañana, quiero ir al planetario el sábado.",
      };
      const execute = () =>
        capture.execute(
          uid,
          input,
          async () => provider(invalid),
          async () => {},
        );
      if (invalid) {
        await assert.rejects(execute(), /CAPTURE_REVIEW_VALIDATION_UNRESOLVED/);
        assert.equal(
          (await store.operation(uid, input.requestId)).status,
          "failed",
        );
        assert.equal(
          (await db.collection(`accounts/${uid}/sources`).get()).size,
          0,
        );
        assert.equal(
          (await db.collection(`accounts/${uid}/memories`).get()).size,
          0,
        );
      } else {
        const result = await execute();
        assert.equal(result.status, "saved");
        assert.deepEqual(await execute(), result);
        const memories = await db.collection(`accounts/${uid}/memories`).get();
        assert.equal(memories.size, 2);
        assert.deepEqual(memories.docs.map((d) => d.get("time.value")).sort(), [
          "2026-11-16",
          "2026-11-21",
        ]);
        assert.equal(
          (await db.collection(`accounts/${uid}/sources`).get()).size,
          1,
        );
      }
    },
  );
