import test from "node:test";
import assert from "node:assert/strict";
import { captureFormat } from "../src/capture-format.ts";
import { prepareCaptureReview } from "../src/capture-review.ts";
import { OpenAiMemory } from "../src/openai.ts";
const turn = {
  id: "review-source",
  text: "La cita es el 16 de noviembre de 2026.",
  receivedAt: "2026-11-15T14:00:00Z",
  zone: "Europe/Madrid",
};
function draft(text = turn.text) {
  const format = captureFormat(text, null);
  const value = format.schema.parse({
    status: "saved",
    clarification: null,
    items: [
      {
        text: "La cita es el 17 de noviembre de 2026.",
        evidenceId: "s1",
        kind: "fact",
        entities: [],
        provenance: "personal",
        attribution: null,
        attributionEvidenceId: null,
        eventStatus: "planned",
        lifecycle: "current",
        time: {
          precision: "day",
          value: "2026-11-17",
          end: null,
          evidenceId: "s1",
          evidenceText: "16 de noviembre de 2026",
        },
      },
    ],
  });
  return { format, value };
}

test("the reviewer sees canonical metadata while the candidate wording is left for semantic review", () => {
  const { format, value } = draft();
  const prepared = prepareCaptureReview(value, format, turn, null);
  assert.equal(prepared.normalizationApplied, true);
  assert.deepEqual(prepared.validationIssues, []);
  assert.equal(prepared.draft.items[0]!.time.value, "2026-11-16");
  assert.equal(prepared.draft.items[0]!.text, value.items[0]!.text);
  assert.equal(prepared.draft.items[0]!.evidenceId, "s1");
});

test("invalid literal evidence reaches the one independent review with a content-free diagnostic", () => {
  const { format, value } = draft();
  value.items[0]!.time.evidenceText = "17 de noviembre de 2026";
  const prepared = prepareCaptureReview(value, format, turn, null);
  assert.deepEqual(prepared.validationIssues, ["literal-or-time-validation"]);
  assert.equal(prepared.normalizationApplied, false);
  assert.deepEqual(prepared.draft, value);
  assert.equal(
    JSON.stringify(prepared.validationIssues).includes("noviembre"),
    false,
  );
});

for (const repair of [false, true])
  test(
    repair
      ? "the existing independent review can repair invalid time evidence"
      : "acceptance cannot bypass unresolved literal validation",
    async () => {
      const { value } = draft();
      value.items[0]!.time.evidenceText = "17 de noviembre de 2026";
      const fixed = structuredClone(value);
      fixed.items[0]!.time.evidenceText = "16 de noviembre de 2026";
      fixed.items[0]!.time.value = "2026-11-16";
      fixed.items[0]!.text = turn.text;
      let calls = 0;
      const transport: typeof fetch = async (_url, options) => {
        calls++;
        const body = JSON.parse(String(options?.body));
        if (calls === 2)
          assert.deepEqual(JSON.parse(body.input).validationIssues, [
            "literal-or-time-validation",
          ]);
        const output =
          calls === 1
            ? value
            : {
                decision: repair ? "replace" : "accept",
                extraction: repair ? fixed : null,
                changes: repair ? ["literal", "time"] : [],
              };
        return Response.json({
          status: "completed",
          output: [
            {
              type: "message",
              content: [{ type: "output_text", text: JSON.stringify(output) }],
            },
          ],
          usage: { input_tokens: 1, output_tokens: 1 },
        });
      };
      const ai = new OpenAiMemory(
        "sk-synthetic-test-only",
        { reserve: async () => {}, settle: async () => {} },
        transport,
      );
      if (repair)
        assert.equal(
          (await ai.extract(turn, null)).items[0]!.time.value,
          "2026-11-16",
        );
      else
        await assert.rejects(
          ai.extract(turn, null),
          /CAPTURE_REVIEW_VALIDATION_UNRESOLVED/,
        );
      assert.equal(calls, 2);
    },
  );
