import test from "node:test";
import assert from "node:assert/strict";
import { corpus } from "../src/evaluation/corpus.ts";
import { scoreQuery, summarize } from "../src/evaluation/score.ts";
import type { QuerySpec } from "../src/evaluation/corpus.ts";

test("validation corpus has 30+ interventions, 60+ queries, unique IDs and no tuning sources", () => {
  const validation = corpus.filter((entry) => entry.partition === "validation");
  assert.ok(validation.length >= 30);
  assert.ok(validation.flatMap((entry) => entry.queries).length >= 60);
  assert.equal(
    new Set(corpus.map((entry) => entry.turn.id)).size,
    corpus.length,
  );
  for (const entry of corpus) {
    const ownIds = new Set(
      corpus
        .filter((other) => other.partition === entry.partition)
        .map((other) => other.turn.id),
    );
    for (const query of entry.queries)
      assert.ok(query.sources.every((id) => ownIds.has(id)));
    if (entry.status === "needs_clarification") assert.ok(entry.clarification);
    if (entry.withdraw)
      assert.ok(entry.queries.every((query) => query.status === "not_found"));
  }
  assert.ok(new Set(validation.map((entry) => entry.category)).size >= 10);
});

test("absent information answered with an invented fact is a blocking failure", () => {
  const expected: QuerySpec = {
    question: "Synthetic",
    status: "not_found",
    sources: [],
    groups: [],
    critical: true,
  };
  const score = scoreQuery(
    expected,
    { status: "answered", answer: "Sí, ocurrió.", sourceIds: [] },
    [],
  );
  assert.equal(score.criticalFailure, true);
});

test("a weak category blocks advancement despite a strong overall average", () => {
  const rows = Array.from({ length: 20 }, (_, index) => ({
    id: `ok-${index}`,
    category: "basic",
    answer: true,
    extraction: true,
    retrieval: true,
    latencyMs: 1,
  }));
  rows.push({
    id: "ambiguous",
    category: "ambiguity",
    answer: false,
    extraction: true,
    retrieval: true,
    latencyMs: 1,
  });
  const summary = summarize(rows);
  assert.ok(summary.groups.total!.answer! > 0.9);
  assert.equal(summary.provisionalPass, false);
  assert.equal(summary.reviewedPass, false);
});

test("a perfect automatic score alone never closes M0", () => {
  const summary = summarize([
    {
      id: "a",
      category: "basic",
      answer: true,
      extraction: true,
      retrieval: true,
      latencyMs: 1,
    },
  ]);
  assert.equal(summary.provisionalPass, true);
  assert.equal(summary.reviewedPass, false);
});

test("an untested withdrawal blocks the automatic gate even when other scores pass", () => {
  const summary = summarize([
    {
      id: "ok",
      category: "basic",
      answer: true,
      extraction: true,
      retrieval: true,
      latencyMs: 1,
    },
    {
      id: "missing-withdrawal",
      category: "withdrawal",
      blocked: true,
      latencyMs: 0,
    },
  ]);
  assert.equal(summary.provisionalPass, false);
  assert.deepEqual(summary.blockedChecks, ["missing-withdrawal"]);
});

test("a grounded abstention about an uncompleted plan is not a factual error", () => {
  const query: QuerySpec = {
    question: "Synthetic",
    status: "answered",
    allowAbstention: true,
    sources: ["plan"],
    groups: [["no consta"], ["intencion"]],
    critical: true,
  };
  const score = scoreQuery(
    query,
    {
      status: "not_found",
      answer: "No consta; solo la intención.",
      sourceIds: ["plan"],
    },
    [],
  );
  assert.equal(score.answer, true);
  assert.equal(score.criticalFailure, false);
  assert.equal(score.retrieval, false);
});
