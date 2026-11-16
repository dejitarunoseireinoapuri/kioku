import test from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import { SolProvider } from "../ai/provider.ts";
import { Interpreter, materialize } from "../ai/interpreter.ts";
import { calendar } from "../ai/calendar.ts";
import { InterpretationError } from "../ai/contracts.ts";
import type {
  Input,
  Interpretation,
  StructuredModel,
} from "../ai/contracts.ts";
import { twoPlans } from "../fixtures/scenarios.ts";
import { harness } from "../fixtures/harness.ts";
import { query } from "../ai/query.ts";

function proposal(): Interpretation {
  const draft = twoPlans();
  return {
    status: "ready",
    question: null,
    preserveTime: false,
    units: draft.units.map((u) => ({ ...u, existing: null })),
    segments: draft.fragments.map((f) => ({
      literal: draft.text.slice(f.start, f.end),
      role: f.role,
      owners: f.owners,
    })),
    relations: [],
  };
}
const input: Input = {
  text: twoPlans().text,
  at: "2026-05-10T10:00:00Z",
  zone: "Europe/Madrid",
  mode: "capture",
};
const accept = { accepted: true, issues: [] };
function fake(values: unknown[]): StructuredModel {
  return {
    async call<T>(
      _stage: string,
      _instructions: string,
      _data: unknown,
      schema: z.ZodType<T>,
    ) {
      return schema.parse(values.shift());
    },
  };
}
test("R2 materializes exact spans and uses the R1 ownership validator", () => {
  assert.deepEqual(materialize(proposal(), input, []), twoPlans());
  const bad = proposal();
  bad.segments[0]!.literal += "!";
  assert.throws(() => materialize(bad, input, []), {
    message: "SEGMENT_LITERAL",
  });
  const shared = proposal();
  shared.segments[0]!.owners = shared.units.map((u) => u.key);
  assert.throws(() => materialize(shared, input, []));
});
test("R2 does not accept an interpretation rejected by the fidelity review", async () => {
  const interpreter = new Interpreter(
    fake([proposal(), { accepted: false, issues: ["ownership"] }]),
  );
  await assert.rejects(() => interpreter.interpret(input, []), {
    message: "REVIEW_ownership",
  });
});
test("R2 question/clarification responses cannot smuggle units", async () => {
  const bad = { ...proposal(), status: "clarify", question: "¿Qué dato?" };
  await assert.rejects(
    () => new Interpreter(fake([bad])).interpret(input, []),
    { message: "INTERPRETATION_STATE" },
  );
});
test("R2 calendar uses capture zone across midnight and DST", () => {
  assert.equal(
    calendar("2026-07-14T23:30:00Z", "Europe/Madrid").tomorrow,
    "2026-07-16",
  );
  assert.equal(
    calendar("2026-07-14T01:30:00Z", "America/Los_Angeles").localDay,
    "2026-07-13",
  );
  assert.equal(
    calendar("2026-03-28T23:30:00Z", "Europe/Madrid").tomorrow,
    "2026-03-30",
  );
});
test("R2 provider pins medium, disables storage and counts unsuccessful completions", async () => {
  let reserves = 0,
    settlements = 0,
    seen = false;
  const provider = new SolProvider(
    "sk-synthetic-fixture",
    {
      async reserve() {
        reserves++;
      },
      async settle() {
        settlements++;
      },
    },
    () => undefined,
    async (_url, options) => {
      const body = JSON.parse(String(options?.body));
      assert.equal(body.model, "gpt-6.1-sol");
      assert.equal(body.reasoning.effort, "medium");
      assert.equal(body.store, false);
      assert.equal(options?.redirect, "error");
      seen = true;
      return new Response(
        JSON.stringify({
          model: "gpt-6.1-sol",
          status: "incomplete",
          output: [],
          usage: { input_tokens: 10, output_tokens: 20 },
        }),
      );
    },
  );
  await assert.rejects(
    () =>
      provider.call(
        "test",
        "synthetic",
        {},
        z.strictObject({ ok: z.boolean() }),
        100,
      ),
    { message: "MODEL_INCOMPLETE" },
  );
  assert.equal(seen, true);
  assert.equal(reserves, 1);
  assert.equal(settlements, 1);
});
test("R2 provider does not retry refusals, HTTP errors or malformed output", async () => {
  for (const [response, code] of [
    [new Response("private raw error", { status: 429 }), "HTTP_429"],
    [
      new Response(
        JSON.stringify({
          model: "gpt-6.1-sol",
          status: "completed",
          output: [{ type: "message", content: [{ type: "refusal" }] }],
          usage: { input_tokens: 10, output_tokens: 2 },
        }),
      ),
      "MODEL_REFUSAL",
    ],
  ] as const) {
    let calls = 0;
    const provider = new SolProvider(
      "sk-synthetic-fixture",
      { async reserve() {}, async settle() {} },
      () => undefined,
      async () => {
        calls++;
        return response;
      },
    );
    await assert.rejects(
      () =>
        provider.call(
          "test",
          "synthetic",
          {},
          z.strictObject({ ok: z.boolean() }),
          100,
        ),
      { message: code },
    );
    assert.equal(calls, 1);
  }
});
test("R2 answers cannot cite another candidate or evidence withdrawn during generation", async () => {
  const h = harness();
  h.save(twoPlans());
  await assert.rejects(
    () =>
      query(
        fake([{ status: "answered", text: "Synthetic", evidence: [100] }]),
        h,
        "synthetic",
        input.at,
        input.zone,
      ),
    { message: "ANSWER_EVIDENCE" },
  );
  let call = 0;
  const model: StructuredModel = {
    async call<T>(_s: string, _i: string, _d: unknown, schema: z.ZodType<T>) {
      if (call++ === 0)
        return schema.parse({
          status: "answered",
          text: "Synthetic",
          evidence: [0],
        });
      const unit = Object.values(h.store.read().units)[0]!;
      h.erase([{ id: unit.id, revision: unit.revision }]);
      return schema.parse(accept);
    },
  };
  await assert.rejects(() =>
    query(model, h, "synthetic", input.at, input.zone),
  );
});
test("R2 structured errors expose only safe codes", () => {
  assert.equal(new InterpretationError("MODEL_SCHEMA").message, "MODEL_SCHEMA");
});
