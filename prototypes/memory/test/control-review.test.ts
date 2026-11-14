import assert from "node:assert/strict";
import test from "node:test";
import { OpenAiMemory, model } from "../src/openai.ts";
import { modelProfile } from "../src/model-config.ts";

for (const invalid of [false, true])
  test(`source-change review is bounded and fails closed: invalid=${invalid}`, async () => {
    let calls = 0;
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
        assert.equal(body.max_output_tokens, 800);
        assert.equal(body.text.format.name, "memory_change_review");
        return Response.json({
          status: "completed",
          output: [
            {
              type: "message",
              content: [
                {
                  type: "output_text",
                  text: JSON.stringify({
                    authorized: true,
                    unrelatedPreserved: invalid ? "yes" : true,
                    noRemovedDataRemains: true,
                  }),
                },
              ],
            },
          ],
          usage: { input_tokens: 10, output_tokens: 10 },
        });
      },
    );
    if (invalid)
      await assert.rejects(
        provider.reviewSourceChange({ synthetic: true }),
        /MODEL_OUTPUT_INVALID/u,
      );
    else
      assert.equal(
        (await provider.reviewSourceChange({ synthetic: true }))
          .unrelatedPreserved,
        true,
      );
    assert.equal(calls, 1);
  });
