import test from "node:test";
import assert from "node:assert/strict";
import { queryReliabilityCases } from "../evaluation/query-reliability-cases.ts";
import { answerEvidenceView } from "../ai/answer-evidence.ts";

test("query reliability cases build current synthetic evidence and separate private expectations", () => {
  assert.equal(
    new Set(queryReliabilityCases.map((c) => c.id)).size,
    queryReliabilityCases.length,
  );
  for (const scenario of queryReliabilityCases) {
    const { h, expectedIds } = scenario.setup();
    const units = Object.values(h.store.read().units);
    assert.ok(
      expectedIds.every((id) => units.some((unit) => unit.id === id)),
      scenario.id,
    );
    assert.equal(
      expectedIds.length > 0,
      scenario.expected === "answered",
      scenario.id,
    );
    if (units.length) {
      const view = answerEvidenceView(
        h.engine.evidence(
          h.owner,
          units.map((u) => u.id),
        ).items,
      );
      assert.equal(view.length, units.length);
      assert.ok(!JSON.stringify(view).includes('"expected"'));
    }
  }
});
