import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, beforeEach, test } from "node:test";
import { deleteApp } from "firebase-admin/app";
import { RouteMessage } from "../../src/conversation/route.js";
import { ApplyMessage } from "../../src/conversation/apply.js";
import type {
  DecisionInput,
  RoutingInput,
  RoutingPlan,
} from "../../src/conversation/contracts.js";
import { FirestoreRoutingStore } from "../../src/firebase/routing-store.js";
import { FirestoreSourceControlStore } from "../../src/firebase/source-control-store.js";
import { FirestoreCaptureStore } from "../../src/firebase/capture-store.js";
import { FirestoreSourceRetirementStore } from "../../src/firebase/retirement-store.js";
import { adminApp, db } from "./helpers.js";
import { seed, uid, at } from "./retirement-fixtures.js";
import { turn, ConversationIntelligence } from "./conversation-fixtures.js";

let now = at;
let model = new ConversationIntelligence();
const root = db.doc(`accounts/${uid}`);
const store = new FirestoreRoutingStore(db, () => now);
const sources = new FirestoreSourceControlStore(db, () => now);
const route = new RouteMessage(store, sources);
const apply = new ApplyMessage(
  store,
  sources,
  (memoryEpoch, receivedAt) =>
    new FirestoreCaptureStore(db, () => now, { memoryEpoch, receivedAt }),
);
const provider = async () => model;
const allowed = async () => {};

beforeEach(async () => {
  now = at;
  model = new ConversationIntelligence();
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

async function planned(input: RoutingInput): Promise<RoutingPlan> {
  const result = await route.execute(uid, input, provider, allowed);
  assert.equal(result.status, "ready");
  if (result.status !== "ready") throw new Error("Expected a ready plan");
  return result.plan;
}
const decision = (
  input: RoutingInput,
  plan: RoutingPlan,
  choice: DecisionInput["decision"],
): DecisionInput => ({
  apiVersion: 1,
  requestId: randomUUID(),
  turn: input,
  plan,
  decision: choice,
});
function offer() {
  model.intent = {
    action: "offer",
    forgetScope: null,
    fact: "Me gusta el miso.",
    alsoAsk: false,
    useContext: false,
    question: null,
  };
  return turn("Me gusta el miso.");
}
async function correction() {
  const target = await seed();
  const input = turn("Corrige ese dato: la película era Niebla.");
  input.context.sourceIds = [target.source.id];
  model.intent = {
    action: "correct",
    forgetScope: null,
    fact: null,
    alsoAsk: false,
    useContext: true,
    question: null,
  };
  model.selection = {
    memoryIds: [target.memories[0]!.id],
    correction: "Me apetece ver Niebla.",
    question: null,
  };
  return { input, target, plan: await planned(input) };
}

test("routing writes no canonical facts or owner text and cannot repeat paid work", async () => {
  const input = turn("¿Qué película dije?");
  await planned(input);
  assert.equal((await root.collection("sources").get()).size, 0);
  const record = (
    await root.collection("operations").doc(input.requestId).get()
  ).data()!;
  assert.equal(JSON.stringify(record).includes(input.text), false);
  assert.equal(record.plan, undefined);
  assert.match(record.planHash as string, /^[a-f0-9]{64}$/u);
  const count = model.calls;
  assert.equal(
    (await route.execute(uid, input, provider, allowed)).status,
    "repeatRequired",
  );
  assert.equal(model.calls, count);
  await assert.rejects(
    route.execute(uid, { ...input, text: "Otra pregunta" }, provider, allowed),
    { message: "failed-precondition" },
  );
});

test("offers remain absent until accepted and double acceptance saves once with original receipt time", async () => {
  now = Date.parse("2026-11-14T23:59:30.000Z");
  const input = offer(),
    plan = await planned(input);
  assert.equal((await root.collection("sources").get()).size, 0);
  now += 60_000;
  const command = decision(input, plan, "accept");
  assert.equal(
    (await apply.execute(uid, command, provider, allowed)).status,
    "saved",
  );
  const count = model.calls;
  assert.equal(
    (await apply.execute(uid, command, provider, allowed)).status,
    "saved",
  );
  assert.equal(model.calls, count);
  const records = await root.collection("sources").get();
  assert.equal(records.size, 1);
  assert.equal(records.docs[0]?.get("text"), model.intent.fact);
  assert.equal(records.docs[0]?.get("receivedAt"), "2026-11-14T23:59:30.000Z");
  assert.equal(
    JSON.stringify(
      (await root.collection("operations").doc(input.requestId).get()).data(),
    ).includes("miso"),
    false,
  );
});

test("decline is idempotent, cannot become acceptance, and never calls capture", async () => {
  const input = offer(),
    plan = await planned(input),
    command = decision(input, plan, "reject"),
    count = model.calls;
  assert.equal(
    (await apply.execute(uid, command, provider, allowed)).status,
    "declined",
  );
  assert.equal(
    (await apply.execute(uid, command, provider, allowed)).status,
    "declined",
  );
  await assert.rejects(
    apply.execute(uid, { ...command, decision: "accept" }, provider, allowed),
  );
  assert.equal(model.calls, count);
  assert.equal((await root.collection("sources").get()).size, 0);
});

test("query evidence preserves server-assigned correction kind and rejects an invalid kind", async () => {
  const { input, plan } = await correction();
  await apply.execute(uid, decision(input, plan, "apply"), provider, allowed);
  const { FirestoreQueryStore } = await import(
    "../../src/firebase/query-store.js"
  );
  const query = new FirestoreQueryStore(db, () => now);
  const evidence = await query.retrieve(
    uid,
    "¿Qué película quiero ver?",
    (await model.embed(["ficticio"]))[0]!,
  );
  assert.ok(
    evidence.snapshot.sources.some(
      (source) => source.sourceKind === "correction",
    ),
  );
  assert.ok(
    evidence.snapshot.sources.some(
      (source) => source.sourceKind === "retained",
    ),
  );
  const corrected = evidence.snapshot.sources.find(
    (source) => source.sourceKind === "correction",
  )!;
  await root
    .collection("sources")
    .doc(corrected.id)
    .update({ sourceKind: "untrusted" });
  await assert.rejects(
    query.retrieve(
      uid,
      "¿Qué película quiero ver?",
      (await model.embed(["ficticio"]))[0]!,
    ),
  );
});

test("expired, stale, modified and foreign offers fail before capture", async () => {
  const input = offer(),
    plan = await planned(input),
    command = decision(input, plan, "accept"),
    count = model.calls;
  await assert.rejects(
    apply.execute("other-owner", command, provider, allowed),
    { message: "permission-denied" },
  );
  await assert.rejects(
    apply.execute(
      uid,
      { ...command, turn: { ...input, text: "Dato cambiado" } },
      provider,
      allowed,
    ),
  );
  await assert.rejects(
    apply.execute(
      uid,
      { ...command, plan: { ...plan, action: "tell" } },
      provider,
      allowed,
    ),
  );
  await root.collection("runtime").doc("memory").set({ revision: 1 });
  await assert.rejects(apply.execute(uid, command, provider, allowed));
  await root.collection("runtime").doc("memory").set({ revision: 0 });
  now += 300_001;
  await assert.rejects(apply.execute(uid, command, provider, allowed));
  assert.equal(model.calls, count);
  assert.equal((await root.collection("sources").get()).size, 0);
});

test("natural correction preserves other facts, revokes old evidence and replays without provider", async () => {
  const { input, target, plan } = await correction();
  const command = decision(input, plan, "apply");
  assert.equal(
    (await apply.execute(uid, command, provider, allowed)).status,
    "corrected",
  );
  assert.equal(
    (await root.collection("sources").doc(target.source.id).get()).exists,
    false,
  );
  const memories = await root.collection("memories").get();
  assert.equal(memories.size, 2);
  assert.ok(
    memories.docs.some(
      (entry) => entry.get("text") === "Me apetece ver Niebla.",
    ),
  );
  assert.ok(
    memories.docs.some(
      (entry) => entry.get("text") === target.memories[1]!.text,
    ),
  );
  const count = model.calls;
  now += 600_000;
  assert.equal(
    (await apply.execute(uid, command, provider, allowed)).status,
    "corrected",
  );
  assert.equal(model.calls, count);
  await assert.rejects(
    apply.execute(
      uid,
      { ...command, requestId: randomUUID() },
      provider,
      allowed,
    ),
  );
});

test("ambiguous references and negative independent review clarify without mutation", async () => {
  const { input, target } = await correction();
  const ambiguous = {
    ...input,
    requestId: randomUUID(),
    context: { questions: [], sourceIds: [target.source.id, randomUUID()] },
  };
  assert.equal(
    (await route.execute(uid, ambiguous, provider, allowed)).status,
    "needsClarification",
  );
  model.allowed = false;
  assert.equal(
    (
      await route.execute(
        uid,
        { ...input, requestId: randomUUID() },
        provider,
        allowed,
      )
    ).status,
    "needsClarification",
  );
  assert.equal(
    (await root.collection("sources").doc(target.source.id).get()).exists,
    true,
  );
  assert.equal((await root.collection("revocations").get()).size, 0);
});

test("invented facts and duplicate or foreign IDs cannot create actionable plans", async () => {
  const input = offer();
  model.intent.fact = "Me gusta un dato inventado.";
  await assert.rejects(route.execute(uid, input, provider, allowed));
  const { input: editing, target } = await correction();
  model.selection.memoryIds = [target.memories[0]!.id, target.memories[0]!.id];
  assert.equal(
    (
      await route.execute(
        uid,
        { ...editing, requestId: randomUUID() },
        provider,
        allowed,
      )
    ).status,
    "needsClarification",
  );
  model.selection.memoryIds = [randomUUID()];
  assert.equal(
    (
      await route.execute(
        uid,
        { ...editing, requestId: randomUUID() },
        provider,
        allowed,
      )
    ).status,
    "needsClarification",
  );
});

test("version changes and revocation during planning cannot commit a stale correction", async () => {
  const { input, target, plan } = await correction();
  await root
    .collection("memories")
    .doc(target.memories[0]!.id)
    .update({ revision: 2 });
  await assert.rejects(
    apply.execute(uid, decision(input, plan, "apply"), provider, allowed),
    { message: "failed-precondition" },
  );
  const retirement = new FirestoreSourceRetirementStore(db, () => now);
  model.afterReview = async () =>
    retirement
      .retire(
        uid,
        randomUUID(),
        await retirement.inspect(uid, target.source.id),
      )
      .then(() => {});
  await assert.rejects(
    route.execute(
      uid,
      { ...input, requestId: randomUUID() },
      provider,
      allowed,
    ),
  );
  assert.equal((await root.collection("memories").get()).size, 0);
});

test("accepted clarification cannot redisplay or resurrect a pre-forgetting pending fact", async () => {
  const input = offer(),
    plan = await planned(input);
  model.clarifyCapture = true;
  const command = decision(input, plan, "accept");
  assert.equal(
    (await apply.execute(uid, command, provider, allowed)).status,
    "needsClarification",
  );
  await root.collection("runtime").doc("memory").set({ revision: 1 });
  const capture = new FirestoreCaptureStore(db, () => now);
  assert.equal(
    (await capture.operation(uid, command.requestId)).status,
    "expired",
  );
  await assert.rejects(
    capture.begin(uid, {
      apiVersion: 1,
      requestId: randomUUID(),
      clarificationId: command.requestId,
      expectedRevision: 1,
      text: "El examen ficticio.",
    }),
  );
  assert.equal((await root.collection("sources").get()).size, 0);
});

test("two acceptance IDs cannot race into two canonical captures", async () => {
  const input = offer(),
    plan = await planned(input);
  const results = await Promise.allSettled([
    apply.execute(uid, decision(input, plan, "accept"), provider, allowed),
    apply.execute(uid, decision(input, plan, "accept"), provider, allowed),
  ]);
  assert.equal(
    results.filter((result) => result.status === "fulfilled").length,
    1,
  );
  assert.equal((await root.collection("sources").get()).size, 1);
});

test("a correction crossing midnight keeps the owner's original message time", async () => {
  now = Date.parse("2026-11-14T22:59:30.000Z");
  const { input, plan } = await correction();
  now += 60_000;
  assert.equal(
    (
      await apply.execute(
        uid,
        decision(input, plan, "apply"),
        provider,
        allowed,
      )
    ).status,
    "corrected",
  );
  const created = await root
    .collection("sources")
    .where("sourceKind", "==", "correction")
    .get();
  assert.equal(created.size, 1);
  assert.equal(created.docs[0]?.get("receivedAt"), "2026-11-14T22:59:30.000Z");
});

test("tell routes also require independent review and a global forget cannot become a partial deletion", async () => {
  const target = await seed();
  model.intent.action = "tell";
  model.allowed = false;
  assert.equal(
    (
      await route.execute(
        uid,
        turn("Texto ambiguo.", "tell"),
        provider,
        allowed,
      )
    ).status,
    "needsClarification",
  );
  model.intent.action = "forgetAll";
  assert.equal(
    (
      await route.execute(
        uid,
        turn("Olvida toda mi memoria."),
        provider,
        allowed,
      )
    ).status,
    "needsClarification",
  );
  assert.equal(
    (await root.collection("sources").doc(target.source.id).get()).exists,
    true,
  );
  assert.equal((await root.collection("revocations").get()).size, 0);
});

test("disabling the owner after plan review prevents ticket issuance and later acceptance", async () => {
  const input = offer();
  model.afterReview = async () => {
    await db.doc("privateConfiguration/owner").update({ enabled: false });
  };
  await assert.rejects(route.execute(uid, input, provider, allowed));
  const record = await root.collection("operations").doc(input.requestId).get();
  assert.equal(record.get("planHash"), undefined);
  assert.equal((await root.collection("sources").get()).size, 0);
  await db.doc("privateConfiguration/owner").update({ enabled: true });
  model.afterReview = async () => {};
  const second = offer(),
    plan = await planned(second);
  await db.doc("privateConfiguration/owner").update({ enabled: false });
  await assert.rejects(
    apply.execute(uid, decision(second, plan, "accept"), provider, allowed),
  );
  assert.equal((await root.collection("sources").get()).size, 0);
});
