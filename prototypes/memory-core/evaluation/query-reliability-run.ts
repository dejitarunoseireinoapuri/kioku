import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { query } from "../ai/query.ts";
import { InterpretationError } from "../ai/contracts.ts";
import { SubscriptionModel } from "./subscription-model.ts";
import {
  queryReliabilityCases,
  queryAt,
  queryZone,
} from "./query-reliability-cases.ts";

const { values } = parseArgs({
  options: { run: { type: "string" }, cases: { type: "string" } },
});
if (!values.run || !/^[a-z0-9-]{1,64}$/u.test(values.run))
  throw Error("Explicit run id required");
const selection = values.cases?.split(",");
const cases = queryReliabilityCases.filter(
  (c) => !selection || selection.includes(c.id),
);
if (!cases.length || selection?.some((id) => !cases.some((c) => c.id === id)))
  throw Error("Unknown case selection");
const directory = `local-data/query-reliability/${values.run}`;
await mkdir("local-data/query-reliability", { recursive: true });
await mkdir(directory); // Refuse overwriting observed results.
const model = await SubscriptionModel.open();
const sourceHash = createHash("sha256");
for (const file of [
  "../ai/query.ts",
  "../ai/query-input.ts",
  "../ai/prompts.ts",
  "../ai/calendar.ts",
  "../ai/answer-evidence.ts",
  "../ai/contracts.ts",
  "./query-reliability-cases.ts",
  "./subscription-model.ts",
]) {
  sourceHash
    .update(file)
    .update(await readFile(new URL(file, import.meta.url)));
}
const codeAndCorpusHash = sourceHash.digest("hex");
const results = [];
for (const scenario of cases) {
  const { h, expectedIds } = scenario.setup();
  const input = scenario.previous
    ? JSON.stringify({
        pregunta_actual: scenario.question,
        preguntas_anteriores_solo_contexto: scenario.previous,
      })
    : scenario.question;
  const started = Date.now();
  const previousCalls = model.calls;
  let result;
  try {
    const answer = await query(model, h, input, queryAt, queryZone);
    const pass =
      answer.status === scenario.expected &&
      JSON.stringify([...answer.ids].sort()) ===
        JSON.stringify([...expectedIds].sort()) &&
      (scenario.required ?? []).every((pattern) =>
        new RegExp(pattern, "iu").test(answer.text),
      );
    result = {
      id: scenario.id,
      family: scenario.family,
      pass,
      expected: scenario.expected,
      actual: answer.status,
      evidenceMatches:
        JSON.stringify([...answer.ids].sort()) ===
        JSON.stringify([...expectedIds].sort()),
    };
  } catch (error) {
    result = {
      id: scenario.id,
      family: scenario.family,
      pass: false,
      expected: scenario.expected,
      issue:
        error instanceof InterpretationError
          ? error.message
          : "EVALUATION_UNAVAILABLE",
    };
  }
  results.push({
    ...result,
    calls: model.calls - previousCalls,
    elapsedMs: Date.now() - started,
  });
  await writeFile(
    `${directory}/metrics.json`,
    JSON.stringify(
      {
        provider: "Codex CLI / ChatGPT subscription",
        model: model.model,
        reasoning: model.reasoning,
        productionEquivalent: false,
        codeAndCorpusHash,
        apiCalls: 0,
        casesHash: createHash("sha256")
          .update(
            JSON.stringify(
              cases.map((c) => ({
                id: c.id,
                question: c.question,
                expected: c.expected,
                previous: c.previous,
              })),
            ),
          )
          .digest("hex"),
        passed: results.filter((r) => r.pass).length,
        total: cases.length,
        subscriptionCalls: model.calls,
        results,
      },
      null,
      2,
    ),
  );
  console.log(JSON.stringify(results.at(-1)));
}
if (results.some((r) => !r.pass)) process.exitCode = 1;
