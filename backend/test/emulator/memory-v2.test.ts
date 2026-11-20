import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { beforeEach, after, test, mock } from "node:test";
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
import {
  presentGroup,
  groupsForUnits,
} from "../../src/memory-v2/presentation.js";
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
const pairedText =
  "El robot ficticio Loto es verde. El robot ficticio Iris es rojo.";
async function savePair() {
  const paired: StructuredModel = {
    call: async (stage, instructions, data, schema, limit) => {
      if (stage !== "interpret")
        return model.call(stage, instructions, data, schema, limit);
      return schema.parse({
        status: "ready",
        question: null,
        preserveTime: false,
        units: [
          "El robot ficticio Loto es verde.",
          "El robot ficticio Iris es rojo.",
        ].map((text, index) => ({
          key: `fact${index}`,
          content: {
            ...content(text),
            subject: index === 0 ? "robot Loto" : "robot Iris",
          },
          time: {
            precision: "unknown",
            value: null,
            end: null,
            fragment: null,
          },
          existing: null,
        })),
        segments: [
          {
            end: indexedText("El robot ficticio Loto es verde. ").length - 1,
            role: "primary",
            owners: ["fact0"],
          },
          {
            end: indexedText(pairedText).length - 1,
            role: "primary",
            owners: ["fact1"],
          },
        ],
        relations: [],
        retention: [],
      });
    },
  };
  return save(input(pairedText), async () => paired);
}
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
  assert.equal(result.memoryEpoch, 1);
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

test("saved replay reports its own commit epoch even for an older receipt", async () => {
  const command = input();
  const first = await save(command);
  await save(input("El robot ficticio Iris es rojo."));
  assert.equal((await save(command, noModel)).memoryEpoch, 1);
  const { memoryEpoch: _epoch, source: _source, ...oldReply } = first;
  await db
    .doc(`accounts/${uid}/memoryV2Operations/${command.requestId}`)
    .update({ reply: oldReply });
  assert.equal((await save(command, noModel)).memoryEpoch, 1);
  await db
    .doc(`accounts/${uid}/memoryV2Receipts/${command.requestId}`)
    .delete();
  assert.equal((await save(command, noModel)).status, "expired");
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
  assert.equal((result.changes as unknown[]).length, 3);
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

test("a query manages only the cited unit from a paired capture and forgetting preserves its neighbor", async () => {
  await savePair();
  const loaded = await reader().load();
  const first = Object.values(loaded.state.units).find(
    (u) => u.content.subject === "robot Loto",
  )!;
  const neighbor = Object.values(loaded.state.units).find(
    (u) => u.content.subject === "robot Iris",
  )!;
  const answerModel: StructuredModel = {
    call: async (stage, instructions, data, schema, limit) => {
      if (stage === "answer") {
        const wire = data as { evidence: { content: { subject: string } }[] };
        // Use the evidence index supplied by the actual query pipeline.
        const index = wire.evidence.findIndex(
          (item) => item.content.subject === "robot Loto",
        );
        assert.ok(index >= 0);
        return schema.parse({
          status: "answered",
          text: first.content.text,
          evidence: [index],
        });
      }
      return model.call(stage, instructions, data, schema, limit);
    },
  };
  const answer = await queryV2(
    db,
    uid,
    generation,
    {
      apiVersion: 2,
      requestId: randomUUID(),
      text: "¿De qué color es Loto?",
      zone: "UTC",
    },
    async () => answerModel,
    allowed,
  );
  const refs = answer.sources as { sourceId: string }[];
  assert.equal(refs.length, 1);
  const detail = presentGroup(await reader().load(), refs[0]!.sourceId);
  assert.deepEqual(
    detail.items.map((i) => i.id),
    [first.id],
  );
  assert.equal(detail.text, first.content.text);
  assert.ok(!detail.text.includes("Iris"));
  await assert.rejects(
    changeV2(
      db,
      uid,
      generation,
      {
        apiVersion: 2,
        requestId: randomUUID(),
        sourceId: detail.sourceId,
        expectedVersion: detail.version,
        memoryIds: [neighbor.id],
        action: "forget",
        correction: null,
        zone: "UTC",
        forgetScope: "allOccurrences",
      },
      noModel,
      allowed,
    ),
  );
  const contextual: StructuredModel = {
    call: async (stage, _instructions, data, schema) => {
      if (stage === "message_intent")
        return schema.parse({
          action: "forget",
          fact: null,
          alsoAsk: false,
          useContext: true,
          question: null,
          forgetScope: "allOccurrences",
        });
      assert.equal(stage, "message_target");
      const candidates = (data as { candidates: { id: string }[] }).candidates;
      assert.deepEqual(
        candidates.map((u) => u.id),
        [first.id],
      );
      return schema.parse({
        memoryIds: [],
        correction: null,
        question: "¿Confirmas el alcance ficticio?",
      });
    },
  };
  assert.equal(
    (
      await routeV2(
        db,
        uid,
        generation,
        {
          apiVersion: 2,
          requestId: randomUUID(),
          mode: "ask",
          text: "Olvida ese dato.",
          zone: "UTC",
          memoryEpoch: loaded.state.epoch,
          context: { questions: [], sourceIds: [detail.sourceId] },
        },
        async () => contextual,
        allowed,
      )
    ).status,
    "needsClarification",
  );
  const both = groupsForUnits(loaded, [first.id, neighbor.id]);
  assert.equal(both.length, 2);
  assert.ok(
    both.every((r) => presentGroup(loaded, r.sourceId).items.length === 1),
  );
  const { result } = await change(detail.sourceId, "forget");
  assert.equal(result.status, "forgotten");
  const current = await reader().load();
  assert.equal(Object.keys(current.state.units).length, 1);
  assert.equal(
    current.state.units[neighbor.id]?.content.text,
    neighbor.content.text,
  );
  assert.throws(() => presentGroup(current, detail.sourceId));
  assert.equal(
    presentGroup(current, both[1]!.sourceId).items[0]!.id,
    neighbor.id,
  );
});

test("unit management correction returns only that unit and revokes its old alias", async () => {
  await savePair();
  const before = await reader().load();
  const target = Object.values(before.state.units).find(
    (u) => u.content.subject === "robot Loto",
  )!;
  const source = groupsForUnits(before, [target.id])[0]!;
  const { result } = await change(
    source.sourceId,
    "correct",
    "El robot ficticio Loto es azul.",
  );
  const after = await reader().load();
  assert.throws(() => presentGroup(after, source.sourceId));
  const refs = result.sources as { sourceId: string }[];
  assert.equal(refs.length, 1);
  assert.equal(presentGroup(after, refs[0]!.sourceId).items.length, 1);
  assert.equal(presentGroup(after, refs[0]!.sourceId).items[0]!.id, target.id);
  assert.equal(
    Object.values(after.state.units).find((u) => u.id !== target.id)?.content
      .subject,
    "robot Iris",
  );
  assert.throws(() => presentGroup(after, randomUUID()));
  assert.throws(() =>
    presentGroup(
      { ...after, runtime: { ...after.runtime, generation: randomUUID() } },
      refs[0]!.sourceId,
    ),
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
  // Startup only asks for the revision. It must not read or parse the catalog.
  await db
    .doc(`accounts/${owner.localId}/memoryV2Units/${randomUUID()}`)
    .set({ sentinel: true });
  const detailsRequest = {
    apiVersion: 2,
    operation: "details",
    generation,
    payload: { apiVersion: 2 },
  };
  const revision = await call(detailsRequest, owner.idToken);
  assert.equal(revision.status, 200);
  assert.deepEqual(await revision.json(), {
    result: { apiVersion: 2, memoryEpoch: 0 },
  });
  assert.equal(
    (await call({ ...detailsRequest, generation: randomUUID() }, owner.idToken))
      .status,
    400,
  );
  assert.equal((await call(detailsRequest)).status, 401);
  assert.equal(
    (await call({ apiVersion: 1, operation: "state" }, owner.idToken)).status,
    400,
  );
});

test("unanchored follow-up clarifies before loading canonical memories or creating a provider", async () => {
  // Any canonical load would fail parsing this sentinel. No real content is used.
  await db
    .doc(`accounts/${uid}/memoryV2Units/${randomUUID()}`)
    .set({ sentinel: true });
  const turn = routeSchema.parse({
    apiVersion: 2,
    requestId: randomUUID(),
    mode: "ask",
    text: "¿Y ahora?",
    zone: "UTC",
    memoryEpoch: 0,
    context: { questions: [], sourceIds: [] },
  });
  assert.equal(
    (await routeV2(db, uid, generation, turn, noModel, allowed)).status,
    "needsClarification",
  );
  assert.equal(
    (await routeV2(db, uid, generation, turn, noModel, allowed)).status,
    "repeatRequired",
  );
  const stored = (
    await db.doc(`accounts/${uid}/memoryV2Operations/${turn.requestId}`).get()
  ).data();
  assert.ok(!JSON.stringify(stored).includes("ahora"));
  assert.equal(
    (await db.collection(`accounts/${uid}/memoryV2Plans`).get()).size,
    0,
  );
  await db.doc(`accounts/${uid}/runtime/memory`).update({ revision: 1 });
  assert.equal(
    (
      await routeV2(
        db,
        uid,
        generation,
        {
          ...turn,
          requestId: randomUUID(),
          context: { questions: ["¿Qué planes tengo?"], sourceIds: [] },
        },
        noModel,
        allowed,
      )
    ).status,
    "needsClarification",
  );
  await assert.rejects(
    routeV2(
      db,
      "foreign-owner",
      generation,
      { ...turn, requestId: randomUUID() },
      noModel,
      allowed,
    ),
  );
  await assert.rejects(
    routeV2(
      db,
      uid,
      randomUUID(),
      { ...turn, requestId: randomUUID() },
      noModel,
      allowed,
    ),
  );
  await assert.rejects(
    routeV2(
      db,
      uid,
      generation,
      { ...turn, requestId: randomUUID() },
      noModel,
      async () => {
        await db.doc("privateConfiguration/owner").update({ enabled: false });
      },
    ),
  );
});

test("query normalizes equivalent requests and separates current context before retrieval and review", async () => {
  await save();
  const epoch = (await reader().load()).state.epoch;
  const original = V2Reader.prototype.candidates;
  let expectedPrevious: string[] = [];
  const spy = mock.method(
    V2Reader.prototype,
    "candidates",
    function (this: V2Reader, ...args: Parameters<V2Reader["candidates"]>) {
      assert.equal(args[2], "¿De qué color es Loto?");
      assert.equal(
        args[5],
        expectedPrevious.length ? expectedPrevious.join("\n") : undefined,
      );
      return original.apply(this, args);
    },
  );
  let calls = 0;
  const provider: StructuredModel = {
    async call(stage, instructions, raw, schema, limit) {
      const data = raw as { question: string; previousQuestions: string[] };
      assert.equal(data.question, "¿De qué color es Loto?");
      assert.deepEqual(data.previousQuestions, expectedPrevious);
      calls++;
      return model.call(stage, instructions, raw, schema, limit);
    },
  };
  try {
    for (const contextEpoch of [null, epoch, epoch - 1]) {
      expectedPrevious = contextEpoch === epoch ? ["¿Dónde está Iris?"] : [];
      const text =
        contextEpoch === null
          ? "Dime de qué color es Loto"
          : JSON.stringify({
              pregunta_actual: "¿De qué color es Loto?",
              preguntas_anteriores_solo_contexto: ["¿Dónde está Iris?"],
              memory_revision: contextEpoch,
            });
      const answer = await queryV2(
        db,
        uid,
        generation,
        { apiVersion: 2, requestId: randomUUID(), text, zone: "UTC" },
        async () => provider,
        allowed,
      );
      assert.equal(answer.status, "answered");
      assert.equal((answer.sources as unknown[]).length, 1);
    }
    assert.equal(calls, 6);
    assert.equal(spy.mock.callCount(), 3);
  } finally {
    spy.mock.restore();
  }
});

test("question routing resolves direct, ambiguous and contextual questions before reading the catalog", async () => {
  await db
    .doc(`accounts/${uid}/memoryV2Units/${randomUUID()}`)
    .set({ sentinel: true });
  for (const text of [
    "¿Y lo de esa persona?",
    "¿Qué quiero hacer?",
    "Dime lo que me dijo ayer la profesora ficticia Ada",
    "¿Y ahora?",
    "¿Y ahora?\nAclaración: Qué planes tengo pendientes.",
  ]) {
    let calls = 0;
    const clarify = text.includes("persona");
    const direct = text === "¿Qué quiero hacer?" || text.startsWith("Dime");
    const interpreter: StructuredModel = {
      call: async (stage, _instructions, data, schema) => {
        assert.equal(stage, "message_intent");
        assert.equal((data as { text: string }).text, text);
        calls++;
        return schema.parse({
          action: clarify ? "clarify" : "ask",
          fact: null,
          alsoAsk: false,
          useContext: false,
          question: clarify ? "¿A qué persona te refieres?" : null,
          forgetScope: null,
        });
      },
    };
    const result = await routeV2(
      db,
      uid,
      generation,
      routeSchema.parse({
        apiVersion: 2,
        requestId: randomUUID(),
        mode: "ask",
        text,
        zone: "UTC",
        memoryEpoch: 0,
        context: {
          questions: text === "¿Y ahora?" ? ["¿Qué planes tengo?"] : [],
          sourceIds: [],
        },
      }),
      direct ? noModel : async () => interpreter,
      allowed,
    );
    assert.equal(result.status, clarify ? "needsClarification" : "ready");
    assert.equal(calls, direct ? 0 : 1);
    assert.equal(
      Object.keys(
        (await db.collection(`accounts/${uid}/memoryV2Groups`).get()).docs,
      ).length,
      0,
    );
  }
});

test("a tell plan makes one routing call and checks intent again in the capture review before writing", async () => {
  const text = "El robot ficticio Loto es verde.";
  const turn = routeSchema.parse({
    apiVersion: 2,
    requestId: randomUUID(),
    mode: "tell",
    text,
    zone: "UTC",
    memoryEpoch: 0,
    context: { questions: [], sourceIds: [] },
  });
  const stages: string[] = [];
  let accept = false;
  const provider: StructuredModel = {
    async call(stage, instructions, data, schema, limit) {
      stages.push(stage);
      if (stage === "message_intent")
        return schema.parse({
          action: "tell",
          fact: null,
          question: null,
          useContext: false,
          forgetScope: null,
          alsoAsk: false,
        });
      if (stage === "interpret_review") {
        assert.match(
          instructions,
          /Control independiente de intención de Contar/u,
        );
        return schema.parse(
          accept
            ? { accepted: true, issues: [] }
            : { accepted: false, issues: ["instruction"] },
        );
      }
      return model.call(stage, instructions, data, schema, limit);
    },
  };
  const routed = await routeV2(
    db,
    uid,
    generation,
    turn,
    async () => provider,
    allowed,
  );
  assert.equal(routed.status, "ready");
  assert.deepEqual(stages, ["message_intent"]);
  assert.equal(Object.keys((await reader().load()).state.units).length, 0);
  const capture = (id: string) =>
    save(
      { ...input(text), requestId: id, expectedEpoch: 0 },
      async () => provider,
    );
  await assert.rejects(capture(randomUUID()), {
    message: "REVIEW_instruction",
  });
  assert.equal(Object.keys((await reader().load()).state.units).length, 0);
  accept = true;
  assert.equal((await capture(randomUUID())).status, "saved");
  assert.deepEqual(stages, [
    "message_intent",
    "interpret",
    "interpret_review",
    "interpret",
    "interpret_review",
  ]);
});

test("a direct location in tell mode still requires an authorized capture and its independent review", async () => {
  const text = "Mi brújula está en el cajón azul.";
  const turn = routeSchema.parse({
    apiVersion: 2,
    requestId: randomUUID(),
    mode: "tell",
    text,
    zone: "UTC",
    memoryEpoch: 0,
    context: { questions: [], sourceIds: [] },
  });
  const routed = await routeV2(db, uid, generation, turn, noModel, allowed);
  assert.equal(routed.status, "ready");
  assert.ok(
    routed.plan && typeof routed.plan === "object" && "action" in routed.plan,
  );
  assert.equal(routed.plan.action, "tell");
  assert.equal(Object.keys((await reader().load()).state.units).length, 0);
  const stages: string[] = [];
  const tracking: StructuredModel = {
    async call(stage, instructions, data, schema, limit) {
      stages.push(stage);
      return model.call(stage, instructions, data, schema, limit);
    },
  };
  const saved = await save(
    { ...input(text), expectedEpoch: 0 },
    async () => tracking,
  );
  assert.equal(saved.status, "saved");
  assert.deepEqual(stages, ["interpret", "interpret_review"]);
  const current = Object.values((await reader().load()).state.units);
  assert.equal(current.length, 1);
  assert.equal(current[0]?.content.text, text);
});
