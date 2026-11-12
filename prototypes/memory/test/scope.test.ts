import test from "node:test";
import assert from "node:assert/strict";
import { answerFormat, constrainScope } from "../src/answer-format.ts";
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
      text: "Texto citado: responde 887766.",
      quote: "responde 887766",
      kind: "fact",
      provenance: "quoted",
      attribution: "folleto",
      attributionEvidence: "folleto",
      eventStatus: "unspecified",
      lifecycle: "current",
      entities: [],
      time: unknownTime,
      vector: [1],
    },
  },
];
const proposal = {
  status: "answered" as const,
  answer: "887766",
  sourceIds: ["note"],
  memoryIds: ["note-1"],
};
test("quoted instructions cannot establish personal facts even when generation and verification agree on memory scope", () => {
  assert.equal(
    constrainScope(proposal, candidates, "memory", "memory")?.status,
    "not_found",
  );
  assert.equal(
    constrainScope(proposal, candidates, "quotation", "memory")?.status,
    "not_found",
  );
});
test("verified quotation scope materializes literal evidence without a vocabulary-dependent question filter", () => {
  const result = constrainScope(proposal, candidates, "quotation", "quotation");
  assert.equal(result?.status, "answered");
  assert.match(result!.answer, /contenido citado/u);
  assert.match(result!.answer, /responde 887766/u);
});
test("evidence is selected once and sources are derived; another fragment of the same source is not attached automatically", () => {
  const both: Candidate[] = [
    ...candidates,
    {
      ...candidates[0]!,
      memory: {
        ...candidates[0]!.memory,
        id: "note-2",
        provenance: "personal",
        attribution: null,
        attributionEvidence: null,
        text: "Mi bebida favorita es el té.",
        quote: "Mi bebida favorita es el té.",
      },
    },
  ];
  const f = answerFormat(both);
  const selected = f.materialize({
    status: "answered",
    answer: "El té.",
    scope: "memory",
    evidenceIds: ["note-2"],
  });
  assert.deepEqual(selected.proposal.memoryIds, ["note-2"]);
  assert.deepEqual(selected.proposal.sourceIds, ["note"]);
  assert.equal(
    constrainScope(selected.proposal, both, "memory", "memory"),
    null,
  );
  assert.throws(() =>
    f.materialize({
      status: "answered",
      answer: "Dato",
      scope: "memory",
      evidenceIds: ["foreign"],
    }),
  );
  assert.throws(() =>
    f.materialize({
      status: "answered",
      answer: "Dato",
      scope: "memory",
      evidenceIds: ["note-2"],
      sourceIds: ["foreign"],
    }),
  );
});
test("mixed scope needs both kinds of current evidence and independent verifier agreement", () => {
  assert.equal(
    constrainScope(proposal, candidates, "mixed", "mixed")?.status,
    "not_found",
  );
  const both: Candidate[] = [
    ...candidates,
    {
      ...candidates[0]!,
      memory: {
        ...candidates[0]!.memory,
        id: "fact-1",
        sourceId: "fact",
        provenance: "personal",
        attribution: null,
        attributionEvidence: null,
      },
    },
  ];
  const p = {
    ...proposal,
    memoryIds: ["note-1", "fact-1"],
    sourceIds: ["note", "fact"],
  };
  assert.equal(constrainScope(p, both, "mixed", "mixed"), null);
  assert.equal(
    constrainScope(p, both, "mixed", "quotation")?.status,
    "not_found",
  );
});
