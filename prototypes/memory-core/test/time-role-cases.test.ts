import test from "node:test";
import assert from "node:assert/strict";
import { timeRoleCases } from "../evaluation/time-role-cases.ts";
import { boundedReserve } from "../evaluation/bounded.ts";
import { gradeAnswer, normalize } from "../evaluation/grade.ts";
import { harness } from "../fixtures/harness.ts";
import { twoPlans } from "../fixtures/scenarios.ts";

test("temporal contrast preserves exposed expectations and covers unknown, explicit, relative, edited and repeated date roles", () => {
  assert.equal(timeRoleCases.length, 8);
  assert.equal(new Set(timeRoleCases.map((c) => c.id)).size, 8);
  assert.deepEqual(
    timeRoleCases[0]!.units,
    boundedReserve.find((c) => c.id === "j39")!.units,
  );
  assert.equal(timeRoleCases[2]!.units[0]!.time.value, "2026-06-03");
  assert.equal(timeRoleCases[3]!.units[0]!.time.value, "2026-07-13");
  assert.equal(timeRoleCases[4]!.units[0]!.time.value, "2026-07-15");
  assert.equal(timeRoleCases[6]!.correction!.expected.time.value, "2026-08-12");
  for (const c of timeRoleCases) {
    for (const pattern of [
      ...c.units.flatMap((u) => u.terms),
      ...c.queries.flatMap((q) => q.terms),
    ])
      assert.equal(pattern, normalize(pattern));
    assert.equal(c.units.length, 2);
    if (c.repeat) assert.equal(c.repeat.count, c.units.length);
    assert.ok(c.queries.length >= 3);
    assert.equal(c.after.length, c.queries.length);
  }
});
test("temporal oracle rejects inventing a purchase day from the target date and swapping explicitly distinct dates", () => {
  const h = harness();
  h.save(twoPlans());
  const units = Object.values(h.store.read().units);
  const first = timeRoleCases[0]!;
  const mapping = new Map(first.units.map((u, i) => [u.label, units[i]!]));
  const unknown = first.queries[2]!;
  assert.ok(
    gradeAnswer(
      {
        status: "answered",
        text: "Compraste la entrada el 6 de junio.",
        evidence: [0],
        ids: [units[0]!.id],
      },
      unknown,
      mapping,
    ).some((c) => !c.passed && c.critical),
  );
  assert.ok(
    gradeAnswer(
      {
        status: "not_found",
        text: "No consta qué día la compraste.",
        evidence: [],
        ids: [],
      },
      unknown,
      mapping,
    ).every((c) => c.passed),
  );
  const explicit = timeRoleCases[2]!;
  const explicitMapping = new Map(
    explicit.units.map((u, i) => [u.label, units[i]!]),
  );
  const reply = {
    status: "answered" as const,
    text: "Compraste la entrada el 3 de junio.",
    evidence: [0],
    ids: [units[0]!.id],
  };
  assert.ok(
    gradeAnswer(reply, explicit.queries[0]!, explicitMapping).every(
      (c) => c.passed,
    ),
  );
  assert.ok(
    gradeAnswer(
      { ...reply, text: "Compraste la entrada el 6 de agosto." },
      explicit.queries[0]!,
      explicitMapping,
    ).some((c) => !c.passed),
  );
  assert.ok(
    gradeAnswer(
      { ...reply, text: "La función es el 6 de agosto." },
      explicit.queries[1]!,
      explicitMapping,
    ).every((c) => c.passed),
  );
});
