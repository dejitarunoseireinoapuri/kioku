import assert from "node:assert/strict";
import test from "node:test";
import { OpenAiMemory, model } from "../src/openai.ts";
import { modelProfile } from "../src/model-config.ts";

for (const selection of [true, false])
  for (const invalid of [true, false]) {
    test(`duplicate ${selection ? "selection" : "review"} is bounded, private and strict: invalid=${invalid}`, async () => {
      let calls = 0;
      const valid = selection
        ? { memoryIds: [], evidence: [], unresolved: false, question: null }
        : { allowed: true };
      const provider = new OpenAiMemory(
        "sk-synthetic-test-only",
        { reserve: async () => {}, settle: async () => {} },
        async (url, request) => {
          calls++;
          assert.equal(url, "https://api.openai.com/v1/responses");
          const body = JSON.parse(String(request?.body));
          assert.equal(body.model, model);
          assert.deepEqual(body.reasoning, { effort: modelProfile.reasoning });
          assert.equal(body.store, false);
          assert.equal(body.max_output_tokens, selection ? 6000 : 1000);
          assert.equal(body.text.format.strict, true);
          assert.equal(
            body.text.format.name,
            selection ? "memory_duplicates" : "memory_duplicates_review",
          );
          return Response.json({
            status: "completed",
            output: [
              {
                type: "message",
                content: [
                  {
                    type: "output_text",
                    text: JSON.stringify(
                      invalid ? { ...valid, unauthorized: true } : valid,
                    ),
                  },
                ],
              },
            ],
            usage: { input_tokens: 10, output_tokens: 10 },
          });
        },
      );
      const method = selection
        ? "selectDuplicateFacts"
        : "reviewDuplicateFacts";
      if (invalid)
        await assert.rejects(
          provider[method]({ synthetic: true }),
          /MODEL_OUTPUT_INVALID/u,
        );
      else assert.deepEqual(await provider[method]({ synthetic: true }), valid);
      assert.equal(calls, 1);
    });
  }
