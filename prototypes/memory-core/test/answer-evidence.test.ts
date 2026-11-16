import test from "node:test";
import assert from "node:assert/strict";
import { answerEvidenceView } from "../ai/answer-evidence.ts";
import { harness } from "../fixtures/harness.ts";
import { twoPlans, single } from "../fixtures/scenarios.ts";

test("query view keeps first registration distinct from the date of replacement support", () => {
  const h = harness(),
    firstAt = h.runtime.now();
  const saved = h.save(single("construir una cometa"));
  h.advance(2 * 86_400_000);
  const plan = h.prepare({
    kind: "correct",
    requestId: h.runtime.id(),
    target: saved.refs[0],
    preserveTime: false,
    draft: single("tejer una bufanda"),
  });
  const changed = h.engine.commit(h.owner, plan.id);
  const view = answerEvidenceView(h.engine.details(h.owner, changed.refs))[0]!;
  assert.equal(view.recordedAt, firstAt);
  assert.equal(view.updatedAt, h.runtime.now());
  assert.ok(
    view.supports.every((source) => source.recordedAt === h.runtime.now()),
  );
  assert.ok(!JSON.stringify(view).includes("cometa"));
});

test("forgetting a neighbor preserves the exact query support without a misleading partial source envelope", () => {
  const h = harness(),
    saved = h.save(twoPlans());
  const before = answerEvidenceView(h.engine.details(h.owner, saved.refs));
  h.erase([saved.refs[0]!]);
  const after = answerEvidenceView(h.engine.details(h.owner, [saved.refs[1]!]));
  assert.deepEqual(after[0], { ...before[1], index: 0 });
  const serialized = JSON.stringify(after);
  assert.equal(
    after[0]!.recordedAt,
    h.store.read().units[saved.refs[1]!.id]!.recordedAt,
  );
  assert.equal(after[0]!.mentionCount, 1);
  for (const field of [
    "sourceId",
    "owners",
    "start",
    "end",
    "length",
    "revision",
    "membershipRevision",
  ]) {
    if (field === "end") continue; // EventTime.end is semantic, not a source offset.
    assert.ok(!serialized.includes(`"${field}":`));
  }
  assert.ok(!serialized.includes(saved.refs[0]!.id));
  assert.ok(!serialized.includes(saved.refs[1]!.id));
  const state = h.store.read();
  assert.deepEqual(
    after[0]!.supports.flatMap((s) => s.fragments.map((f) => f.text)),
    Object.values(state.fragments)
      .sort((a, b) => a.start - b.start)
      .map((f) => f.text),
  );
});

test("provider evidence view rejects foreign support and missing source calendars", () => {
  const h = harness(),
    saved = h.save(twoPlans());
  const details = h.engine.details(h.owner, saved.refs);
  const foreign = structuredClone(details);
  foreign[0]!.fragments[0]!.owners = [saved.refs[1]!.id];
  assert.throws(() => answerEvidenceView(foreign), {
    message: "ANSWER_SUPPORT_OWNERSHIP",
  });
  const missing = structuredClone(details);
  missing[0]!.sources = [];
  assert.throws(() => answerEvidenceView(missing), {
    message: "ANSWER_SUPPORT_SOURCE",
  });
});
