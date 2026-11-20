import { createHash } from "node:crypto";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import {
  messageIntentInstructions,
  messageIntentSchema,
} from "../../memory/src/conversation-format.ts";
import { SubscriptionModel } from "./subscription-model.ts";
import { queryAt, queryZone } from "./query-reliability-cases.ts";

const run = process.argv[2];
if (!run || !/^[a-z0-9-]{1,64}$/u.test(run))
  throw Error("Explicit run id required");
const extra = await readFile(
  new URL(
    "../../../backend/src/memory-v2/intent-clarification.ts",
    import.meta.url,
  ),
  "utf8",
);
const clarification =
  /export const clarificationInstructions = `([\s\S]*?)`;/u.exec(extra)?.[1];
if (!clarification) throw Error("Intent instructions unavailable");
const instructions = `${messageIntentInstructions}\n${clarification}`;
const cases = [
  {
    id: "intent-imperative",
    text: "Dime lo que me dijo ayer la profesora ficticia Ada",
    expected: "ask",
  },
  {
    id: "intent-question",
    text: "¿Qué me recomendó ayer la profesora ficticia Ada?",
    expected: "ask",
  },
  {
    id: "intent-forgot-myself",
    text: "He olvidado lo que me dijo Ada. ¿Me recuerdas qué me recomendó ayer?",
    expected: "ask",
  },
  {
    id: "intent-cannot-recall",
    text: "No recuerdo dónde dejé mi paraguas violeta, ¿puedes buscarlo?",
    expected: "ask",
  },
  {
    id: "intent-remind-me",
    text: "Recuérdame lo que me explicó ayer la profesora ficticia Ada",
    expected: "ask",
  },
  {
    id: "intent-forgot-recommendation",
    text: "Se me ha olvidado qué me aconsejó Ada ayer. ¿Me ayudas a recordarlo?",
    expected: "ask",
  },
  {
    id: "intent-real-new-fact",
    text: "He olvidado el paraguas violeta en el tren. ¿Dónde tengo la carpeta azul?",
    expected: "offer",
  },
  {
    id: "intent-forget-all",
    text: "Olvida todos mis recuerdos",
    expected: "forgetAll",
  },
];
await mkdir("local-data/query-reliability", { recursive: true });
const directory = `local-data/query-reliability/${run}`;
await mkdir(directory);
const model = await SubscriptionModel.open();
const results = [];
for (const scenario of cases) {
  const reply = await model.call(
    "message_intent",
    instructions,
    {
      text: scenario.text,
      mode: "ask",
      context: { questions: [], sourceIds: [] },
      receivedAt: queryAt,
      zone: queryZone,
    },
    messageIntentSchema,
    1400,
  );
  const offer = scenario.expected === "offer";
  const literal = reply.fact !== null && scenario.text.includes(reply.fact);
  const pass =
    reply.action === scenario.expected &&
    (offer ? literal : reply.fact === null) &&
    reply.question === null &&
    reply.alsoAsk === offer &&
    reply.forgetScope === null &&
    reply.useContext === false;
  results.push({
    id: scenario.id,
    pass,
    expected: scenario.expected,
    actual: reply.action,
  });
  await writeFile(
    `${directory}/metrics.json`,
    JSON.stringify(
      {
        provider: "Codex CLI / ChatGPT subscription",
        model: model.model,
        reasoning: model.reasoning,
        productionEquivalent: false,
        apiCalls: 0,
        subscriptionCalls: model.calls,
        instructionsHash: createHash("sha256")
          .update(instructions)
          .digest("hex"),
        passed: results.filter((result) => result.pass).length,
        total: cases.length,
        results,
      },
      null,
      2,
    ),
  );
  console.log(JSON.stringify(results.at(-1)));
}
if (results.some((result) => !result.pass)) process.exitCode = 1;
