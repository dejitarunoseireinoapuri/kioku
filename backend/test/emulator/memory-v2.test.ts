import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { beforeEach, after, test } from "node:test";
import { deleteApp } from "firebase-admin/app";
import type { z } from "zod";
import type { StructuredModel } from "#memory-v2/ai/contracts";
import { indexedText } from "#memory-v2/ai/indexed-evidence";
import { V2Capture } from "../../src/memory-v2/capture.js";
import { V2Reader } from "../../src/memory-v2/reader.js";
import { V2WorkStore } from "../../src/memory-v2/work-store.js";
import { changeV2 } from "../../src/memory-v2/change.js";
import { queryV2 } from "../../src/memory-v2/query.js";
import { routeV2, applyV2 } from "../../src/memory-v2/route.js";
import {
  applySchema,
  routeSchema,
} from "../../src/memory-v2/route-contracts.js";
import { presentGroup } from "../../src/memory-v2/presentation.js";
import { FirestoreCaptureStore } from "../../src/firebase/capture-store.js";
import type { Submit, Change } from "../../src/memory-v2/contracts.js";
import { adminApp, db, signInGoogle } from "./helpers.js";
import { activateEmptyMemoryV2 } from "../../src/setup/activate-memory-v2.js";

const uid = "v2-synthetic-owner";
let generation = randomUUID();
const allowed = async () => {};
const input = (text = "El robot ficticio Loto es verde."): Submit => ({
  apiVersion: 2,
  requestId: randomUUID(),
  mode: "tell",
  channel: "text",
  text,
  zone: "Europe/Madrid",
});
const reader = () => new V2Reader(db, uid, generation);
const content = (text: string) => ({
  text,
  proposition: text,
  subject: "robot Loto",
  kind: "fact",
  polarity: "positive",
  attribution: null,
  condition: null,
});
const model: StructuredModel = {
  async call<T>(
    stage: string,
    _instructions: string,
    data: unknown,
    schema: z.ZodType<T>,
  ): Promise<T> {
    const value = data as {
      text: string;
      mode: string;
      tokens: unknown[];
      candidates: { content: { text: string } }[];
      evidence?: { literal: string }[];
    };
    if (stage === "interpret_review" || stage === "answer_review")
      return schema.parse({ accepted: true, issues: [] });
    if (stage === "interpret")
      return schema.parse({
        status: "ready",
        question: null,
        preserveTime: false,
        units: [
          {
            key: "fact",
            content: content(value.text),
            time: {
              precision: "unknown",
              value: null,
              end: null,
              fragment: null,
            },
            existing:
              value.mode === "capture" &&
              value.candidates[0]?.content.text === value.text
                ? 0
                : null,
          },
        ],
        segments: [
          { end: value.tokens.length - 1, role: "primary", owners: ["fact"] },
        ],
        relations: [],
        retention: (value.evidence ?? []).map((e, index) => ({
          index,
          parts: [{ end: indexedText(e.literal).length - 1, keep: false }],
        })),
      });
    if (stage === "answer")
      return schema.parse({
        status: "answered",
        text: "El robot ficticio Loto es verde.",
        evidence: [0],
      });
    throw Error("Unexpected synthetic stage");
  },
};
const factory = async () => model;
const noModel = async (): Promise<StructuredModel> => {
  throw Error("Provider must not run");
};
const save = (command = input(), provider = factory) =>
  new V2Capture(db).execute(uid, generation, command, provider, allowed);
async function change(
  sourceId: string,
  action: "correct" | "forget",
  correction: string | null = null,
) {
  const details = presentGroup(await reader().load(), sourceId);
  const command: Change = {
    apiVersion: 2,
    requestId: randomUUID(),
    sourceId,
    expectedVersion: details.version,
    memoryIds: details.items.map((i) => i.id),
    action,
    correction,
    zone: "Europe/Madrid",
    ...(action === "forget" ? { forgetScope: "allOccurrences" as const } : {}),
  };
  return {
    command,
    result: await changeV2(
      db,
      uid,
      generation,
      command,
      action === "forget" ? noModel : factory,
      allowed,
    ),
  };
}
beforeEach(async () => {
  generation = randomUUID();
  await db.recursiveDelete(db.doc(`accounts/${uid}`));
  await db
    .doc("privateConfiguration/owner")
    .set({ uid, enabled: true, window: 0, count: 1 });
  await db
    .doc(`accounts/${uid}/runtime/memory`)
    .set({ schemaVersion: 2, status: "active", generation, revision: 0 });
});
after(async () => {
  await db.terminate();
  await deleteApp(adminApp);
});

test("v2 capture persists individual reviewed fragments and replay does not call a provider", async () => {
  const command = input(),
    result = await save(command),
    loaded = await reader().load();
  assert.equal(result.status, "saved");
  assert.equal(Object.keys(loaded.state.units).length, 1);
  assert.equal(Object.values(loaded.state.fragments)[0]?.text, command.text);
  assert.ok(Object.values(loaded.state.sources).every((s) => !("text" in s)));
  assert.deepEqual(await save(command, noModel), result);
  assert.equal(
    (
      await db
        .doc(`accounts/${uid}/memoryV2Operations/${command.requestId}`)
        .get()
    ).get("turn"),
    null,
  );
});

test("v2 correction preserves identity across repetitions and revokes all obsolete management aliases", async () => {
  const first = await save(),
    second = await save();
  const previous = await reader().load(),
    id = Object.keys(previous.state.units)[0]!;
  assert.equal(Object.keys(previous.state.units).length, 1);
  const { result } = await change(
    String(first.sourceId),
    "correct",
    "El robot ficticio Loto es azul.",
  );
  const current = await reader().load();
  assert.equal(current.state.units[id]?.revision, 2);
  assert.equal(current.groups.length, 2);
  assert.ok(
    current.groups.every(
      (g) => g.id !== first.sourceId && g.id !== second.sourceId,
    ),
  );
  assert.ok(
    Object.values(current.state.fragments).every(
      (f) => !f.text.includes("verde"),
    ),
  );
  assert.equal((result.changes as unknown[]).length, 2);
});

test("v2 forget removes all supports and blocks a delayed capture and repeated original request", async () => {
  const command = input(),
    saved = await save(command);
  const work = new V2WorkStore(db),
    pendingId = randomUUID();
  await work.begin(
    uid,
    generation,
    pendingId,
    { text: "synthetic pending" },
    { text: "synthetic pending", at: new Date().toISOString(), zone: "UTC" },
  );
  const { command: erase } = await change(String(saved.sourceId), "forget");
  const loaded = await reader().load();
  for (const table of [
    "units",
    "sources",
    "fragments",
    "occurrences",
    "projections",
  ] as const)
    assert.equal(Object.keys(loaded.state[table]).length, 0);
  assert.equal(loaded.groups.length, 0);
  assert.equal(
    (await db.doc(`accounts/${uid}/memoryV2Operations/${pendingId}`).get()).get(
      "turn",
    ),
    null,
  );
  assert.equal((await save(command, noModel)).status, "expired");
  assert.equal(
    (await changeV2(db, uid, generation, erase, noModel, allowed)).status,
    "forgotten",
  );
  assert.equal(
    (await db.collection(`accounts/${uid}/memoryV2Revocations`).get()).size,
    1,
  );
});

test("v2 rejects a stale routed tell before paying or resurrecting deleted content", async () => {
  await save();
  await assert.rejects(save({ ...input(), expectedEpoch: 0 }, noModel));
  assert.equal(Object.keys((await reader().load()).state.units).length, 1);
});

test("v2 clarification carries only its server-bound question and original interventions", async () => {
  const first = input("Alguien llevó el robot ficticio.");
  const unclear: StructuredModel = {
    call: async (stage, instructions, data, schema, limit) =>
      stage === "interpret"
        ? schema.parse({
            status: "clarify",
            question: "¿Quién llevó el robot?",
            preserveTime: false,
            units: [],
            segments: [],
            relations: [],
            retention: [],
          })
        : model.call(stage, instructions, data, schema, limit),
  };
  const pending = await save(first, async () => unclear);
  assert.equal(pending.status, "needsClarification");
  const clarified: StructuredModel = {
    call: async (stage, instructions, data, schema, limit) => {
      if (stage === "interpret") {
        const wire = data as {
          clarification: { original: string; question: string };
          interventions: unknown[];
        };
        assert.equal(wire.clarification.original, first.text);
        assert.equal(wire.clarification.question, "¿Quién llevó el robot?");
        assert.equal(wire.interventions.length, 2);
      }
      return model.call(stage, instructions, data, schema, limit);
    },
  };
  const result = await new V2Capture(db).execute(
    uid,
    generation,
    {
      apiVersion: 2,
      requestId: randomUUID(),
      clarificationId: first.requestId,
      expectedRevision: 1,
      text: "Lo llevó la persona ficticia Nora.",
    },
    async () => clarified,
    allowed,
  );
  assert.equal(result.status, "saved");
  assert.equal(
    (
      await db
        .doc(`accounts/${uid}/memoryV2Operations/${first.requestId}`)
        .get()
    ).get("turn"),
    null,
  );
});

test("v2 leaves a neighboring unit intact on deletion", async () => {
  const first = await save(),
    second = await save(input("El robot ficticio Iris es rojo."));
  await change(String(first.sourceId), "forget");
  const loaded = await reader().load();
  assert.equal(Object.keys(loaded.state.units).length, 1);
  assert.equal(
    presentGroup(loaded, String(second.sourceId)).items[0]?.text,
    "El robot ficticio Iris es rojo.",
  );
});

test("v2 rejects another owner, disabled access, stale generation and active revoked units", async () => {
  await assert.rejects(new V2Reader(db, "different-owner", generation).load());
  await assert.rejects(new V2Reader(db, uid, randomUUID()).load());
  await save();
  const loaded = await reader().load(),
    id = Object.keys(loaded.state.units)[0]!;
  await db
    .doc(`accounts/${uid}/memoryV2Revocations/${id}`)
    .set({ operationId: randomUUID(), epoch: 1, revision: 1 });
  await assert.rejects(reader().load());
  await db.doc("privateConfiguration/owner").update({ enabled: false });
  await assert.rejects(reader().load());
});

test("v2 blocks legacy admissions after activation", async () => {
  await assert.rejects(
    new FirestoreCaptureStore(db).begin(uid, { ...input(), apiVersion: 1 }),
  );
});

test("v2 query never persists answers and rechecks evidence after generation", async () => {
  await save();
  const command = {
    apiVersion: 2 as const,
    requestId: randomUUID(),
    text: "¿De qué color es Loto?",
    zone: "UTC",
  };
  const result = await queryV2(db, uid, generation, command, factory, allowed);
  assert.equal(result.status, "answered");
  const stored = (
    await db
      .doc(`accounts/${uid}/memoryV2Operations/${command.requestId}`)
      .get()
  ).data();
  assert.ok(!JSON.stringify(stored).includes("verde"));
  assert.equal(
    (await queryV2(db, uid, generation, command, noModel, allowed)).status,
    "repeatRequired",
  );
  const stale: StructuredModel = {
    call: async (stage, instructions, data, schema, limit) => {
      const result = await model.call(stage, instructions, data, schema, limit);
      if (stage === "answer_review")
        await db.doc(`accounts/${uid}/runtime/memory`).update({ revision: 2 });
      return result;
    },
  };
  await assert.rejects(
    queryV2(
      db,
      uid,
      generation,
      { ...command, requestId: randomUUID() },
      async () => stale,
      allowed,
    ),
  );
});

test("v2 rejects output after owner revocation without committing", async () => {
  const revoked: StructuredModel = {
    call: async (stage, instructions, data, schema, limit) => {
      const result = await model.call(stage, instructions, data, schema, limit);
      if (stage === "interpret_review")
        await db.doc("privateConfiguration/owner").update({ enabled: false });
      return result;
    },
  };
  await assert.rejects(save(input(), async () => revoked));
  assert.equal(
    (await db.collection(`accounts/${uid}/memoryV2Units`).get()).size,
    0,
  );
});

test("v2 offer is literal, unmodified, bound to owner decision and current epoch", async () => {
  const turn = routeSchema.parse({
    apiVersion: 2,
    requestId: randomUUID(),
    mode: "ask",
    text: "El robot ficticio Loto es verde.",
    zone: "UTC",
    memoryEpoch: 0,
    context: { questions: [], sourceIds: [] },
  });
  const offer: StructuredModel = {
    call: async (stage, instructions, data, schema, limit) => {
      if (stage === "message_intent")
        return schema.parse({
          action: "offer",
          fact: turn.text,
          alsoAsk: false,
          useContext: false,
          question: null,
          forgetScope: null,
        });
      if (stage === "message_review") return schema.parse({ allowed: true });
      return model.call(stage, instructions, data, schema, limit);
    },
  };
  const routed = await routeV2(
    db,
    uid,
    generation,
    turn,
    async () => offer,
    allowed,
  );
  assert.equal(routed.status, "ready");
  assert.equal(Object.keys((await reader().load()).state.units).length, 0);
  const command = applySchema.parse({
    apiVersion: 2,
    requestId: randomUUID(),
    turn,
    plan: routed.plan,
    decision: "accept",
  });
  await assert.rejects(
    applyV2(
      db,
      uid,
      generation,
      { ...command, turn: { ...turn, text: "Un texto distinto." } },
      noModel,
      allowed,
    ),
  );
  assert.equal(
    (await applyV2(db, uid, generation, command, factory, allowed)).status,
    "saved",
  );
  assert.equal(
    (await applyV2(db, uid, generation, command, noModel, allowed)).status,
    "saved",
  );
});

test("v2 ordinary questions do not exhaust pending offers and ambiguous forgetting issues no plan", async () => {
  const routeModel = (action: "ask" | "forget"): StructuredModel => ({
    call: async (_stage, _instructions, _data, schema) =>
      schema.parse({
        action,
        fact: null,
        alsoAsk: false,
        useContext: false,
        question: null,
        forgetScope: null,
      }),
  });
  for (let i = 0; i < 9; i++) {
    const turn = routeSchema.parse({
      apiVersion: 2,
      requestId: randomUUID(),
      mode: "ask",
      text: "¿Qué recuerdo ficticio hay?",
      zone: "UTC",
      memoryEpoch: 0,
      context: { questions: [], sourceIds: [] },
    });
    assert.equal(
      (
        await routeV2(
          db,
          uid,
          generation,
          turn,
          async () => routeModel("ask"),
          allowed,
        )
      ).status,
      "ready",
    );
  }
  assert.equal(
    (await db.collection(`accounts/${uid}/memoryV2Plans`).get()).size,
    0,
  );
  const turn = routeSchema.parse({
    apiVersion: 2,
    requestId: randomUUID(),
    mode: "ask",
    text: "Olvida eso.",
    zone: "UTC",
    memoryEpoch: 0,
    context: { questions: [], sourceIds: [] },
  });
  assert.equal(
    (
      await routeV2(
        db,
        uid,
        generation,
        turn,
        async () => routeModel("forget"),
        allowed,
      )
    ).status,
    "needsClarification",
  );
});

test("operator activation erases legacy memory, pending copies and indexes but preserves account and credentials", async () => {
  await db.doc(`accounts/${uid}/runtime/memory`).set({ revision: 4 });
  for (const name of ["sources", "memories", "operations", "revocations"])
    await db
      .doc(`accounts/${uid}/${name}/synthetic`)
      .set({ text: "fixture to remove" });
  await db.doc(`accounts/${uid}/runtime/capture`).set({ nonce: "fixture" });
  await db.doc(`accounts/${uid}/usage/day`).set({ reservedUsd: 1 });
  await db.doc(`accounts/${uid}`).set({ fixture: true });
  const result = await activateEmptyMemoryV2(db, uid, true);
  assert.equal(result.applied, true);
  for (const name of ["sources", "memories", "operations", "revocations"])
    assert.equal(
      (await db.collection(`accounts/${uid}/${name}`).get()).size,
      0,
    );
  assert.equal(
    (await db.doc(`accounts/${uid}/usage/day`).get()).get("reservedUsd"),
    1,
  );
  assert.equal((await db.doc(`accounts/${uid}`).get()).get("fixture"), true);
  assert.equal(
    (await db.doc("privateConfiguration/owner").get()).get("enabled"),
    true,
  );
  assert.equal(
    (await db.doc(`accounts/${uid}/runtime/memory`).get()).get("status"),
    "active",
  );
  assert.equal(
    (await activateEmptyMemoryV2(db, uid, true)).alreadyActive,
    true,
  );
});

test("operator reset fails closed for foreign owner or unknown data collections", async () => {
  await assert.rejects(activateEmptyMemoryV2(db, "another-owner", true));
  await db.doc(`accounts/${uid}/unexpected/preserve`).set({ fixture: true });
  await assert.rejects(activateEmptyMemoryV2(db, uid, true));
  assert.equal(
    (await db.doc(`accounts/${uid}/unexpected/preserve`).get()).exists,
    true,
  );
});

test("v2 callable state and empty query need authentication and no AI credential", async () => {
  const owner = await signInGoogle("v2-callable-owner");
  await db
    .doc("privateConfiguration/owner")
    .set({ uid: owner.localId, enabled: true, window: 0, count: 1 });
  await db
    .doc(`accounts/${owner.localId}/runtime/memory`)
    .set({ schemaVersion: 2, status: "active", generation, revision: 0 });
  const call = async (data: unknown, token?: string) =>
    fetch("http://127.0.0.1:5007/demo-kioku-local/europe-west1/memoryV2", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ data }),
      signal: AbortSignal.timeout(20_000),
    });
  assert.equal((await call({ apiVersion: 2, operation: "state" })).status, 401);
  const state = await call(
    { apiVersion: 2, operation: "state" },
    owner.idToken,
  );
  assert.equal(state.status, 200);
  const empty = await call(
    {
      apiVersion: 2,
      operation: "query",
      generation,
      payload: {
        apiVersion: 2,
        requestId: randomUUID(),
        text: "¿Hay recuerdos?",
        zone: "UTC",
      },
    },
    owner.idToken,
  );
  assert.equal(empty.status, 200);
  assert.equal(
    ((await empty.json()) as { result: { status: string } }).result.status,
    "notFound",
  );
  assert.equal(
    (await call({ apiVersion: 1, operation: "state" }, owner.idToken)).status,
    400,
  );
});
