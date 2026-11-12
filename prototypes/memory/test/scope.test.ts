import test from "node:test";
import assert from "node:assert/strict";
import { constrainAnswer } from "../src/answer-guard.ts";
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
      attributionEvidence: "foro",
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

test("a number in a quoted instruction may be quoted but cannot establish a personal code", () => {
  assert.equal(
    constrainAnswer(proposal, candidates, [], "¿Cuál es mi código postal?")
      ?.status,
    "not_found",
  );
  const quoted = constrainAnswer(
    proposal,
    candidates,
    [],
    "¿Qué decía el texto?",
  );
  assert.equal(quoted?.status, "answered");
  assert.match(quoted!.answer, /contenido citado/u);
});

test("liking a dish cannot establish that it is the favorite without explicit evidence", () => {
  const memories: Candidate[] = candidates.map((entry) => ({
    ...entry,
    memory: {
      ...entry.memory,
      provenance: "personal",
      text: "Me encantó el ramen.",
      quote: "Me encantó el ramen.",
    },
  }));
  const source = {
    id: "note",
    text: "Me encantó el ramen.",
    receivedAt: "2026-11-12T10:00:00Z",
    zone: "Europe/Madrid",
  };
  assert.equal(
    constrainAnswer(
      proposal,
      memories,
      [source],
      "¿Cuál es mi comida favorita?",
    )?.status,
    "not_found",
  );
  assert.equal(
    constrainAnswer(
      proposal,
      memories,
      [{ ...source, text: "El ramen es mi comida favorita." }],
      "¿Cuál es mi comida favorita?",
    ),
    null,
  );
});
