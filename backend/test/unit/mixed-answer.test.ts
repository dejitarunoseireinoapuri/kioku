import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import type { StructuredModel } from "#memory-v2/ai/contracts";
import { answerKnowledge } from "../../src/references/mixed-answer.js";
import type { ReferenceSource } from "../../src/references/store.js";

const source = (): ReferenceSource => ({
  id: randomUUID(),
  revision: randomUUID(),
  generation: randomUUID(),
  title: "Manual ficticio",
  checksum: "a".repeat(64),
  importedAt: 1,
  document: {
    format: "text",
    extractorVersion: 1,
    coverage: "text",
    chunks: [
      {
        index: 0,
        locator: { kind: "line", number: 1 },
        text: "Lira usa cuaderno violeta.",
      },
    ],
  },
});
const context = {
  question: "¿Qué dice la fuente ficticia?",
  at: "2026-11-18T10:00:00Z",
  zone: "Europe/Madrid",
  ranked: false,
};
const accepted = {
  status: "answered",
  text: "Según Manual ficticio, Lira usa cuaderno violeta.",
  memories: [],
  references: [0],
};
const fake = (answer: unknown, review = true): StructuredModel => ({
  async call(stage, _instructions, _data, schema) {
    return schema.parse(
      stage === "knowledge_review" ? { accepted: review } : answer,
    );
  },
});

test("document citations are server-selected and cannot impersonate personal memory IDs", async () => {
  const reference = source();
  const answer = await answerKnowledge(
    fake(accepted),
    [],
    [reference],
    context,
    async () => {},
  );
  assert.deepEqual(answer.ids, []);
  assert.equal(answer.citations[0]?.sourceId, reference.id);
  for (const invalid of [
    { ...accepted, memories: [0] },
    { ...accepted, references: [1] },
    { ...accepted, references: [0, 0] },
    { ...accepted, references: [] },
    { ...accepted, sourceId: randomUUID() },
  ]) {
    await assert.rejects(
      answerKnowledge(fake(invalid), [], [reference], context, async () => {}),
    );
  }
});

test("independent review and authority validation can refuse a mixed answer", async () => {
  await assert.rejects(
    answerKnowledge(
      fake(accepted, false),
      [],
      [source()],
      context,
      async () => {},
    ),
  );
  let checks = 0;
  await assert.rejects(
    answerKnowledge(fake(accepted), [], [source()], context, async () => {
      if (++checks === 3) throw new Error("Synthetic revoked authority");
    }),
  );
});

test("ranked selection preserves partial coverage instead of claiming a complete document", async () => {
  const reference = source();
  reference.document.coverage = "partial";
  reference.document.chunks = Array.from({ length: 15 }, (_, index) => ({
    index,
    locator: { kind: "line", number: index + 1 },
    text: `Cuaderno violeta ficticio ${index}`,
  }));
  let reviewed = false;
  const model: StructuredModel = {
    async call(stage, _instructions, data, schema) {
      if (stage === "knowledge_search")
        return schema.parse({ terms: ["cuaderno"] });
      const packet = data as {
        referenceCoverage: string;
        references: { extractionPartial: boolean }[];
      };
      assert.equal(packet.referenceCoverage, "ranked");
      assert.equal(packet.references.length, 12);
      assert.ok(packet.references.every((item) => item.extractionPartial));
      if (stage === "knowledge_review") {
        reviewed = true;
        return schema.parse({ accepted: true });
      }
      return schema.parse(accepted);
    },
  };
  await answerKnowledge(model, [], [reference], context, async () => {});
  assert.equal(reviewed, true);
});
