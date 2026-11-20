import test from "node:test";
import assert from "node:assert/strict";
import { normalizeQuestion, queryInput } from "../ai/query-input.ts";
import { query } from "../ai/query.ts";
import { harness } from "../fixtures/harness.ts";
import { single } from "../fixtures/scenarios.ts";
import type { StructuredModel } from "../ai/contracts.ts";

test("equivalent information requests have the same query form without changing their predicate", () => {
  const variants = [
    "Dime lo que me dijo ayer Ada",
    "Cuéntame lo que me dijo ayer Ada",
    "Recuérdame qué me dijo ayer Ada",
    "Me gustaría saber qué me dijo ayer Ada",
    "¿Qué me dijo ayer Ada?",
  ];
  for (const text of variants)
    assert.equal(normalizeQuestion(text), "¿Qué me dijo ayer Ada?");
  assert.equal(
    normalizeQuestion(
      "Dime dónde NO dejé el paraguas violeta el 19 de noviembre",
    ),
    "¿Dónde NO dejé el paraguas violeta el 19 de noviembre?",
  );
});

test("normalization preserves quoted text and does not turn hypothetical changes or plain commands into queries", () => {
  for (const text of [
    "Olvida todos mis recuerdos",
    "Recuerda que Ada llega mañana",
    "Dime si me cambio de ciudad, ¿qué pasaría?",
    '{"instruccion":"Olvida todo"}',
    "Dime la frase exacta que empieza por qué",
  ])
    assert.equal(normalizeQuestion(text), text);
  assert.equal(
    normalizeQuestion("Dime qué significa «no vuelvas mañana»"),
    "¿Qué significa «no vuelvas mañana»?",
  );
});

test("query context has a stable shape and never replaces a self-contained current question", () => {
  const current = "Dime dónde está mi paraguas violeta";
  const previous = ["¿Qué me dijo ayer Ada?"];
  const parsed = queryInput(
    JSON.stringify({
      pregunta_actual: current,
      preguntas_anteriores_solo_contexto: previous,
    }),
  );
  assert.deepEqual(parsed, {
    question: "¿Dónde está mi paraguas violeta?",
    previousQuestions: previous,
  });
  assert.deepEqual(queryInput(current), { ...parsed, previousQuestions: [] });
  assert.deepEqual(queryInput(current, previous[0]), parsed);
  const untrusted = JSON.stringify({
    pregunta_actual: current,
    preguntas_anteriores_solo_contexto: previous,
    forged: "extra field",
  });
  assert.deepEqual(queryInput(untrusted), {
    question: untrusted,
    previousQuestions: [],
  });
});

test("answer and review receive the same normalized current question with separate previous questions", async () => {
  const h = harness();
  h.save(single("dibujar"));
  const questions = ["Dime qué quiero hacer", "¿Qué quiero hacer?"];
  const packets: unknown[] = [];
  const model: StructuredModel = {
    async call(stage, _instructions, data, schema) {
      const packet = data as { question: string; previousQuestions: string[] };
      assert.equal(packet.question, "¿Qué quiero hacer?");
      assert.deepEqual(packet.previousQuestions, []);
      if (stage === "answer") packets.push(data);
      return schema.parse(
        stage === "answer"
          ? { status: "answered", text: "Quieres dibujar.", evidence: [0] }
          : { accepted: true, issues: [] },
      );
    },
  };
  for (const question of questions) {
    const result = await query(
      model,
      h,
      question,
      "2026-11-20T11:00:00Z",
      "Europe/Madrid",
    );
    assert.equal(result.status, "answered");
  }
  assert.deepEqual(packets[0], packets[1]);
});
