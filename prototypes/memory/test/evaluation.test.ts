import test from "node:test";
import assert from "node:assert/strict";
import { corpus } from "../src/evaluation/corpus.ts";
import {
  scoreQuery,
  scoreExtraction,
  legacyExtractionScore,
  summarize,
} from "../src/evaluation/score.ts";
import { scenario, item } from "../src/evaluation/fixture.ts";
import type { Extraction } from "../src/domain.ts";
import { unknownTime } from "../src/temporal.ts";
import { attempt } from "../src/evaluation/attempt.ts";
import { MemoryError } from "../src/domain.ts";
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

test("faithful fragments retain source-level coverage while the old strict score remains visible", () => {
  const fixture = scenario(
    "unit",
    "mixed",
    "Mi bicicleta se llamaba Alba y era violeta.",
    [item(["bicicleta", "Alba", "violeta"])],
    [],
  );
  const extracted: Extraction = {
    status: "saved",
    clarification: null,
    items: [
      {
        text: "La bicicleta se llamaba Alba.",
        quote: "Mi bicicleta se llamaba Alba",
        kind: "fact",
        entities: [],
        time: unknownTime,
        provenance: "personal",
        attribution: null,
        attributionEvidence: null,
        eventStatus: "unspecified",
        lifecycle: "historical",
      },
      {
        text: "La bicicleta era violeta.",
        quote: "era violeta",
        kind: "fact",
        entities: [],
        time: unknownTime,
        provenance: "personal",
        attribution: null,
        attributionEvidence: null,
        eventStatus: "unspecified",
        lifecycle: "historical",
      },
    ],
  };
  assert.equal(legacyExtractionScore(fixture, extracted, extracted), false);
  assert.equal(scoreExtraction(fixture, extracted, extracted), true);
  assert.equal(
    scoreExtraction(fixture, extracted, {
      ...extracted,
      items: extracted.items.slice(0, 1),
    }),
    false,
  );
});

test("an unrelated negation cannot satisfy a negative fact about a different subject", () => {
  const fixture = scenario(
    "unit",
    "basic",
    "No me gusta el cilantro; sí la albahaca.",
    [item(["no", "cilantro"], "opinion")],
    [],
  );
  const extracted: Extraction = {
    status: "saved",
    clarification: null,
    items: [
      {
        text: "Me gusta el cilantro.",
        quote: "cilantro",
        kind: "opinion",
        entities: [],
        time: unknownTime,
        provenance: "personal",
        attribution: null,
        attributionEvidence: null,
        eventStatus: "unspecified",
        lifecycle: "current",
      },
      {
        text: "No me gusta la albahaca.",
        quote: "albahaca",
        kind: "opinion",
        entities: [],
        time: unknownTime,
        provenance: "personal",
        attribution: null,
        attributionEvidence: null,
        eventStatus: "unspecified",
        lifecycle: "current",
      },
    ],
  };
  assert.equal(scoreExtraction(fixture, extracted, extracted), false);
});

test("new reserved corpus is disjoint from the promoted regression corpus", () => {
  const reserved = corpus.filter((entry) => entry.partition === "validation");
  const old = corpus.filter((entry) => entry.partition === "regression");
  assert.equal(reserved.length, 32);
  assert.equal(old.length, 32);
  assert.ok(
    reserved.every(
      (entry) => !old.some((prior) => prior.turn.text === entry.turn.text),
    ),
  );
  const v2 = corpus.filter((entry) => entry.partition === "regression-v2");
  assert.equal(v2.length, 32);
  assert.ok(
    reserved.every(
      (entry) => !v2.some((prior) => prior.turn.text === entry.turn.text),
    ),
  );
  assert.ok(
    reserved.every((entry) =>
      entry.items.every((item) => item.facets !== undefined),
    ),
  );
});

test("domain rejection is recorded while authentication, network and budget failures stop evaluation", async () => {
  assert.deepEqual(
    await attempt(async () => {
      throw new MemoryError("TIME_UNSUPPORTED_PRECISION");
    }),
    {
      ok: false,
      code: "TIME_UNSUPPORTED_PRECISION",
    },
  );
  for (const code of [
    "OPENAI_HTTP_401",
    "OPENAI_HTTP_429",
    "BUDGET_EXHAUSTED",
    "OPENAI_NETWORK_OR_RESPONSE",
  ]) {
    await assert.rejects(
      attempt(async () => {
        throw new MemoryError(code);
      }),
      { message: code },
    );
  }
});
