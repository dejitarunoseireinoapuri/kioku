import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { beforeEach, after, test } from "node:test";
import { deleteApp } from "firebase-admin/app";
import { ChangeMemory } from "../../src/memory-control/change.js";
import { FirestoreSourceControlStore } from "../../src/firebase/source-control-store.js";
import { FirestoreCaptureStore } from "../../src/firebase/capture-store.js";
import { parseInput } from "../../src/memory/contracts.js";
import { changeInput } from "../../src/memory-control/contracts.js";
import { searchProjection } from "../../src/query/search-projection.js";
import { fixture, uid, at } from "./retirement-fixtures.js";
import { ConversationIntelligence } from "./conversation-fixtures.js";
import { db, adminApp } from "./helpers.js";
import { RouteMessage } from "../../src/conversation/route.js";
import { FirestoreRoutingStore } from "../../src/firebase/routing-store.js";
import { ApplyMessage } from "../../src/conversation/apply.js";
import { turn } from "./conversation-fixtures.js";
import { selectiveChange } from "../../src/memory-control/selection.js";
import type { ForgetEvidence } from "#memory-core/forget-format";

let now = at;
const root = db.doc(`accounts/${uid}`),
  store = new FirestoreSourceControlStore(db, () => now);
const service = new ChangeMemory(store),
  allowed = async () => {};
class Duplicates extends ConversationIntelligence {
  selected: string[] | null = null;
  reviewAllowed = true;
  unresolved = false;
  evidence: ForgetEvidence[] = [];
  afterSelection: () => Promise<void> = async () => {};
  batches = 0;
  async selectDuplicateFacts(data: {
    memories: { id: string; text: string }[];
  }) {
    this.calls++;
    this.batches++;
    await this.afterSelection();
    return {
      memoryIds:
        this.selected ??
        data.memories.filter((m) => m.text.includes("Loto")).map((m) => m.id),
      unresolved: this.unresolved,
      evidence: this.evidence,
      question: this.unresolved ? "¿Qué Loto?" : null,
    };
  }
  async reviewDuplicateFacts() {
    this.calls++;
    await this.afterReview();
    return { allowed: this.reviewAllowed };
  }
}
let model = new Duplicates();
const provider = async () => model;
beforeEach(async () => {
  now = at;
  model = new Duplicates();
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
async function seedCopies(count = 2, units = 2) {
  const entries = Array.from({ length: count }, () => fixture(units));
  const write = db.batch();
  for (const { source, memories } of entries) {
    write.set(root.collection("sources").doc(source.id), source);
    for (const memory of memories)
      write.set(root.collection("memories").doc(memory.id), {
        ...memory,
        ...searchProjection(memory),
      });
  }
  await write.commit();
  const first = entries[0]!;
  const command = parseInput(changeInput, {
    apiVersion: 1,
    requestId: randomUUID(),
    sourceId: first.source.id,
    expectedVersion: (await store.details(uid, first.source.id)).version,
    memoryIds: [first.memories[0]!.id],
    action: "forget",
    correction: null,
    zone: "Europe/Madrid",
    forgetScope: "allOccurrences",
  });
  return { entries, command };
}
async function unchanged(count: number) {
  assert.equal((await root.collection("sources").get()).size, count);
  assert.equal((await root.collection("revocations").get()).size, 0);
}

test("all copies beyond the retrieval top six retire atomically, preserving every unrelated unit and replay", async () => {
  const { entries, command } = await seedCopies(12);
  await root
    .collection("operations")
    .doc(entries[4]!.source.id)
    .set({ sourceId: entries[4]!.source.id, syntheticOnly: true });
  const result = await service.execute(uid, command, provider, allowed);
  assert.equal(result.status, "forgotten");
  assert.equal(result.memoryEpoch, 1);
  assert.deepEqual(result.sources, []);
  assert.equal((await root.collection("sources").get()).size, 12);
  const memories = await root.collection("memories").get();
  assert.equal(memories.size, 12);
  assert.ok(
    memories.docs.every(
      (m) =>
        m.get("text").includes("examen") && !m.get("text").includes("Loto"),
    ),
  );
  assert.equal((await root.collection("revocations").get()).size, 12);
  const receipt = (
    await root.collection("operations").doc(command.requestId).get()
  ).data()!;
  assert.equal(receipt.references.length, 12);
  assert.ok(!JSON.stringify(receipt).includes("Loto"));
  assert.equal(
    (await root.collection("operations").doc(entries[4]!.source.id).get()).get(
      "kind",
    ),
    "retired",
  );
  const calls = model.calls;
  assert.deepEqual(
    await service.execute(uid, command, provider, allowed),
    result,
  );
  assert.equal(model.calls, calls);
  const captures = new FirestoreCaptureStore(db, () => now);
  await assert.rejects(captures.source(uid, entries[0]!.source.id));
});

test("scope source remains narrow, and a changed input cannot reuse an all-occurrences receipt", async () => {
  const { command } = await seedCopies();
  const narrow = { ...command, forgetScope: "source" as const };
  assert.equal(
    (await service.execute(uid, narrow, provider, allowed)).status,
    "forgotten",
  );
  assert.equal(
    (
      await root
        .collection("memories")
        .where("text", "==", "Quiero ver Loto.")
        .get()
    ).size,
    1,
  );
  await assert.rejects(service.execute(uid, command, provider, allowed));
});

async function shareEvidence() {
  const seeded = await seedCopies();
  const write = db.batch();
  for (const entry of seeded.entries) {
    for (const memory of entry.memories) {
      write.update(root.collection("memories").doc(memory.id), {
        quote: entry.source.text,
        entities: memory.text.includes("examen") ? ["examen"] : ["Loto"],
      });
      model.evidence.push({
        memoryId: memory.id,
        quote: memory.quote,
        timeQuote: memory.time.quote,
        attributionEvidence: memory.attributionEvidence,
      });
    }
  }
  await write.commit();
  seeded.command.expectedVersion = (
    await store.details(uid, seeded.command.sourceId)
  ).version;
  return seeded;
}

test("shared evidence is separated atomically across copies, retaining only the independent facts", async () => {
  const { command, entries } = await shareEvidence();
  const result = await service.execute(uid, command, provider, allowed);
  assert.equal(result.status, "forgotten");
  assert.equal(result.memoryEpoch, 1);
  const saved = await root.collection("memories").get();
  assert.equal(saved.size, 2);
  for (const entry of saved.docs) {
    assert.equal(entry.get("text"), "El examen ficticio es el martes.");
    assert.equal(entry.get("quote"), entry.get("text"));
    assert.equal(entry.get("revision"), 2);
    assert.ok(!JSON.stringify(entry.data()).includes("Loto"));
  }
  const retained = await root.collection("sources").get();
  assert.equal(retained.size, 2);
  assert.ok(
    retained.docs.every((s) => !JSON.stringify(s.data()).includes("Loto")),
  );
  for (const entry of entries)
    await assert.rejects(store.details(uid, entry.source.id));
  const calls = model.calls;
  assert.deepEqual(
    await service.execute(uid, command, provider, allowed),
    result,
  );
  assert.equal(model.calls, calls);
});

test("a rejected or fabricated separation leaves every shared source and fact intact", async () => {
  const { command } = await shareEvidence();
  model.reviewAllowed = false;
  assert.equal(
    (await service.execute(uid, command, provider, allowed)).status,
    "needsClarification",
  );
  await unchanged(2);
  assert.equal((await root.collection("memories").get()).size, 4);
  model.reviewAllowed = true;
  model.evidence[0]!.quote = "Un literal inventado.";
  await assert.rejects(
    service.execute(
      uid,
      { ...command, requestId: randomUUID() },
      provider,
      allowed,
    ),
  );
  await unchanged(2);
});

test("ambiguity, negative review and malformed selections never mutate the first prepared source", async () => {
  const { command } = await seedCopies();
  model.unresolved = true;
  const unclear = await service.execute(uid, command, provider, allowed);
  assert.equal(unclear.status, "needsClarification");
  assert.equal(unclear.text, "¿Qué Loto?");
  await unchanged(2);
  model.unresolved = false;
  model.reviewAllowed = false;
  assert.equal(
    (
      await service.execute(
        uid,
        { ...command, requestId: randomUUID() },
        provider,
        allowed,
      )
    ).status,
    "needsClarification",
  );
  await unchanged(2);
  model.reviewAllowed = true;
  for (const selected of [
    [],
    ["foreign-1"],
    [command.memoryIds[0]!, command.memoryIds[0]!],
  ]) {
    model.selected = selected;
    await assert.rejects(
      service.execute(
        uid,
        { ...command, requestId: randomUUID() },
        provider,
        allowed,
      ),
    );
    await unchanged(2);
  }
});

test("a newly captured copy during review invalidates the complete inventory instead of leaving it behind", async () => {
  const { command } = await seedCopies();
  model.afterReview = async () => {
    model.afterReview = async () => {};
    await seedCopies(1);
  };
  await assert.rejects(service.execute(uid, command, provider, allowed));
  await unchanged(3);
  assert.equal((await root.collection("memories").get()).size, 6);
});

test("source edits, epoch changes, owner disabling and lease replacement prevent the whole multi-source commit", async () => {
  const { entries, command } = await seedCopies();
  model.afterReview = async () => {
    await root
      .collection("sources")
      .doc(entries[1]!.source.id)
      .update({ text: entries[1]!.source.text + " " });
  };
  await assert.rejects(service.execute(uid, command, provider, allowed));
  await unchanged(2);
  model.afterReview = async () => {
    await root.collection("runtime").doc("memory").set({ revision: 1 });
  };
  await assert.rejects(
    service.execute(
      uid,
      { ...command, requestId: randomUUID() },
      provider,
      allowed,
    ),
  );
  await unchanged(2);
  model.afterReview = async () => {
    await db.doc("privateConfiguration/owner").update({ enabled: false });
  };
  await assert.rejects(
    service.execute(
      uid,
      { ...command, requestId: randomUUID() },
      provider,
      allowed,
    ),
  );
  await unchanged(2);
  await db.doc("privateConfiguration/owner").update({ enabled: true });
  model.afterReview = async () => {
    await root
      .collection("runtime")
      .doc("capture")
      .update({ nonce: randomUUID() });
  };
  await assert.rejects(
    service.execute(
      uid,
      { ...command, requestId: randomUUID() },
      provider,
      allowed,
    ),
  );
  await unchanged(2);
});

test("foreign owners, oversized complete inventories and unsupported scope fail without a partial deletion", async () => {
  const { command } = await seedCopies();
  await assert.rejects(
    service.execute("different-owner", command, provider, allowed),
  );
  assert.throws(() =>
    parseInput(changeInput, {
      ...command,
      action: "correct",
      correction: "Dato.",
      forgetScope: "allOccurrences",
    }),
  );
  const write = db.batch();
  for (let i = 0; i < 127; i++) {
    const { source, memories } = fixture(1);
    write.set(root.collection("sources").doc(source.id), source);
    for (const memory of memories)
      write.set(root.collection("memories").doc(memory.id), {
        ...memory,
        ...searchProjection(memory),
      });
  }
  await write.commit();
  const before = model.calls;
  const result = await service.execute(uid, command, provider, allowed);
  assert.equal(result.status, "needsClarification");
  assert.equal(model.calls, before);
  await unchanged(129);
});

test("pending copies and all original receipts are retired, and no payload text is persisted in control metadata", async () => {
  const { entries, command } = await seedCopies();
  const id = randomUUID();
  await root
    .collection("operations")
    .doc(id)
    .set({
      pending: {
        turn: { id: entries[1]!.source.id, text: "Quiero ver Loto." },
      },
    });
  assert.equal(
    (await service.execute(uid, command, provider, allowed)).status,
    "forgotten",
  );
  const removed = (await root.collection("operations").doc(id).get()).data()!;
  assert.deepEqual(Object.keys(removed).sort(), ["expiresAt", "kind"]);
  assert.equal(removed.kind, "retired");
  const operations = await root.collection("operations").get();
  assert.ok(
    operations.docs.every(
      (entry) => !JSON.stringify(entry.data()).includes("Loto"),
    ),
  );
});

test("a rejection in the last batch leaves all earlier prepared copies intact", async () => {
  const { command } = await seedCopies(33);
  model.afterReview = async () => {
    if (model.batches === 2) model.reviewAllowed = false;
  };
  const result = await service.execute(uid, command, provider, allowed);
  assert.equal(result.status, "needsClarification");
  assert.equal(model.batches, 2);
  await unchanged(33);
});

test("write budget overflow refuses the entire operation and never commits its first sources", async () => {
  const { command } = await seedCopies(32, 8);
  const result = await service.execute(uid, command, provider, allowed);
  assert.equal(result.status, "needsClarification");
  await unchanged(32);
  assert.equal((await root.collection("memories").get()).size, 256);
});

test("a malformed complete inventory is rejected before semantic selection", async () => {
  const { entries, command } = await seedCopies();
  await root
    .collection("sources")
    .doc(entries[1]!.source.id)
    .update({ memoryCount: 7 });
  const calls = model.calls;
  await assert.rejects(service.execute(uid, command, provider, allowed));
  assert.equal(model.calls, calls);
  await unchanged(2);
});

test("revoked result sources and expired scopes cannot be recovered as successful current evidence", async () => {
  const { command } = await seedCopies();
  model.afterReview = async () => {
    now += 300_001;
  };
  await assert.rejects(service.execute(uid, command, provider, allowed));
  await unchanged(2);
  now = at;
  model.afterReview = async () => {};
  const next = { ...command, requestId: randomUUID() };
  const result = await service.execute(uid, next, provider, allowed);
  assert.equal(result.status, "forgotten");
  const receipt = (
    await root.collection("operations").doc(next.requestId).get()
  ).data()!;
  await root
    .collection("revocations")
    .doc(receipt.references[0].sourceId)
    .set({ operationId: randomUUID() });
  await assert.rejects(service.execute(uid, next, provider, allowed));
});

test("natural forget scope is explicit, authenticated by its ticket, and never falls back to one source", async () => {
  const { entries } = await seedCopies();
  const routingStore = new FirestoreRoutingStore(db, () => now);
  const route = new RouteMessage(routingStore, store);
  model.intent.action = "forget";
  model.intent.useContext = true;
  model.selection = {
    memoryIds: [entries[0]!.memories[0]!.id],
    correction: null,
    question: null,
  };
  const input = turn("Olvida ese dato.");
  input.context.sourceIds = [entries[0]!.source.id];
  assert.equal(
    (await route.execute(uid, input, provider, allowed)).status,
    "needsClarification",
  );
  model.intent.forgetScope = "allOccurrences";
  const next = { ...input, requestId: randomUUID() };
  const result = await route.execute(uid, next, provider, allowed);
  assert.equal(result.status, "ready");
  if (result.status !== "ready" || result.plan.action !== "forget")
    throw Error("Expected forget plan");
  assert.equal(result.plan.forgetScope, "allOccurrences");
  const apply = new ApplyMessage(
    routingStore,
    store,
    (memoryEpoch, receivedAt) =>
      new FirestoreCaptureStore(db, () => now, { memoryEpoch, receivedAt }),
  );
  const requestId = randomUUID();
  await assert.rejects(
    apply.execute(
      uid,
      {
        apiVersion: 1,
        requestId,
        turn: next,
        plan: { ...result.plan, forgetScope: "source" },
        decision: "apply",
      },
      provider,
      allowed,
    ),
  );
  await unchanged(2);
  assert.equal(
    (
      await apply.execute(
        uid,
        {
          apiVersion: 1,
          requestId,
          turn: next,
          plan: result.plan,
          decision: "apply",
        },
        provider,
        allowed,
      )
    ).status,
    "forgotten",
  );
  assert.equal((await root.collection("memories").get()).size, 2);
});

test("storage rejects a replacement that changes an unrelated memory or supplies foreign deletion IDs", async () => {
  const { command } = await seedCopies();
  const work = await store.begin(uid, command);
  if ("status" in work) throw Error("Expected work");
  const inventory = await store.inventory(uid, work),
    bundle = await store.bundle(uid, command.sourceId);
  const change = selectiveChange(
    bundle.source,
    bundle.memories,
    command.memoryIds,
  );
  const prepared = {
    bundle,
    snapshot: change.replacement,
    selectedIds: command.memoryIds,
  };
  const edited = structuredClone(prepared);
  edited.snapshot.memories[0]!.text = "Información ajena cambiada sin permiso.";
  await assert.rejects(
    store.forget(uid, command, inventory, [edited], work, Date.now() + 160_000),
  );
  const foreign = structuredClone(prepared);
  foreign.bundle.memories[0]!.id = `${randomUUID()}-1`;
  await assert.rejects(
    store.forget(
      uid,
      command,
      inventory,
      [foreign],
      work,
      Date.now() + 160_000,
    ),
  );
  await assert.rejects(
    store.forget(uid, command, inventory, [prepared], work, 0),
  );
  await unchanged(2);
  await store.fail(uid, work);
});
