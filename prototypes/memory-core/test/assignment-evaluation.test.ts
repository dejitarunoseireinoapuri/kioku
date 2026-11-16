import test from "node:test";
import assert from "node:assert/strict";
import { uniqueAssignment } from "../evaluation/assignment.ts";
import {
  gradeUnits,
  gradeAnswer,
  gradeRelations,
} from "../evaluation/grade.ts";
import { harness } from "../fixtures/harness.ts";
import { twoPlans } from "../fixtures/scenarios.ts";
import { unit, scenario } from "../evaluation/case.ts";
import { forgetTargets } from "../evaluation/forget.ts";
import { scopeReserve } from "../evaluation/scope.ts";
import { scopeRegression } from "../evaluation/scope-regression.ts";

test("bounded matching agrees with exhaustive independent bijections for every three-unit graph", () => {
  const permutations = [
    [0, 1, 2],
    [0, 2, 1],
    [1, 0, 2],
    [1, 2, 0],
    [2, 0, 1],
    [2, 1, 0],
  ];
  for (let mask = 0; mask < 512; mask++) {
    const edges = Array.from({ length: 3 }, (_, row) =>
      Array.from({ length: 3 }, (_, col) =>
        Boolean(mask & (1 << (row * 3 + col))),
      ),
    );
    const valid = permutations.filter((p) =>
      p.every((col, row) => edges[row]![col]),
    );
    assert.deepEqual(
      uniqueAssignment(edges),
      valid.length === 1 ? valid[0] : null,
    );
  }
  assert.deepEqual(
    uniqueAssignment([
      [true, true],
      [false, true],
    ]),
    [0, 1],
  );
  assert.equal(
    uniqueAssignment(Array.from({ length: 9 }, () => Array(9).fill(true))),
    null,
  );
});

function overlapping() {
  const h = harness();
  h.save(twoPlans("visitar cantera", "llevar casco para visitar cantera"));
  const state = h.store.read(),
    units = Object.values(state.units);
  units[1]!.time = structuredClone(units[0]!.time);
  const gold = [
    unit("visit", ["visitar", "cantera"], "intention", units[0]!.time),
    unit(
      "helmet",
      ["llevar", "casco", "visitar", "cantera"],
      "intention",
      units[1]!.time,
    ),
  ];
  return { state, units, gold };
}

test("global grading uses evidence and every identity anchor, rejects real ambiguity and missing support", () => {
  const { state, units, gold } = overlapping();
  const graded = gradeUnits(state, gold);
  assert.ok(graded.checks.every((c) => c.passed));
  assert.equal(graded.mapping.get("visit")!.id, units[0]!.id);
  for (const change of [
    "subject",
    "polarity",
    "kind",
    "condition",
    "attribution",
    "time",
    "evidence",
  ] as const) {
    const bad = structuredClone(state),
      u = Object.values(bad.units)[1]!;
    if (change === "subject") {
      gold[1]!.subject = "^owner$";
      u.content.subject = "other";
    } else if (change === "polarity") u.content.polarity = "negative";
    else if (change === "kind") u.content.kind = "fact";
    else if (change === "condition") u.content.condition = "si nieva";
    else if (change === "attribution") u.content.attribution = "other";
    else if (change === "time") u.time.value = "2001-01-01";
    else
      for (const f of Object.values(bad.fragments))
        f.owners = f.owners.filter((id) => id !== u.id);
    assert.ok(gradeUnits(bad, gold).checks.some((c) => !c.passed));
    assert.equal(
      gradeUnits(bad, gold).checks.find((c) => c.name === "helmet:meaning")!
        .passed,
      false,
    );
  }
  const ambiguous = [gold[0]!, { ...gold[0]!, label: "other" }];
  assert.ok(
    gradeUnits(state, ambiguous).checks.some(
      (c) => c.name.endsWith(":meaning") && !c.passed,
    ),
  );
});

test("canonical contamination is rejected even with clean literals and after the independent fact is forgotten", () => {
  const h = harness();
  const saved = h.save(
    twoPlans(
      "buscar al hermano del padrastro",
      "llevar al padrastro al puerto",
    ),
  );
  const state = h.store.read(),
    [pickup, port] = Object.values(state.units);
  const gold = [
    unit(
      "pickup",
      ["buscar", "hermano", "padrastro"],
      "intention",
      pickup!.time,
    ),
    unit("port", ["llevar", "puerto", "padrastro"], "intention", port!.time, {
      forbidden: ["buscar", "hermano"],
    }),
  ];
  assert.ok(gradeUnits(state, gold).checks.every((c) => c.passed));
  for (const field of [
    "text",
    "proposition",
    "subject",
    "condition",
    "attribution",
  ] as const) {
    const bad = structuredClone(state);
    bad.units[port!.id]!.content[field] =
      `${port!.content[field] ?? ""} buscar al hermano`;
    assert.ok(
      gradeUnits(bad, gold).checks.some(
        (c) => c.name === "port:no_foreign_content" && !c.passed && c.critical,
      ),
    );
  }
  h.erase([saved.refs[0]!]);
  const remaining = h.store.read();
  remaining.units[port!.id]!.content.proposition += " buscar al hermano";
  assert.ok(
    gradeUnits(remaining, [gold[1]!]).checks.some(
      (c) => c.name === "port:no_old_content" && !c.passed,
    ),
  );
  assert.ok(
    gradeAnswer(
      {
        status: "answered",
        text: "Fuiste a buscar a su hermano",
        evidence: [0],
        ids: [port!.id],
      },
      {
        text: "¿Con quién fui a buscar?",
        labels: [],
        terms: [],
        status: "not_found",
      },
      new Map([["port", port!]]),
    ).some((c) => c.name === "answer_evidence" && !c.passed && c.critical),
  );
});

test("dependency scope requires exact explicit fixture authorization, preserving unrelated units", () => {
  const h = harness(),
    draft = twoPlans();
  draft.relations = [{ kind: "requires", from: "b", to: { key: "a" } }];
  h.save(draft);
  const units = Object.values(h.store.read().units),
    mapping = new Map([
      ["base", units[0]!],
      ["child", units[1]!],
    ]);
  const c = scenario("synthetic", "time", draft.text, [], [], {
    forget: ["base"],
    forgetClosure: ["child"],
  });
  const before = structuredClone(h.store.read());
  const selected = forgetTargets(h, c, mapping);
  assert.deepEqual(h.store.read(), before);
  for (const wrong of [[], ["base"], ["child", "base"]])
    assert.throws(
      () => forgetTargets(h, { ...c, forgetClosure: wrong }, mapping),
      { message: "EXPECTED_DEPENDENCY_SCOPE" },
    );
  const withoutClosure = structuredClone(c);
  delete withoutClosure.forgetClosure;
  assert.throws(() => h.erase(forgetTargets(h, withoutClosure, mapping)), {
    code: "scope_unresolved",
  });
  const edge = [{ kind: "requires" as const, from: "child", to: "base" }];
  assert.ok(gradeRelations(before, edge, mapping).every((c) => c.passed));
  assert.equal(
    gradeRelations(
      before,
      [{ kind: "requires", from: "base", to: "child" }],
      mapping,
    )[0]!.passed,
    false,
  );
  assert.equal(
    gradeRelations(
      before,
      [{ kind: "possibleSameAs", from: "child", to: "base" }],
      mapping,
    )[0]!.passed,
    false,
  );
  h.erase(selected);
  assert.equal(Object.keys(h.store.read().units).length, 0);
});

test("adapted broad and specific repair questions keep exact citation sets; original expectations stay intact", () => {
  const old = scopeReserve.find((c) => c.id === "h49")!,
    c = scopeRegression.find((c) => c.id === "h49")!;
  assert.deepEqual(old.queries[1]!.labels, ["lock"]);
  const { units } = overlapping(),
    mapping = new Map([
      ["flowers", units[0]!],
      ["lock", units[1]!],
    ]);
  const answer = {
    status: "answered" as const,
    text: "Quieres pegar el florero y arreglar el cerrojo",
    evidence: [0, 1],
    ids: units.map((u) => u.id),
  };
  assert.ok(gradeAnswer(answer, c.queries[1]!, mapping).every((c) => c.passed));
  assert.ok(
    gradeAnswer(answer, c.queries[3]!, mapping).some(
      (c) => c.name === "answer_evidence" && !c.passed && c.critical,
    ),
  );
  assert.ok(
    gradeAnswer(
      { ...answer, ids: [units[1]!.id] },
      c.queries[2]!,
      mapping,
    ).some((c) => c.name === "answer_evidence" && !c.passed),
  );
  assert.ok(
    gradeAnswer(
      { ...answer, ids: [units[1]!.id] },
      c.queries[1]!,
      mapping,
    ).every((c) => c.passed),
  );
  for (const q of [c.queries[0]!, c.after[1]!])
    assert.ok(
      gradeAnswer(answer, q, mapping).some(
        (c) => c.name === "answer_evidence" && !c.passed && c.critical,
      ),
    );
  assert.ok(
    gradeAnswer(
      { ...answer, ids: [units[1]!.id, "unrelated"] },
      c.queries[1]!,
      mapping,
    ).some((c) => c.name === "answer_evidence" && !c.passed && c.critical),
  );
  assert.deepEqual(
    scopeReserve.find((c) => c.id === "h30")!.expectedRelations,
    [],
  );
});
