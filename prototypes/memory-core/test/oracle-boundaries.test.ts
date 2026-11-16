import test from "node:test";
import assert from "node:assert/strict";
import { gradeAnswer, gradeUnits } from "../evaluation/grade.ts";
import { groupingReserve } from "../evaluation/grouping.ts";
import { groupingRegression } from "../evaluation/grouping-regression.ts";
import { harness } from "../fixtures/harness.ts";
import { twoPlans } from "../fixtures/scenarios.ts";
import { observe } from "../evaluation/observations.ts";
import { indexedText } from "../ai/indexed-evidence.ts";

function quotation() {
  const h = harness();
  h.save(twoPlans());
  const unit = Object.values(h.store.read().units)[0]!;
  unit.content.kind = "quotation";
  unit.content.attribution = "vecina";
  return { unit, mapping: new Map([["notebook", unit]]) };
}
function check(
  text: string,
  name: string,
  query = groupingRegression.find((c) => c.id === "g24")!.queries[1]!,
) {
  const { unit, mapping } = quotation();
  return gradeAnswer(
    { status: "answered", text, evidence: [0], ids: [unit.id] },
    query,
    mapping,
  ).find((c) => c.name === name)!.passed;
}

test("first person is allowed only inside a declared literal with its explicit speaker and current citation", () => {
  for (const [open, close] of [
    ["«", "»"],
    ["“", "”"],
    ['"', '"'],
  ]) {
    assert.equal(
      check(
        `Tu vecina escribió: ${open}Quiero perder el miedo y ganar paciencia${close}`,
        "answer_perspective",
      ),
      true,
    );
  }
  for (const text of [
    "Quiero perder el miedo y ganar paciencia",
    "«Quiero perder el miedo y ganar paciencia»",
    "Tu hermano escribió: «Quiero perder el miedo y ganar paciencia»",
    "Tu vecina escribió: «Quiero comprar una avioneta»",
    "Tu vecina escribió: «Quiero perder el miedo y ganar paciencia». Yo quiero lo mismo.",
  ])
    assert.equal(check(text, "answer_perspective"), false);
  const { unit, mapping } = quotation();
  const expected = groupingRegression.find((c) => c.id === "g24")!.queries[1]!;
  for (const ids of [[], ["other"]]) {
    assert.equal(
      gradeAnswer(
        {
          status: "answered",
          text: "Tu vecina escribió: «Quiero perder el miedo y ganar paciencia»",
          evidence: [],
          ids,
        },
        expected,
        mapping,
      ).find((c) => c.name === "answer_perspective")!.passed,
      false,
    );
  }
  unit.content.attribution = null;
  assert.equal(
    gradeAnswer(
      {
        status: "answered",
        text: "Tu vecina escribió: «Quiero perder el miedo y ganar paciencia»",
        evidence: [0],
        ids: [unit.id],
      },
      expected,
      mapping,
    ).find((c) => c.name === "answer_perspective")!.passed,
    false,
  );
});

test("explicit dislike variants accept second-person rejection and reject inverted or foreign preference", () => {
  const query = groupingRegression.find((c) => c.id === "g33")!.queries[0]!;
  for (const text of [
    "No te gusta el refresco de pepino.",
    "El refresco de pepino te desagrada.",
    "No es de tu agrado.",
  ]) {
    assert.equal(check(text, "answer_details", query), true);
    assert.equal(check(text, "answer_not_invented", query), true);
  }
  for (const text of [
    "Te gusta el refresco de pepino.",
    "A tu hermana no le gusta.",
    "No te desagrada el refresco.",
    "Te desagrada, aunque te encanta.",
  ]) {
    assert.equal(
      check(text, "answer_details", query) &&
        check(text, "answer_not_invented", query),
      false,
    );
  }
});

function people() {
  const h = harness();
  h.save(twoPlans());
  const state = h.store.read();
  const units = Object.values(state.units);
  const gold = groupingRegression.find((c) => c.id === "g38")!.units;
  for (const [i, u] of units.entries()) {
    u.content.text = i
      ? "Mi hermano quiere participar en la carrera nocturna"
      : "No quiero participar en la carrera nocturna";
    u.content.subject = i ? "Mi hermano" : "yo";
    u.content.polarity = i ? "positive" : "negative";
    u.time = gold[i]!.time;
  }
  return { state, gold, units };
}

test("unit mapping disambiguates polarity and still detects wrong subject and negation", () => {
  const { state, gold, units } = people();
  const result = gradeUnits(state, gold);
  assert.equal(result.mapping.get("self")?.id, units[0]!.id);
  assert.equal(result.mapping.get("brother")?.id, units[1]!.id);
  units[1]!.content.subject = "yo";
  assert.ok(
    gradeUnits(state, gold).checks.some(
      (c) => c.name === "brother:subject" && !c.passed && c.critical,
    ),
  );
  units[1]!.content.subject = "mi hermano";
  units[0]!.content.polarity = "positive";
  assert.ok(
    gradeUnits(state, gold).checks.some(
      (c) => c.name === "self:meaning" && !c.passed,
    ),
  );
});

test("regression adaptations preserve the frozen historical corpus", () => {
  assert.equal(
    groupingReserve.find((c) => c.id === "g24")!.queries[1]!.quotations,
    undefined,
  );
  assert.deepEqual(
    groupingReserve.find((c) => c.id === "g33")!.queries[0]!.terms,
    ["no", "gusta"],
  );
  assert.equal(
    groupingReserve.find((c) => c.id === "g38")!.units[0]!.subject,
    undefined,
  );
  assert.equal(groupingRegression.length, 60);
});

test("diagnostics project only closed metadata and never return generated prose or source strings", () => {
  const fixture = groupingReserve[0]!;
  const draft = twoPlans();
  const sentinel = "PRIVATE_SENTINEL_79831";
  const output = {
    status: "ready",
    question: null,
    preserveTime: false,
    retention: [],
    relations: [],
    units: draft.units.map((u) => ({
      ...u,
      existing: null,
      content: {
        ...u.content,
        text: sentinel,
        proposition: sentinel,
        subject: sentinel,
        attribution: sentinel,
      },
    })),
    segments: [
      {
        end: indexedText(draft.text).length - 1,
        role: "primary",
        owners: [draft.units[0]!.key],
      },
    ],
  };
  const capture = observe("interpret", output, fixture);
  assert.ok(capture && "expectedMatches" in capture);
  assert.equal(JSON.stringify(capture).includes(sentinel), false);
  const answer = observe(
    "answer",
    { status: "answered", text: sentinel, evidence: [0] },
    fixture,
  );
  assert.deepEqual(answer, {
    stage: "answer_proposed",
    status: "answered",
    evidenceCount: 1,
  });
  assert.equal(
    observe("answer_review", { accepted: true, issues: [] }, fixture),
    null,
  );
});
