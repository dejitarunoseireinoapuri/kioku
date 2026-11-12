import type { Answer, Extraction, Candidate } from "../domain.ts";
import type { QuerySpec, Scenario } from "./corpus.ts";

export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export function legacyExtractionScore(
  scenario: Scenario,
  initial: Extraction,
  final: Extraction,
): boolean {
  if (initial.status !== scenario.status) return false;
  if (scenario.status === "ignored") return final.items.length === 0;
  if (final.status !== "saved") return false;
  return scenario.items.every((expected) =>
    final.items.some(
      (actual) =>
        actual.kind === expected.kind &&
        (actual.time.precision === "day" ? actual.time.value : null) ===
          expected.date &&
        expected.terms.every((term) =>
          normalize(actual.text).includes(normalize(term)),
        ),
    ),
  );
}

/** Score completeness per source, allowing faithful splits without merging different people's sources. */
export function scoreExtraction(
  scenario: Scenario,
  initial: Extraction,
  final: Extraction,
): boolean {
  if (initial.status !== scenario.status) return false;
  if (scenario.status === "ignored") return final.items.length === 0;
  if (final.status !== "saved") return false;
  const coverage = final.items.map((item) =>
    normalize(
      `${item.text} ${item.entities.join(" ")} ${item.attribution ?? ""}`,
    ),
  );
  const together = coverage.join(" ");
  return scenario.items.every((expected) => {
    if (expected.facets) {
      const facets = expected.facets;
      return final.items.some((actual) => {
        const text = normalize(
          `${actual.text} ${actual.entities.join(" ")} ${actual.provenance === "quoted" ? actual.quote : ""}`,
        );
        return (
          expected.terms.every((term) => text.includes(normalize(term))) &&
          facets.kinds.includes(actual.kind) &&
          actual.provenance === facets.provenance &&
          (Array.isArray(facets.attribution)
            ? facets.attribution.includes(actual.attribution ?? "")
            : actual.attribution === facets.attribution) &&
          facets.eventStatuses.includes(actual.eventStatus) &&
          actual.time.precision === facets.time.precision &&
          actual.time.value === facets.time.value &&
          actual.time.end === facets.time.end
        );
      });
    }
    const terms = expected.terms.map(normalize);
    if (!terms.every((term) => together.includes(term))) return false;
    if (
      terms.includes("no") &&
      !coverage.some((text) => terms.every((term) => text.includes(term)))
    )
      return false;
    const compatible = final.items.filter(
      (actual) =>
        actual.kind === expected.kind ||
        (["thought", "intention"].includes(actual.kind) &&
          ["thought", "intention"].includes(expected.kind)) ||
        (expected.kind === "fact" &&
          actual.kind === "intention" &&
          /\b(sera|viajara|ira)\b/u.test(normalize(scenario.turn.text))) ||
        (expected.kind === "fact" &&
          actual.kind === "thought" &&
          /me sentí/iu.test(scenario.turn.text)),
    );
    if (!compatible.length) return false;
    return (
      expected.date === null ||
      compatible.some(
        (actual) =>
          actual.time.precision === "day" &&
          actual.time.value === expected.date &&
          expected.terms.some((term) =>
            normalize(actual.text).includes(normalize(term)),
          ),
      )
    );
  });
}

export function scoreQuery(
  expected: QuerySpec,
  answer: Answer,
  candidates: Candidate[],
) {
  const retrieved = new Set(candidates.map(({ memory }) => memory.sourceId));
  const cited = new Set(answer.sourceIds);
  const text = normalize(answer.answer);
  const citationGroups =
    expected.citationGroups ?? expected.sources.map((id) => [id]);
  const sourceMatch = citationGroups.every((group) =>
    group.some((id) => cited.has(id)),
  );
  const termsMatch = expected.groups.every((group) =>
    group.some((term) => text.includes(normalize(term))),
  );
  const forbiddenMatch = (expected.forbidden ?? []).some((term) =>
    text.includes(normalize(term)),
  );
  const statusMatches =
    answer.status === expected.status ||
    (expected.allowAbstention === true && answer.status === "not_found");
  const semanticForm =
    expected.status === "needs_clarification"
      ? /[?¿]/u.test(answer.answer)
      : termsMatch;
  const answered =
    statusMatches && sourceMatch && semanticForm && !forbiddenMatch;
  return {
    retrieval: expected.sources.length
      ? expected.sources.every((id) => retrieved.has(id))
      : null,
    answer: answered,
    criticalFailure: expected.critical === true && !answered,
    candidateCount: candidates.length,
    relevantCount: candidates.filter(({ memory }) =>
      expected.sources.includes(memory.sourceId),
    ).length,
  };
}

export type Observation = {
  id: string;
  category: string;
  extraction?: boolean;
  retrieval?: boolean | null;
  answer?: boolean;
  criticalFailure?: boolean;
  blocked?: boolean;
  latencyMs: number;
};

function metric(
  rows: Observation[],
  field: "extraction" | "retrieval" | "answer",
): number | null {
  const applicable = rows
    .map((row) => row[field])
    .filter((value) => typeof value === "boolean");
  return applicable.length
    ? applicable.filter(Boolean).length / applicable.length
    : null;
}

export function summarize(rows: Observation[]) {
  const categories = [...new Set(rows.map((row) => row.category))];
  const groups = Object.fromEntries(
    ["total", ...categories].map((category) => {
      const subset =
        category === "total"
          ? rows
          : rows.filter((row) => row.category === category);
      return [
        category,
        {
          extraction: metric(subset, "extraction"),
          retrieval: metric(subset, "retrieval"),
          answer: metric(subset, "answer"),
        },
      ];
    }),
  );
  const criticalFailures = rows
    .filter((row) => row.criticalFailure)
    .map((row) => row.id);
  const blockedChecks = rows.filter((row) => row.blocked).map((row) => row.id);
  const latencies = rows.map((row) => row.latencyMs).sort((a, b) => a - b);
  const latencyP95Ms =
    latencies[Math.max(0, Math.ceil(latencies.length * 0.95) - 1)] ?? null;
  const provisionalPass =
    criticalFailures.length === 0 &&
    blockedChecks.length === 0 &&
    Object.values(groups).every((group) =>
      Object.values(group).every((value) => value === null || value >= 0.9),
    );
  return {
    groups,
    criticalFailures,
    blockedChecks,
    latencyP95Ms,
    provisionalPass,
    reviewedPass: false,
    reviewRequired:
      "Independent review of fidelity/entailment and a completed three-run validation are mandatory.",
  };
}
