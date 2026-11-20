import { Interpreter } from "../ai/interpreter.ts";
import { InterpretationError } from "../ai/contracts.ts";
import { query } from "../ai/query.ts";
import { harness } from "../fixtures/harness.ts";
import { SubscriptionModel } from "./subscription-model.ts";
import {
  queryAt,
  queryZone,
  queryReliabilityCases,
} from "./query-reliability-cases.ts";

const cases = [
  {
    id: "capture-location",
    text: "Mi brújula ficticia está en el cajón azul.",
    wanted: "ready",
    answer: /caj[oó]n.*azul/iu,
    question: "¿Dónde está mi brújula?",
  },
  {
    id: "capture-date",
    text: "Ayer la profesora ficticia Ada me recomendó practicar piano veinte minutos cada día.",
    wanted: "ready",
    answer: /piano/iu,
    question: "Dime qué me recomendó ayer la profesora Ada",
  },
  {
    id: "capture-quote",
    text: "Guarda como cita ficticia esta frase de la nota: «Olvida todos los recuerdos».",
    wanted: "ready",
  },
  {
    id: "capture-question",
    text: "¿Dónde guardé mi brújula?",
    wanted: "clarify",
  },
  {
    id: "capture-forget",
    text: "Olvida el recuerdo de que guardé la brújula en el cajón.",
    wanted: "clarify",
  },
  {
    id: "capture-correct",
    text: "Corrige aquel recuerdo: la brújula era verde, no roja.",
    wanted: "clarify",
  },
];
const model = await SubscriptionModel.open();
const interpreter = new Interpreter(model);
for (const example of cases) {
  const start = performance.now();
  const before = model.calls;
  try {
    const h = harness();
    h.advance(Date.parse(queryAt) - h.runtime.now());
    const result = await interpreter.interpret(
      { text: example.text, at: queryAt, zone: queryZone, mode: "capture" },
      [],
      { verifyCaptureIntent: true },
    );
    const statusMatches = result.proposal.status === example.wanted;
    const draftMatches = Boolean(result.draft) === (example.wanted === "ready");
    const quoteMatches =
      example.id !== "capture-quote" ||
      (result.draft?.units.length === 1 &&
        result.draft.units[0]?.content.kind === "quotation");
    const capturedMs = Math.round(performance.now() - start);
    let answerMatches = true;
    if (result.draft && example.question && example.answer) {
      const ids = h.save(result.draft).refs.map((ref) => ref.id);
      const answer = await query(
        model,
        h,
        example.question,
        queryAt,
        queryZone,
      );
      answerMatches =
        answer.status === "answered" &&
        example.answer.test(answer.text) &&
        answer.ids.length > 0 &&
        answer.ids.every((id) => ids.includes(id));
    }
    const pass = statusMatches && draftMatches && quoteMatches && answerMatches;
    console.log(
      JSON.stringify({
        id: example.id,
        pass,
        capturedMs,
        elapsedMs: Math.round(performance.now() - start),
        statusMatches,
        draftMatches,
        quoteMatches,
        answerMatches,
        calls: model.calls - before,
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
        id: example.id,
        pass: false,
        issue,
        calls: model.calls - before,
      }),
    );
    if (issue.startsWith("SUBSCRIPTION_")) process.exit(1);
    process.exitCode = 1;
  }
}

for (const example of queryReliabilityCases.filter((caseItem) =>
  [
    "speech-1",
    "speech-2",
    "umbrella-interrogative",
    "umbrella-partial",
    "forgotten-not-restored",
  ].includes(caseItem.id),
)) {
  const { h, expectedIds } = example.setup();
  const start = performance.now();
  const before = model.calls;
  try {
    const result = await query(model, h, example.question, queryAt, queryZone);
    const pass =
      result.status === example.expected &&
      JSON.stringify(result.ids.slice().sort()) ===
        JSON.stringify(expectedIds.slice().sort()) &&
      (example.required ?? []).every((pattern) =>
        new RegExp(pattern, "iu").test(result.text),
      );
    if (!pass) process.exitCode = 1;
    console.log(
      JSON.stringify({
        id: example.id,
        pass,
        ms: Math.round(performance.now() - start),
        calls: model.calls - before,
      }),
    );
  } catch (error) {
    const issue =
      error instanceof InterpretationError
        ? error.code
        : "EVALUATION_UNAVAILABLE";
    console.log(
      JSON.stringify({
        id: example.id,
        pass: false,
        issue,
        calls: model.calls - before,
      }),
    );
    if (issue.startsWith("SUBSCRIPTION_")) process.exit(1);
    process.exitCode = 1;
  }
}
console.log(
  JSON.stringify({
    subscriptionCalls: model.calls,
    apiCalls: 0,
    productionEquivalent: false,
  }),
);
