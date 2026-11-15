import test from "node:test";
import assert from "node:assert/strict";
import { OpenAiMemory } from "../src/openai.ts";
import { unknownTime } from "../src/temporal.ts";
import type { Candidate, Source } from "../src/domain.ts";

test("second-person answer verification preserves first-person canonical evidence and its citations", async () => {
  const source: Source = {
    id: "perspective",
    text: "Quiero jugar a la Play.",
    receivedAt: "2026-11-15T12:00:00Z",
    zone: "Europe/Madrid",
  };
  const candidates: Candidate[] = [
    {
      score: 1,
      memory: {
        id: "perspective-1",
        sourceId: source.id,
        revision: 1,
        text: source.text,
        quote: source.text,
        kind: "intention",
        entities: [],
        time: unknownTime,
        provenance: "personal",
        attribution: null,
        attributionEvidence: null,
        eventStatus: "planned",
        lifecycle: "current",
        receivedAt: source.receivedAt,
        zone: source.zone,
        vector: [1],
      },
    },
  ];
  const before = JSON.stringify({ source, candidates });
  const stages: string[] = [];
  const transport: typeof fetch = async (_url, options) => {
    const body = JSON.parse(String(options?.body));
    const data = JSON.parse(body.input);
    stages.push(body.text.format.name);
    assert.equal(data.candidates[0].text, source.text);
    const verifying = body.text.format.name === "memory_verification";
    if (verifying) {
      assert.equal(data.proposal.answer, "Quieres jugar a la Play.");
      assert.deepEqual(data.selectedEvidenceIds, ["perspective-1"]);
    }
    const result = verifying
      ? {
          supported: true,
          status: "answered",
          problem: "none",
          scope: "memory",
        }
      : {
          status: "answered",
          answer: "Quieres jugar a la Play.",
          evidenceIds: ["perspective-1"],
          scope: "memory",
        };
    return Response.json({
      status: "completed",
      output: [
        {
          type: "message",
          content: [{ type: "output_text", text: JSON.stringify(result) }],
        },
      ],
      usage: { input_tokens: 1, output_tokens: 1 },
    });
  };
  const provider = new OpenAiMemory(
    "sk-synthetic-test-only",
    { reserve: async () => {}, settle: async () => {} },
    transport,
  );
  const answer = await provider.answer(
    "¿Qué quiero hacer?",
    source.receivedAt,
    candidates,
    [source],
  );
  assert.equal(answer.status, "answered");
  assert.equal(answer.answer, "Quieres jugar a la Play.");
  assert.deepEqual(answer.sourceIds, [source.id]);
  assert.equal(JSON.stringify({ source, candidates }), before);
  assert.deepEqual(stages, ["memory_answer", "memory_verification"]);
});
