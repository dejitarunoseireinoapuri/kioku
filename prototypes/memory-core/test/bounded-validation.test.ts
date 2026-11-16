import test from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import { parseBudgetWindow } from "../evaluation/budget-window.ts";
import { EvaluationBudget } from "../evaluation/runtime.ts";
import { Interpreter } from "../ai/interpreter.ts";
import { indexedText } from "../ai/indexed-evidence.ts";
import type { IndexedInterpretation } from "../ai/indexed-evidence.ts";
import type { Input, StructuredModel } from "../ai/contracts.ts";
import { harness } from "../fixtures/harness.ts";
import { single, unknownTime } from "../fixtures/scenarios.ts";

test("additional budget includes parallel and uncertain reservations and survives a new run", async () => {
  const w = parseBudgetWindow({
    id: "synthetic",
    baselineSpentUsd: 10,
    baselineReservedUsd: 2,
    additionalUsd: 1,
  });
  const ledger = {
    spentUsd: 10,
    reservedUsd: 2,
    calls: 0,
    input: 0,
    output: 0,
    previousM0Spent: 0,
    previousM0Reserved: 0,
  };
  const meter = new EvaluationBudget(ledger, w.ceiling, async () => undefined);
  const results = await Promise.allSettled([
    meter.reserve(0.6),
    meter.reserve(0.6),
  ]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(meter.ledger.calls, 1);
  // Unknown transport is deliberately not settled; it still consumes this window.
  const nextRun = new EvaluationBudget(
    structuredClone(meter.ledger),
    w.ceiling,
    async () => undefined,
  );
  nextRun.runCeiling = 1000;
  await assert.rejects(() => nextRun.reserve(0.5), { message: "BUDGET_LIMIT" });
  await nextRun.reserve(0.3);
  assert.ok(nextRun.ledger.spentUsd + nextRun.ledger.reservedUsd <= w.ceiling);
  for (const additionalUsd of [0, -1, 16, Infinity])
    assert.throws(() =>
      parseBudgetWindow({
        id: "synthetic",
        baselineSpentUsd: 10,
        baselineReservedUsd: 2,
        additionalUsd,
      }),
    );
});

function capture() {
  const draft = single("guardar el mapa azul en la caja de nogal");
  const input: Input = {
    text: draft.text,
    at: "2026-07-14T12:00:00Z",
    zone: draft.zone,
    mode: "capture",
  };
  const wire: IndexedInterpretation = {
    status: "ready",
    question: null,
    preserveTime: false,
    retention: [],
    relations: [],
    units: [{ ...draft.units[0]!, time: unknownTime, existing: null }],
    segments: [
      {
        end: indexedText(input.text).length - 1,
        role: "primary",
        owners: ["a"],
      },
    ],
  };
  return { input, wire, draft };
}

test("simulated capture, clarification and correction reviews retain every semantic input without duplicate token arrays", async () => {
  for (const mode of ["capture", "clarify", "correction"] as const) {
    const { input, wire, draft } = capture();
    const h = harness();
    if (mode === "clarify") {
      wire.status = "clarify";
      wire.question = "¿A qué mapa te refieres?";
      wire.units = [];
      wire.segments = [];
    }
    if (mode === "correction") {
      const saved = h.save(draft),
        state = h.store.read();
      input.mode = "correction";
      input.target = state.units[saved.refs[0]!.id]!;
      input.evidence = Object.values(state.fragments).map((fragment) => ({
        fragment,
        source: state.sources[fragment.sourceId]!,
      }));
      wire.preserveTime = true;
      wire.retention = input.evidence.map(({ fragment }, index) => ({
        index,
        parts: [{ end: indexedText(fragment.text).length - 1, keep: true }],
      }));
    }
    let generatorData: Record<string, unknown> = {},
      reviewed = false;
    const model: StructuredModel = {
      async call<T>(
        stage: string,
        _instructions: string,
        data: unknown,
        schema: z.ZodType<T>,
      ) {
        if (stage === "interpret") {
          generatorData = structuredClone(data) as Record<string, unknown>;
          return schema.parse(wire);
        }
        const review = data as Record<string, unknown>;
        const expected = structuredClone(generatorData);
        delete expected.tokens;
        if (Array.isArray(expected.evidence))
          for (const entry of expected.evidence) delete entry.tokens;
        const { proposal, ...withoutProposal } = review;
        assert.deepEqual(withoutProposal, expected);
        assert.equal(JSON.stringify(review).includes('"tokens":'), false);
        assert.ok(
          JSON.stringify(generatorData).length >
            JSON.stringify(expected).length,
        );
        assert.ok(proposal);
        reviewed = true;
        return schema.parse({ accepted: true, issues: [] });
      },
    };
    const result = await new Interpreter(model).interpret(input, []);
    assert.ok(reviewed);
    assert.equal(
      result.proposal.status,
      mode === "clarify" ? "clarify" : "ready",
    );
    if (mode === "correction")
      assert.equal(result.retainedEvidence.length, input.evidence!.length);
  }
});

test("simulated review rejection and corrupted boundaries still prevent admission with no retries", async () => {
  for (const invalidBoundary of [false, true]) {
    const { input, wire } = capture();
    if (invalidBoundary) wire.segments[0]!.end = 999;
    let calls = 0;
    const model: StructuredModel = {
      async call<T>(
        stage: string,
        _instructions: string,
        _data: unknown,
        schema: z.ZodType<T>,
      ) {
        calls++;
        return schema.parse(
          stage === "interpret"
            ? wire
            : { accepted: false, issues: ["ownership"] },
        );
      },
    };
    await assert.rejects(() => new Interpreter(model).interpret(input, []), {
      message: invalidBoundary ? "SEGMENT_BOUNDARY" : "REVIEW_ownership",
    });
    assert.equal(calls, invalidBoundary ? 1 : 2);
  }
});
