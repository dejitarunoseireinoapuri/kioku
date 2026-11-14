import assert from "node:assert/strict";
import test from "node:test";
import { OpenAiMemory, model } from "../src/openai.ts";
import { modelProfile } from "../src/model-config.ts";

const profiles = [
  {
    method: "interpretMessage",
    name: "message_intent",
    tokens: 900,
    valid: {
      action: "ask",
      fact: null,
      alsoAsk: false,
      useContext: false,
      question: null,
      forgetScope: null,
    },
  },
  {
    method: "selectMemoryTarget",
    name: "memory_target",
    tokens: 1400,
    valid: { memoryIds: [], correction: null, question: "¿Qué recuerdo?" },
  },
  {
    method: "reviewMessagePlan",
    name: "message_plan_review",
    tokens: 600,
    valid: { allowed: true },
  },
] as const;

for (const profile of profiles)
  for (const invalid of [false, true]) {
    test(`${profile.name} uses the fixed private bounded profile and rejects invalid output: ${invalid}`, async () => {
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
          assert.equal(body.max_output_tokens, profile.tokens);
          assert.equal(body.text.format.name, profile.name);
          assert.equal(body.text.format.strict, true);
          return Response.json({
            status: "completed",
            output: [
              {
                type: "message",
                content: [
                  {
                    type: "output_text",
                    text: JSON.stringify(
                      invalid
                        ? { ...profile.valid, invented: true }
                        : profile.valid,
                    ),
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
          provider[profile.method]({ synthetic: true }),
          /MODEL_OUTPUT_INVALID/u,
        );
      else
        assert.deepEqual(
          await provider[profile.method]({ synthetic: true }),
          profile.valid,
        );
      assert.equal(calls, 1);
    });
  }
