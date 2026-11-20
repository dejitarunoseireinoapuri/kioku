import { query } from "../ai/query.ts";
import { InterpretationError } from "../ai/contracts.ts";
import type { StructuredModel } from "../ai/contracts.ts";
import {
  queryAt,
  queryZone,
  queryReliabilityCases,
} from "./query-reliability-cases.ts";
import { SubscriptionModel } from "./subscription-model.ts";

const ids = new Set([
  "speech-1",
  "speech-future-advice",
  "speech-unrelated-context",
  "umbrella-partial",
  "umbrella-ellipsis",
  "forgotten-not-restored",
]);
const checks = queryReliabilityCases.filter((scenario) => ids.has(scenario.id));
const high = await SubscriptionModel.open();
const medium = await SubscriptionModel.open("medium");

console.log(
  JSON.stringify({
    provider: "ChatGPT subscription",
    productionEquivalent: false,
    apiCalls: 0,
  }),
);
for (const [index, scenario] of checks.entries()) {
  const order = index % 2 ? ["medium", "high"] : ["high", "medium"];
  for (const effort of order) {
    const { h, expectedIds } = scenario.setup();
    const text = scenario.previous
      ? JSON.stringify({
          pregunta_actual: scenario.question,
          preguntas_anteriores_solo_contexto: scenario.previous,
        })
      : scenario.question;
    let answerMs = 0;
    const provider: StructuredModel = {
      async call(stage, instructions, data, schema, limit) {
        const start = performance.now();
        try {
          const model =
            stage === "answer" && effort === "medium" ? medium : high;
          return await model.call(stage, instructions, data, schema, limit);
        } finally {
          if (stage === "answer")
            answerMs = Math.round(performance.now() - start);
        }
      },
    };
    const start = performance.now();
    try {
      const result = await query(provider, h, text, queryAt, queryZone);
      const evidenceMatches =
        JSON.stringify(result.ids.slice().sort()) ===
        JSON.stringify(expectedIds.slice().sort());
      const pass =
        result.status === scenario.expected &&
        evidenceMatches &&
        (scenario.required ?? []).every((pattern) =>
          new RegExp(pattern, "iu").test(result.text),
        );
      console.log(
        JSON.stringify({
          id: scenario.id,
          effort,
          pass,
          answerMs,
          totalMs: Math.round(performance.now() - start),
        }),
      );
      if (!pass) process.exitCode = 1;
    } catch (error) {
      const code =
        error instanceof InterpretationError
          ? error.code
          : "EVALUATION_UNAVAILABLE";
      console.log(
        JSON.stringify({
          id: scenario.id,
          effort,
          pass: false,
          answerMs,
          completed: false,
          code,
        }),
      );
      if (code.startsWith("SUBSCRIPTION_")) process.exit(1);
      process.exitCode = 1;
    }
  }
}
