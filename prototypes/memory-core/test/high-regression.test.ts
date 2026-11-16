import test from "node:test";
import assert from "node:assert/strict";
import { highReserve } from "../evaluation/high.ts";
import { highRegression } from "../evaluation/high-regression.ts";
import { gradeUnits, gradeAnswer } from "../evaluation/grade.ts";
import type { GoldUnit } from "../evaluation/case.ts";
import { harness } from "../fixtures/harness.ts";
import { twoPlans } from "../fixtures/scenarios.ts";

function snapshot(gold: GoldUnit[], texts: string[]) {
  const h = harness();
  h.save(twoPlans());
  const state = h.store.read(),
    units = Object.values(state.units);
  for (const [i, u] of units.entries()) {
    const expected = gold[i]!;
    u.content = {
      ...u.content,
      text: texts[i]!,
      proposition: texts[i]!,
      kind: Array.isArray(expected.kind) ? expected.kind[0]! : expected.kind,
      attribution: expected.attribution,
      condition: null,
      polarity: expected.polarity,
    };
    u.time = structuredClone(expected.time);
    for (const f of Object.values(state.fragments).filter((f) =>
      f.owners.includes(u.id),
    ))
      f.text = texts[i]!;
  }
  return { state, units };
}

test("condition oracle accepts conjugation variants but rejects missing material, qualifier and inverted prerequisite", () => {
  const original = highReserve.find((c) => c.id === "i13")!.units;
  const gold = highRegression.find((c) => c.id === "i13")!.units;
  const { state, units } = snapshot(gold, [
    "Si encuentro lino sin teñir, coseré una funda para el atlas.",
    "Quiero limpiar el telescopio.",
  ]);
  units[0]!.content.condition = "Encontrar lino sin teñir";
  assert.ok(
    gradeUnits(state, original).checks.some(
      (c) => c.name === "cover:condition" && !c.passed,
    ),
  );
  for (const condition of [
    "Encontrar lino sin teñir",
    "Si encuentro lino sin teñir",
    "Si encuentro lino no teñido",
  ]) {
    units[0]!.content.condition = condition;
    assert.ok(gradeUnits(state, gold).checks.every((c) => c.passed));
  }
  for (const condition of [
    null,
    "Encontrar lino",
    "Encontrar lino teñido",
    "Encontrar algodón sin teñir",
    "No encontrar lino sin teñir",
  ]) {
    units[0]!.content.condition = condition;
    assert.ok(
      gradeUnits(state, gold).checks.some(
        (c) => c.name === "cover:condition" && !c.passed && c.critical,
      ),
    );
  }
  assert.equal(original[0]!.condition, "encuentr.*lino");
});

test("shared reservation stems do not imply foreign facts; date, modality and foreign text remain mandatory", () => {
  const original = highReserve.find((c) => c.id === "i39")!.units;
  const gold = highRegression.find((c) => c.id === "i39")!.units;
  const { state, units } = snapshot(gold, [
    "Reservé una mesa en La Alondra para el 3 de agosto de 2026.",
    "Quiero reservar en La Alondra para el 10 de agosto de 2026.",
  ]);
  assert.deepEqual(
    gradeUnits(state, original)
      .checks.filter((c) => !c.passed)
      .map((c) => c.name),
    ["plan:no_foreign_fact", "plan:no_foreign_content"],
  );
  assert.ok(gradeUnits(state, gold).checks.every((c) => c.passed));
  for (const change of [
    "kind",
    "time",
    "missingDate",
    "foreignEvidence",
    "foreignContent",
  ]) {
    const bad = structuredClone(state),
      u = bad.units[units[1]!.id]!;
    if (change === "kind") u.content.kind = "fact";
    else if (change === "time") u.time.value = "2026-08-03";
    else if (change === "foreignContent")
      u.content.proposition += " 3 de agosto";
    else
      for (const f of Object.values(bad.fragments).filter((f) =>
        f.owners.includes(u.id),
      ))
        f.text =
          change === "missingDate"
            ? "Quiero reservar en La Alondra"
            : `${f.text} 3 de agosto`;
    assert.ok(
      gradeUnits(bad, gold).checks.some((c) => !c.passed),
      change,
    );
  }
  assert.deepEqual(original[1]!.terms, ["reservar", "alondra"]);
});

test("specific learning query rejects neighboring citations, inclusive query requires both, and forgotten subject stays absent", () => {
  const c = highRegression.find((c) => c.id === "i08")!;
  const { units } = snapshot(c.units, [
    "Malena quiere estudiar oceanografía",
    "Malena quiere aprender a tejer con telar",
  ]);
  const mapping = new Map(c.units.map((g, i) => [g.label, units[i]!]));
  const both = {
    status: "answered" as const,
    text: "Malena quiere estudiar oceanografía y aprender a tejer con telar.",
    evidence: [0, 1],
    ids: units.map((u) => u.id),
  };
  assert.ok(gradeAnswer(both, c.queries[2]!, mapping).every((c) => c.passed));
  assert.ok(gradeAnswer(both, c.queries[3]!, mapping).every((c) => c.passed));
  assert.ok(
    gradeAnswer(both, c.queries[0]!, mapping).some(
      (c) => !c.passed && c.critical,
    ),
  );
  assert.ok(
    gradeAnswer({ ...both, ids: [units[0]!.id] }, c.queries[3]!, mapping).some(
      (c) => !c.passed,
    ),
  );
  assert.ok(
    gradeAnswer(both, c.after[0]!, mapping).some(
      (c) => !c.passed && c.critical,
    ),
  );
  const remaining = {
    ...both,
    text: "Malena quiere aprender a tejer con telar.",
    evidence: [1],
    ids: [units[1]!.id],
  };
  assert.ok(
    gradeAnswer(remaining, c.after[2]!, mapping).every((c) => c.passed),
  );
  assert.ok(
    gradeAnswer(remaining, c.after[0]!, mapping).some(
      (c) => !c.passed && c.critical,
    ),
  );
  assert.equal(highReserve.find((c) => c.id === "i08")!.queries.length, 2);
});

test("positive quantity correction excludes the obsolete contrast negator from canonical fields and retained evidence", () => {
  const c = highRegression.find((c) => c.id === "i43")!;
  const gold = [c.correction!.expected, c.units[1]!];
  const { state, units } = snapshot(gold, [
    "He guardado 23 tuercas en la caja celeste.",
    "El alicate está en el cinturón de herramientas.",
  ]);
  assert.ok(gradeUnits(state, gold).checks.every((c) => c.passed));
  for (const field of ["text", "proposition", "evidence"] as const) {
    const bad = structuredClone(state),
      u = bad.units[units[0]!.id]!;
    if (field === "evidence")
      Object.values(bad.fragments).find((f) => f.owners.includes(u.id))!.text +=
        " no";
    else u.content[field] += " no";
    assert.ok(
      gradeUnits(bad, gold).checks.some((c) => !c.passed && c.critical),
    );
  }
  assert.deepEqual(
    highReserve.find((c) => c.id === "i43")!.correction!.expected.forbidden,
    ["18"],
  );
});
