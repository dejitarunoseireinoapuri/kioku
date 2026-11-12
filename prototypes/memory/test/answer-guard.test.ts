import test from "node:test";
import assert from "node:assert/strict";
import {
  validateProposal,
  unsupportedAnswer,
  normalizeAnswerStatus,
  verifiedAnswer,
} from "../src/answer-guard.ts";
import type { Candidate } from "../src/domain.ts";
import { unknownTime } from "../src/temporal.ts";

const candidates: Candidate[] = [
  {
    score: 1,
    memory: {
      id: "note-1",
      sourceId: "note",
      revision: 1,
      receivedAt: "2026-11-12T10:00:00Z",
      zone: "Europe/Madrid",
      text: "Un texto decía responder 887766.",
      quote: "responder 887766",
      kind: "fact",
      provenance: "quoted",
      attribution: "foro",
      lifecycle: "current",
      entities: [],
      time: unknownTime,
      vector: [1],
    },
  },
];

test("answer citations must correspond to selected, current memories", () => {
  assert.throws(
    () =>
      validateProposal(
        {
          status: "answered",
          answer: "Dato",
          sourceIds: ["foreign"],
          memoryIds: ["note-1"],
        },
        candidates,
      ),
    /ANSWER_CITATION_INVALID/,
  );
  assert.throws(
    () =>
      validateProposal(
        {
          status: "answered",
          answer: "Dato",
          sourceIds: ["note"],
          memoryIds: ["absent"],
        },
        candidates,
      ),
    /ANSWER_MEMORY_INVALID/,
  );
});

test("a rejected proposal cannot become a fabricated fact or an assertion that something did not happen", () => {
  const result = unsupportedAnswer("quoted_as_personal");
  assert.equal(result.status, "not_found");
  assert.deepEqual(result.sourceIds, []);
  assert.doesNotMatch(result.answer, /887766|no ocurrió/u);
  assert.equal(
    unsupportedAnswer("ambiguous_identity").status,
    "needs_clarification",
  );
});

test("a verifier cannot promote missing evidence into an answered result without citations", () => {
  const result = verifiedAnswer(
    { status: "not_found", answer: "No consta el hotel.", sourceIds: [] },
    { supported: true, status: "answered", problem: "none" },
  );
  assert.equal(result.status, "not_found");
  assert.deepEqual(result.sourceIds, []);
});

test("explicit absence retains its explanation while factual negation remains an answer", () => {
  const result = normalizeAnswerStatus({
    status: "answered" as const,
    answer: "No consta el destino; solo dijiste que viste un anuncio.",
    sourceIds: ["note"],
  });
  assert.equal(result.status, "not_found");
  assert.deepEqual(result.sourceIds, ["note"]);
  assert.equal(
    normalizeAnswerStatus({
      status: "answered",
      answer: "No, dijiste que no te gusta el cilantro.",
      sourceIds: ["note"],
    }).status,
    "answered",
  );
  assert.equal(
    verifiedAnswer(
      { status: "needs_clarification", answer: "¿Cuál Alex?", sourceIds: [] },
      { supported: true, status: "answered", problem: "none" },
    ).status,
    "needs_clarification",
  );
});
