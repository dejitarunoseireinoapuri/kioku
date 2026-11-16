import type { Unit, Snapshot } from "../src/model.ts";
import type { GoldUnit, GoldQuery } from "./case.ts";
import type { Answer } from "../ai/contracts.ts";
export const normalize = (value: string) =>
  value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
export const matches = (text: string, pattern: string) =>
  new RegExp(pattern, "u").test(normalize(text));
export interface Check {
  name: string;
  passed: boolean;
  critical: boolean;
}
export function gradeUnits(state: Snapshot, gold: GoldUnit[]) {
  const units = Object.values(state.units);
  const checks: Check[] = [
    {
      name: "unit_count",
      passed: units.length === gold.length,
      critical: units.length > gold.length,
    },
  ];
  const mapping = new Map<string, Unit>();
  for (const expected of gold) {
    const lexical = units.filter((u) =>
      expected.terms.every((t) => matches(u.content.text, t)),
    );
    const kinds = Array.isArray(expected.kind)
      ? expected.kind
      : [expected.kind];
    const exact = lexical.filter(
      (u) =>
        kinds.includes(u.content.kind) &&
        JSON.stringify(u.time) === JSON.stringify(expected.time),
    );
    const hits = exact.length === 1 ? exact : lexical;
    checks.push({
      name: `${expected.label}:meaning`,
      passed: hits.length === 1,
      critical: false,
    });
    if (hits.length !== 1) continue;
    const u = hits[0]!;
    mapping.set(expected.label, u);
    const ownEvidence = Object.values(state.fragments)
      .filter((f) => f.owners.includes(u.id))
      .map((f) => f.text)
      .join(" ");
    const foreignFact = gold
      .filter((other) => other.label !== expected.label)
      .some((other) => {
        const distinctive = other.terms.filter(
          (t) => !expected.terms.includes(t),
        );
        return (
          distinctive.length > 0 &&
          distinctive.every((t) => matches(ownEvidence, t))
        );
      });
    for (const [name, passed] of Object.entries({
      kind: kinds.includes(u.content.kind),
      time: JSON.stringify(u.time) === JSON.stringify(expected.time),
      condition:
        expected.condition === null
          ? u.content.condition === null
          : matches(u.content.condition ?? "", expected.condition),
      attribution:
        expected.attribution === null
          ? u.content.attribution === null
          : matches(u.content.attribution ?? "", expected.attribution),
      polarity: u.content.polarity === expected.polarity,
      no_old_content: !(expected.forbidden ?? []).some((t) =>
        matches(JSON.stringify(u.content), t),
      ),
      literal_details: expected.terms.every((t) => matches(ownEvidence, t)),
      no_foreign_fact: !foreignFact,
    }))
      checks.push({
        name: `${expected.label}:${name}`,
        passed,
        critical: [
          "kind",
          "condition",
          "attribution",
          "polarity",
          "no_old_content",
          "no_foreign_fact",
        ].includes(name),
      });
  }
  checks.push({
    name: "one_to_one",
    passed:
      new Set([...mapping.values()].map((u) => u.id)).size === mapping.size,
    critical: true,
  });
  return { checks, mapping };
}
export function gradeAnswer(
  answer: Answer & { ids: string[] },
  expected: GoldQuery,
  mapping: Map<string, Unit>,
): Check[] {
  const desired = expected.labels.map((label) => mapping.get(label)?.id).sort();
  const actual = [...answer.ids].sort();
  const context = (expected.contextLabels ?? []).flatMap(
    (label) => mapping.get(label)?.id ?? [],
  );
  const allowed = [...desired, ...context];
  return [
    {
      name: "answer_status",
      passed:
        answer.status ===
        (expected.status ??
          (expected.labels.length ? "answered" : "not_found")),
      critical: false,
    },
    {
      name: "answer_evidence",
      passed:
        desired.every((id) => actual.includes(id ?? "")) &&
        actual.every((id) => allowed.includes(id)),
      critical: actual.some((id) => !allowed.includes(id)),
    },
    {
      name: "answer_details",
      passed: expected.terms.every((t) => matches(answer.text, t)),
      critical: false,
    },
    {
      name: "answer_not_invented",
      passed: !(expected.forbidden ?? []).some((t) => matches(answer.text, t)),
      critical: true,
    },
    {
      name: "answer_perspective",
      passed: !/\b(quiero|prefiero|he comprado|me gusta)\b/u.test(
        normalize(answer.text),
      ),
      critical: false,
    },
  ];
}
