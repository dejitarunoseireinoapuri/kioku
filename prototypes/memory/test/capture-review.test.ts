import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { Budget } from "../src/budget.ts";
import { OpenAiMemory, model } from "../src/openai.ts";
import { modelProfile } from "../src/model-config.ts";
const turn = {
  id: "synthetic",
  text: "Hana viajará a Osaka.",
  receivedAt: "2026-11-12T10:00:00Z",
  zone: "Europe/Madrid",
};
const draft = {
  status: "saved",
  clarification: null,
  items: [
    {
      text: turn.text,
      evidenceId: "s1",
      kind: "intention",
      entities: ["Hana"],
      time: { precision: "unknown", value: null, end: null, evidenceId: null },
      provenance: "reported",
      attribution: "Hana",
      attributionEvidenceId: "s1",
      eventStatus: "planned",
      lifecycle: "current",
    },
  ],
};
for (const invalid of [false, true])
  test(
    invalid
      ? "capture never falls back to an unreviewed draft when review fails"
      : "explicit capture review repairs a subject incorrectly treated as the informant",
    async () => {
      await mkdir("local-data/m0/tests", { recursive: true });
      const directory = await mkdtemp("local-data/m0/tests/capture-");
      const stages: string[] = [];
      try {
        const transport: typeof fetch = async (_url, options) => {
          const body = JSON.parse(String(options?.body));
          const stage: string = body.text.format.name;
          stages.push(stage);
          assert.equal(body.model, model);
          assert.deepEqual(body.reasoning, { effort: modelProfile.reasoning });
          const extraction = {
            ...draft,
            items: draft.items.map((i) => ({
              ...i,
              provenance: "personal",
              attribution: null,
              attributionEvidenceId: null,
            })),
          };
          const payload =
            stage === "memory_extraction"
              ? draft
              : invalid
                ? { decision: "replace", extraction: null, changes: [] }
                : { decision: "replace", extraction, changes: ["attribution"] };
          return Response.json({
            status: "completed",
            output: [
              {
                type: "message",
                content: [
                  { type: "output_text", text: JSON.stringify(payload) },
                ],
              },
            ],
            usage: { input_tokens: 10, output_tokens: 10 },
          });
        };
        const provider = new OpenAiMemory(
          "sk-synthetic-test-only",
          new Budget(directory + "/budget.json", 0.5),
          transport,
        );
        if (invalid)
          await assert.rejects(
            provider.extract(turn, null),
            /MODEL_OUTPUT_INVALID/,
          );
        else {
          const result = await provider.extract(turn, null);
          assert.equal(result.items[0]?.attribution, null);
          assert.equal(result.items[0]?.provenance, "personal");
          assert.deepEqual(provider.lastCaptureReview, ["attribution"]);
        }
        assert.deepEqual(stages, [
          "memory_extraction",
          "memory_capture_review",
        ]);
      } finally {
        await rm(directory, { recursive: true, force: true });
      }
    },
  );

for (const state of ["needs_clarification", "ignored"] as const) {
  test(`non-persisting ${state} with an empty payload needs no saved-capture review`, async () => {
    const directory = await mkdtemp("local-data/m0/tests/non-persist-");
    let calls = 0;
    try {
      const transport: typeof fetch = async () => {
        calls++;
        return Response.json({
          status: "completed",
          output: [
            {
              type: "message",
              content: [
                {
                  type: "output_text",
                  text: JSON.stringify({
                    status: state,
                    clarification:
                      state === "needs_clarification"
                        ? "¿A quién te refieres?"
                        : null,
                    items: [],
                  }),
                },
              ],
            },
          ],
          usage: { input_tokens: 10, output_tokens: 10 },
        });
      };
      const p = new OpenAiMemory(
        "sk-synthetic-test-only",
        new Budget(directory + "/budget.json", 0.5),
        transport,
      );
      const result = await p.extract(turn, null);
      assert.equal(result.status, state);
      assert.deepEqual(result.items, []);
      assert.equal(calls, 1);
      assert.equal(p.lastCaptureReview, null);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
}
test("a non-persisting response cannot smuggle draft items past saved-capture review", async () => {
  const directory = await mkdtemp("local-data/m0/tests/non-persist-invalid-");
  try {
    const transport: typeof fetch = async () =>
      Response.json({
        status: "completed",
        output: [
          {
            type: "message",
            content: [
              {
                type: "output_text",
                text: JSON.stringify({ ...draft, status: "ignored" }),
              },
            ],
          },
        ],
        usage: { input_tokens: 10, output_tokens: 10 },
      });
    const p = new OpenAiMemory(
      "sk-synthetic-test-only",
      new Budget(directory + "/budget.json", 0.5),
      transport,
    );
    await assert.rejects(p.extract(turn, null), /EXTRACTION_STATE_INVALID/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

for (const valid of [true, false])
  test(
    valid
      ? "an unchanged saved draft still requires an explicit review acceptance"
      : "review acceptance with hidden replacement or changes is rejected, never treated as approval",
    async () => {
      const directory = await mkdtemp("local-data/m0/tests/review-accept-");
      let calls = 0;
      try {
        const corrected = {
          ...draft,
          items: draft.items.map((i) => ({
            ...i,
            provenance: "personal",
            attribution: null,
            attributionEvidenceId: null,
          })),
        };
        const transport: typeof fetch = async () => {
          calls++;
          return Response.json({
            status: "completed",
            output: [
              {
                type: "message",
                content: [
                  {
                    type: "output_text",
                    text: JSON.stringify(
                      calls === 1
                        ? corrected
                        : {
                            decision: "accept",
                            extraction: valid ? null : corrected,
                            changes: [],
                          },
                    ),
                  },
                ],
              },
            ],
            usage: { input_tokens: 10, output_tokens: 10 },
          });
        };
        const p = new OpenAiMemory(
          "sk-synthetic-test-only",
          new Budget(directory + "/budget.json", 0.5),
          transport,
        );
        if (valid) {
          assert.equal((await p.extract(turn, null)).status, "saved");
          assert.equal(p.lastCaptureReviewDecision, "accept");
        } else
          await assert.rejects(p.extract(turn, null), /MODEL_OUTPUT_INVALID/);
        assert.equal(calls, 2);
      } finally {
        await rm(directory, { recursive: true, force: true });
      }
    },
  );
