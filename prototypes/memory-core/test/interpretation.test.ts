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
import { indexedText } from "../ai/indexed-evidence.ts";

function proposal(): Interpretation {
  const draft = twoPlans();
  return {
    status: "ready",
    question: null,
    preserveTime: false,
    retention: [],
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
function indexedProposal() {
  const p = proposal();
  let offset = 0;
  return {
    ...p,
    segments: p.segments.map(({ literal, ...part }) => {
      offset += indexedText(literal).length;
      return { ...part, end: offset - 1 };
    }),
  };
}
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
    fake([indexedProposal(), { accepted: false, issues: ["ownership"] }]),
  );
  await assert.rejects(() => interpreter.interpret(input, []), {
    message: "REVIEW_ownership",
  });
});

test("R2 repeats reuse stable descriptors but cannot overwrite identity anchors", () => {
  const h = harness(),
    saved = h.save(twoPlans()),
    candidates = Object.values(h.store.read().units);
  const p = proposal();
  p.units[0]!.existing = 0;
  p.units[0]!.content.proposition = "Equivalent phrasing reviewed upstream";
  const draft = materialize(p, input, candidates);
  assert.deepEqual(draft.units[0]!.existing, saved.refs[0]);
  assert.deepEqual(draft.units[0]!.content, candidates[0]!.content);
  for (const change of ["subject", "kind", "time"] as const) {
    const bad = structuredClone(p);
    if (change === "subject") bad.units[0]!.content.subject = "someone else";
    if (change === "kind") bad.units[0]!.content.kind = "fact";
    if (change === "time") bad.units[0]!.time.value = "2031-01-02";
    assert.throws(() => materialize(bad, input, candidates), {
      message:
        change === "time" ? "REPEAT_TIME_MISMATCH" : "REPEAT_ANCHOR_MISMATCH",
    });
  }
});

test("R2 an empty current catalog answers absence without inference or old conversational facts", async () => {
  const h = harness();
  const result = await query(
    fake([]),
    h,
    "¿Y hoy?",
    "2026-07-14T12:00:00Z",
    "Europe/Madrid",
    "¿Qué vi ayer?",
  );
  assert.equal(result.status, "not_found");
  assert.deepEqual(result.ids, []);
});

test("R2 negative answers cannot add neighboring facts and are still reviewed against current evidence", async () => {
  const h = harness();
  h.save(twoPlans());
  const result = await query(
    fake([
      {
        status: "not_found",
        text: "irrelevant neighboring detail",
        evidence: [1],
      },
      accept,
    ]),
    h,
    "¿Dónde está el alicate?",
    "2026-07-14T12:00:00Z",
    "Europe/Madrid",
  );
  assert.deepEqual(result.ids, []);
  assert.ok(!result.text.includes("neighboring"));
  await assert.rejects(
    () =>
      query(
        fake([
          { status: "not_found", text: "No", evidence: [] },
          { accepted: false, issues: ["coverage"] },
        ]),
        h,
        "¿Qué quiero hacer?",
        "2026-07-14T12:00:00Z",
        "Europe/Madrid",
      ),
    { message: "ANSWER_REVIEW_coverage" },
  );
});
test("R2 question/clarification responses cannot smuggle units", async () => {
  const bad = {
    ...indexedProposal(),
    status: "clarify",
    question: "¿Qué dato?",
  };
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

test("provider incomplete reasons are closed codes and consumed tokens are still settled", async () => {
  for (const [reason, code] of [
    ["max_output_tokens", "MODEL_OUTPUT_LIMIT"],
    ["content_filter", "MODEL_CONTENT_FILTER"],
    ["private arbitrary provider detail", "MODEL_INCOMPLETE"],
  ]) {
    let settled = 0;
    const provider = new SolProvider(
      "sk-synthetic-fixture",
      {
        async reserve() {},
        async settle(_r, input, output) {
          assert.equal(input, 11);
          assert.equal(output, 17);
          settled++;
        },
      },
      () => undefined,
      async () =>
        new Response(
          JSON.stringify({
            model: "gpt-6.1-sol",
            status: "incomplete",
            incomplete_details: { reason },
            output: [],
            usage: { input_tokens: 11, output_tokens: 17 },
          }),
        ),
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
    assert.equal(settled, 1);
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

test("failed answers release their evidence reservation and do not lock the next question", async () => {
  const h = harness();
  h.save(twoPlans());
  for (let i = 0; i < 12; i++)
    await assert.rejects(
      () =>
        query(
          fake([{ status: "answered", text: "Synthetic", evidence: [999] }]),
          h,
          "synthetic",
          input.at,
          input.zone,
        ),
      { message: "ANSWER_EVIDENCE" },
    );
  const answer = await query(
    fake([
      { status: "answered", text: "Quieres dibujar.", evidence: [0] },
      accept,
    ]),
    h,
    "synthetic",
    input.at,
    input.zone,
  );
  assert.equal(answer.status, "answered");
});
