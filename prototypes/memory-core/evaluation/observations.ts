import {
  indexedInterpretationSchema,
  indexedText,
} from "../ai/indexed-evidence.ts";
import { answerSchema } from "../ai/contracts.ts";
import type { Scenario, GoldUnit } from "./case.ts";
import type { IndexedInterpretation } from "../ai/indexed-evidence.ts";
import { matches } from "./grade.ts";

function compare(unit: IndexedInterpretation["units"][number], gold: GoldUnit) {
  return {
    terms: gold.terms.every((t) => matches(unit.content.text, t)),
    time: Object.entries(gold.time).every(
      ([key, value]) => unit.time[key as keyof typeof gold.time] === value,
    ),
    attribution:
      gold.attribution === null
        ? unit.content.attribution === null
        : matches(unit.content.attribution ?? "", gold.attribution),
    polarity: gold.polarity === unit.content.polarity,
  };
}

/** Closed diagnostics only; generated text, source values and descriptors never escape. */
export function observe(
  stage: string,
  value: unknown,
  fixture: Scenario,
  inputText?: string,
) {
  if (stage === "interpret") {
    const p = indexedInterpretationSchema.parse(value);
    const tokens = inputText === undefined ? [] : indexedText(inputText);
    let start = 0;
    const spans = p.segments.map((s) => {
      const text = tokens
        .slice(start, s.end + 1)
        .map((t) => t.literal)
        .join("");
      start = s.end + 1;
      return { ...s, text };
    });
    return {
      stage,
      status: p.status,
      unitCount: p.units.length,
      kinds: p.units.map((u) => u.content.kind),
      polarities: p.units.map((u) => u.content.polarity),
      existingIndices: p.units.map((u) => u.existing),
      supportMatches:
        inputText === undefined
          ? []
          : p.units.flatMap((u, unitIndex) => {
              const own = spans
                .filter((s) => s.owners.includes(u.key))
                .map((s) => s.text)
                .join(" ");
              return fixture.units.map((gold, goldIndex) => ({
                unitIndex,
                goldIndex,
                normalized: gold.terms.map((t) =>
                  matches(JSON.stringify(u.content), t),
                ),
                evidence: gold.terms.map((t) => matches(own, t)),
              }));
            }),
      relations: p.relations.map((r) => ({
        kind: r.kind,
        from: p.units.findIndex((u) => u.key === r.from),
        to:
          r.toKey === null ? null : p.units.findIndex((u) => u.key === r.toKey),
        existing: r.toExisting,
      })),
      expectedMatches: p.units.flatMap((u, unitIndex) =>
        fixture.units.map((gold, goldIndex) => ({
          unitIndex,
          goldIndex,
          ...compare(u, gold),
        })),
      ),
      timePrecisions: p.units.map((u) => u.time.precision),
      timeMatchesCaptureDay: p.units.map(
        (u) => u.time.value === fixture.at.slice(0, 10),
      ),
      segmentEnds: p.segments.map((s) => s.end),
      segmentRoles: p.segments.map((s) => s.role),
      segmentOwners: p.segments.map((s) =>
        s.owners.map((key) => p.units.findIndex((u) => u.key === key)),
      ),
    };
  }
  if (stage === "answer") {
    const answer = answerSchema.parse(value);
    return {
      stage: "answer_proposed",
      status: answer.status,
      evidenceCount: answer.evidence.length,
    };
  }
  return null;
}
