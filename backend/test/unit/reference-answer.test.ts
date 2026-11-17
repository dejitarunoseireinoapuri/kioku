import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import type { StructuredModel } from "#memory-v2/ai/contracts";
import { answerReferences } from "../../src/references/answer.js";
import type { ReferenceSource } from "../../src/references/store.js";

const source = (): ReferenceSource => ({
  id: randomUUID(),
  revision: randomUUID(),
  generation: randomUUID(),
  title: "Manual ficticio",
  importedAt: 1,
  checksum: "a".repeat(64),
  document: {
    format: "text",
    extractorVersion: 1,
    coverage: "text",
    chunks: [
      {
        index: 0,
        text: "Lira usa un cuaderno violeta.",
        locator: { kind: "line", number: 1 },
      },
    ],
  },
});
const model = (
  replies: Record<string, unknown>,
  stages: string[] = [],
): StructuredModel => ({
  async call(stage, _instructions, _data, schema) {
    stages.push(stage);
    return schema.parse(replies[stage]);
  },
});
const accepted = {
  reference_answer: {
    status: "answered",
    text: "Según el manual ficticio, Lira usa un cuaderno violeta.",
    evidence: [0],
  },
  reference_review: { accepted: true },
};

test("small documents use complete extracted evidence and return only server-selected citations", async () => {
  const input = source(),
    stages: string[] = [];
  const result = await answerReferences(
    model(accepted, stages),
    [input],
    "¿Qué usa Lira?",
    undefined,
    async () => {},
  );
  assert.deepEqual(stages, ["reference_answer", "reference_review"]);
  assert.equal(result.citations[0]?.sourceId, input.id);
  assert.equal(result.citations[0]?.text, input.document.chunks[0]?.text);
});

test("invented, repeated and missing evidence cannot be returned as an answer", async () => {
  for (const evidence of [[7], [0, 0], []]) {
    await assert.rejects(
      answerReferences(
        model({
          ...accepted,
          reference_answer: { ...accepted.reference_answer, evidence },
        }),
        [source()],
        "Pregunta ficticia",
        undefined,
        async () => {},
      ),
    );
  }
});

test("a rejected independent review or a revoked epoch prevents an answer", async () => {
  await assert.rejects(
    answerReferences(
      model({ ...accepted, reference_review: { accepted: false } }),
      [source()],
      "Pregunta ficticia",
      undefined,
      async () => {},
    ),
  );
  let checks = 0;
  await assert.rejects(
    answerReferences(
      model(accepted),
      [source()],
      "Pregunta ficticia",
      undefined,
      async () => {
        if (++checks === 2) throw new Error("synthetic revoked epoch");
      },
    ),
  );
});

test("general retrieval does not use partial documents", async () => {
  const partial = source();
  partial.document.coverage = "partial";
  const stages: string[] = [];
  const result = await answerReferences(
    model({}, stages),
    [partial],
    "Pregunta ficticia",
    undefined,
    async () => {},
  );
  assert.equal(result.status, "notFound");
  assert.deepEqual(stages, []);
});
