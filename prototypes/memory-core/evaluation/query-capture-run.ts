import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { Interpreter } from "../ai/interpreter.ts";
import { InterpretationError } from "../ai/contracts.ts";
import { query } from "../ai/query.ts";
import { harness } from "../fixtures/harness.ts";
import { SubscriptionModel } from "./subscription-model.ts";
import { queryAt, queryZone } from "./query-reliability-cases.ts";

const run = process.argv[2];
if (!run || !/^[a-z0-9-]{1,64}$/u.test(run))
  throw Error("Explicit run id required");
const directory = `local-data/query-reliability/${run}`;
await mkdir("local-data/query-reliability", { recursive: true });
await mkdir(directory);
const hash = createHash("sha256");
for (const file of [
  "../ai/interpreter.ts",
  "../ai/prompts.ts",
  "../ai/query.ts",
  "../ai/query-input.ts",
  "./subscription-model.ts",
  "./query-capture-run.ts",
])
  hash.update(file).update(await readFile(new URL(file, import.meta.url)));
const codeAndCorpusHash = hash.digest("hex");
const model = await SubscriptionModel.open();
const h = harness();
h.advance(Date.parse(queryAt) - h.runtime.now());
const results: { id: string; pass: boolean; issue?: string }[] = [];
try {
  const captured = await new Interpreter(model).interpret(
    {
      text: "Ayer la profesora ficticia Ada me recomendó practicar piano veinte minutos cada día.",
      at: queryAt,
      zone: queryZone,
      mode: "capture",
    },
    [],
  );
  if (!captured.draft) throw new InterpretationError("CAPTURE_NOT_READY");
  const saved = h.save(captured.draft);
  results.push({ id: "capture-current-evidence", pass: saved.refs.length > 0 });
  for (const [index, question] of [
    "Dime lo que me dijo ayer la profesora Ada",
    "¿Qué me dijo ayer la profesora Ada?",
  ].entries()) {
    const answer = await query(model, h, question, queryAt, queryZone);
    results.push({
      id: `captured-query-${index + 1}`,
      pass:
        answer.status === "answered" &&
        /piano/iu.test(answer.text) &&
        /veinte|20/iu.test(answer.text) &&
        answer.ids.length > 0 &&
        answer.ids.every((id) => saved.refs.some((ref) => ref.id === id)),
    });
  }
} catch (error) {
  results.push({
    id: "capture-query-pipeline",
    pass: false,
    issue:
      error instanceof InterpretationError
        ? error.code
        : "EVALUATION_UNAVAILABLE",
  });
}
const report = {
  provider: "Codex CLI / ChatGPT subscription",
  model: model.model,
  reasoning: model.reasoning,
  productionEquivalent: false,
  apiCalls: 0,
  subscriptionCalls: model.calls,
  codeAndCorpusHash,
  passed: results.filter((result) => result.pass).length,
  results,
};
await writeFile(`${directory}/metrics.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report));
if (results.some((result) => !result.pass)) process.exitCode = 1;
