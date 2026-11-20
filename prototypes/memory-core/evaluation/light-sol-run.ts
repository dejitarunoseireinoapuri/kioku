import { Interpreter } from "../ai/interpreter.ts";
import { InterpretationError } from "../ai/contracts.ts";
import type { StructuredModel } from "../ai/contracts.ts";
import { query } from "../ai/query.ts";
import { harness } from "../fixtures/harness.ts";
import { captureCases, matchesCapture } from "./light-sol-cases.ts";
import {
  queryAt,
  queryZone,
  queryReliabilityCases,
} from "./query-reliability-cases.ts";
import { SubscriptionModel } from "./subscription-model.ts";

type Scenario = {
  id: string;
  operation: "capture" | "query";
  run: (model: StructuredModel) => Promise<boolean>;
};
const queryIds = new Set([
  "speech-1",
  "speech-unrelated-context",
  "speech-event-vs-record",
  "speech-future-advice",
  "umbrella-partial",
  "umbrella-ellipsis",
  "forgotten-not-restored",
]);
const scenarios: Scenario[] = [
  ...captureCases.map(
    (scenario): Scenario => ({
      id: scenario.id,
      operation: "capture",
      async run(model) {
        const h = harness();
        h.advance(Date.parse(queryAt) - h.runtime.now());
        const { draft, proposal } = await new Interpreter(model).interpret(
          {
            text: scenario.text,
            at: queryAt,
            zone: queryZone,
            mode: "capture",
          },
          [],
          { verifyCaptureIntent: true },
        );
        if (!matchesCapture(scenario, draft)) return false;
        return draft
          ? proposal.status === "ready" &&
              h.save(draft).refs.length === draft.units.length
          : proposal.status === "clarify" &&
              Boolean(proposal.question) &&
              !Object.keys(h.store.read().units).length;
      },
    }),
  ),
  ...queryReliabilityCases
    .filter((scenario) => queryIds.has(scenario.id))
    .map(
      (scenario): Scenario => ({
        id: scenario.id,
        operation: "query",
        async run(model) {
          const { h, expectedIds } = scenario.setup();
          const text = scenario.previous
            ? JSON.stringify({
                pregunta_actual: scenario.question,
                preguntas_anteriores_solo_contexto: scenario.previous,
              })
            : scenario.question;
          const answer = await query(model, h, text, queryAt, queryZone);
          return (
            answer.status === scenario.expected &&
            JSON.stringify(answer.ids.slice().sort()) ===
              JSON.stringify(expectedIds.slice().sort()) &&
            (scenario.required ?? []).every((pattern) =>
              new RegExp(pattern, "iu").test(answer.text),
            )
          );
        },
      }),
    ),
];

const high = await SubscriptionModel.open();
const light = await SubscriptionModel.openLightSol();
console.log(
  JSON.stringify({
    apiCalls: 0,
    productionEquivalent: false,
    baseline: [high.model, high.reasoning],
    candidate: [light.model, light.reasoning],
    review: [high.model, high.reasoning],
  }),
);
for (const [index, scenario] of scenarios.entries()) {
  const variants = index % 2 ? ["light", "current"] : ["current", "light"];
  for (const variant of variants) {
    const phases: { stage: string; ms: number }[] = [];
    const model: StructuredModel = {
      async call(stage, instructions, data, schema, limit) {
        const started = performance.now();
        const selected =
          variant === "light" && (stage === "interpret" || stage === "answer")
            ? light
            : high;
        try {
          return await selected.call(stage, instructions, data, schema, limit);
        } finally {
          phases.push({ stage, ms: Math.round(performance.now() - started) });
        }
      },
    };
    const meta = { id: scenario.id, operation: scenario.operation, variant };
    const started = performance.now();
    try {
      const pass = await scenario.run(model);
      console.log(
        JSON.stringify({
          ...meta,
          pass,
          totalMs: Math.round(performance.now() - started),
          phases,
        }),
      );
      if (!pass) process.exitCode = 1;
    } catch (error) {
      const issue =
        error instanceof InterpretationError
          ? error.code
          : "EVALUATION_UNAVAILABLE";
      console.log(
        JSON.stringify({
          ...meta,
          pass: false,
          issue,
          totalMs: Math.round(performance.now() - started),
          phases,
        }),
      );
      if (issue.startsWith("SUBSCRIPTION_")) process.exit(1);
      process.exitCode = 1;
    }
  }
}
console.log(
  JSON.stringify({
    currentProfileCalls: high.calls,
    lightProfileCalls: light.calls,
    apiCalls: 0,
  }),
);
