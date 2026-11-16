import test from "node:test";
import assert from "node:assert/strict";
import { reserve } from "../evaluation/reserve.ts";
import { tuning } from "../evaluation/tuning.ts";
import { gradeUnits, gradeAnswer, matches } from "../evaluation/grade.ts";
import { harness } from "../fixtures/harness.ts";
import { twoPlans } from "../fixtures/scenarios.ts";
import { unit, day } from "../evaluation/case.ts";
import { EvaluationBudget } from "../evaluation/runtime.ts";
import { fresh } from "../evaluation/fresh.ts";
import { holdout } from "../evaluation/holdout.ts";
import { adjustment } from "../evaluation/adjustment.ts";

test("third reserve is balanced, previously unused and defines two before/after questions per lifecycle", () => {
  assert.equal(holdout.length, 60);
  assert.equal(new Set(holdout.map((c) => c.id)).size, 60);
  assert.equal(new Set(holdout.map((c) => c.text)).size, 60);
  const used = new Set(
    [...reserve, ...fresh, ...tuning, ...adjustment].map((c) => c.text),
  );
  const families = new Map<string, number>();
  for (const c of holdout) {
    assert.ok(!used.has(c.text));
    families.set(c.family, (families.get(c.family) ?? 0) + 1);
    assert.equal(c.queries.length, 2);
    assert.equal(c.after.length, 2);
    assert.ok(c.status !== "clarify" || c.clarification);
    for (const q of [...c.queries, ...c.after])
      assert.ok(q.labels.every((l) => c.units.some((u) => u.label === l)));
    for (const u of c.units) {
      for (const pattern of [...u.terms, ...(u.forbidden ?? [])])
        assert.doesNotThrow(() => new RegExp(pattern, "u"));
    }
  }
  assert.equal(families.size, 10);
  assert.ok([...families.values()].every((n) => n === 6));
  assert.equal(holdout.filter((c) => c.clarificationAt).length, 3);
});

test("numeric obligations do not match a substring of a year, while exact days remain detectable", () => {
  assert.equal(matches("22 de julio de 2026", "20"), false);
  assert.equal(matches("20 de julio de 2026", "20"), true);
  assert.equal(matches("120 unidades", "20"), false);
  assert.equal(matches("20/07/2026", "20"), true);
});

test("explicit answer variants accept equivalent wording but still reject different facts", () => {
  const color = fresh.find((c) => c.id === "n11")!.queries[1]!.terms[0]!;
  const sport = fresh.find((c) => c.id === "n49")!.queries[1]!.terms[0]!;
  assert.ok(matches("amarillo", color) && matches("amarillas", color));
  assert.equal(matches("verde", color), false);
  assert.ok(matches("nadar", sport) && matches("natación", sport));
  assert.equal(matches("correr", sport), false);
});

test("R2 fresh reserve has sixty distinct stories, ten balanced families and independent expectations", () => {
  assert.equal(fresh.length, 60);
  assert.equal(new Set(fresh.map((c) => c.id)).size, 60);
  assert.equal(new Set(fresh.map((c) => c.text)).size, 60);
  const historical = new Set([...reserve, ...tuning].map((c) => c.text));
  const families = new Map<string, number>();
  for (const c of fresh) {
    assert.ok(!historical.has(c.text));
    families.set(c.family, (families.get(c.family) ?? 0) + 1);
    assert.ok(c.queries.length >= 2 && c.after.length >= 2);
    assert.ok(c.status !== "clarify" || c.clarification);
    for (const q of [...c.queries, ...c.after])
      assert.ok(q.labels.every((l) => c.units.some((u) => u.label === l)));
  }
  assert.equal(families.size, 10);
  assert.ok([...families.values()].every((n) => n === 6));
});

test("the oracle detects an obsolete value surviving only in literal evidence", () => {
  const h = harness();
  h.save(twoPlans());
  const state = h.store.read(),
    u = Object.values(state.units)[0]!;
  const f = Object.values(state.fragments).find((f) =>
    f.owners.includes(u.id),
  )!;
  f.text += " obsoletevalue";
  const result = gradeUnits(state, [
    unit("first", ["dibujar"], u.content.kind, u.time, {
      forbidden: ["obsoletevalue"],
    }),
  ]);
  assert.ok(
    result.checks.some(
      (c) => c.name === "first:no_old_evidence" && !c.passed && c.critical,
    ),
  );
});

test("R2 reserved corpus is independent of tuning, complete and balanced", () => {
  assert.equal(reserve.length, 60);
  assert.equal(new Set(reserve.map((c) => c.id)).size, 60);
  const families = new Map<string, number>();
  for (const c of reserve) {
    assert.equal(
      tuning.some((t) => t.text === c.text),
      false,
    );
    families.set(c.family, (families.get(c.family) ?? 0) + 1);
    assert.ok(c.queries.length >= 2);
    assert.ok(c.after.length >= 2);
    assert.ok(c.status !== "clarify" || c.clarification);
    const labels = new Set(c.units.map((u) => u.label));
    for (const q of [...c.queries, ...c.after])
      assert.ok(q.labels.every((l) => labels.has(l)));
    assert.ok(c.forget.every((l) => labels.has(l)));
  }
  assert.equal(families.size, 10);
  assert.ok([...families.values()].every((n) => n >= 6));
});
test("R2 independent oracle rejects wrong date, modality and removal of condition", () => {
  const h = harness();
  h.save(twoPlans());
  const state = h.store.read();
  const first = Object.values(state.units)[0]!;
  const expected = unit(
    "one",
    [first.content.text.toLowerCase().replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")],
    first.content.kind,
    first.time,
    { condition: "necessary" },
  );
  const missingCondition = gradeUnits(state, [expected]).checks;
  assert.ok(
    missingCondition.some(
      (c) => c.name === "one:condition" && !c.passed && c.critical,
    ),
  );
  first.time = day("2001-01-01");
  first.content.kind = "fact";
  const wrong = gradeUnits(state, [{ ...expected, kind: "intention" }]).checks;
  assert.ok(wrong.some((c) => c.name === "one:time" && !c.passed));
  assert.ok(
    wrong.some((c) => c.name === "one:kind" && !c.passed && c.critical),
  );
});
test("R2 answer grading cannot pass by naming the expected word with the wrong evidence", () => {
  const result = gradeAnswer(
    {
      status: "answered",
      text: "correct keyword",
      evidence: [0],
      ids: ["wrong"],
    },
    { text: "question", labels: ["missing"], terms: ["keyword"] },
    new Map(),
  );
  assert.ok(
    result.some((c) => c.name === "answer_evidence" && !c.passed && c.critical),
  );
});

test("R2 budget is durable before a paid call and preserves unresolved usage on write failure", async () => {
  const ledger = {
    spentUsd: 1,
    reservedUsd: 0.2,
    calls: 2,
    input: 10,
    output: 20,
    previousM0Spent: 21,
    previousM0Reserved: 0.2,
  };
  let fail = true;
  const meter = new EvaluationBudget(structuredClone(ledger), 30, async () => {
    if (fail) throw new Error("synthetic-write-failure");
  });
  await assert.rejects(() => meter.reserve(0.1));
  assert.deepEqual(meter.ledger, ledger);
  fail = false;
  await meter.reserve(0.1);
  fail = true;
  await assert.rejects(() => meter.settle(0.1, 100, 100));
  assert.equal(meter.ledger.spentUsd, 1);
  assert.ok(meter.ledger.reservedUsd >= 0.3);
  fail = false;
  meter.runCeiling = 1.31;
  await assert.rejects(() => meter.reserve(0.02));
  assert.equal(meter.ledger.calls, 3);
});
