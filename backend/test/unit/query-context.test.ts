import assert from "node:assert/strict";
import { test } from "node:test";
import { currentQueryText } from "../../src/query/context.js";
import { queryInput } from "#memory-v2/ai/query-input";

test("stale mobile questions are discarded after a correction/forget, including old clients without a revision", () => {
  const legacy = {
    pregunta_actual: "¿Y hoy?",
    preguntas_anteriores_solo_contexto: ["¿Qué película vi?"],
  };
  assert.equal(currentQueryText(JSON.stringify(legacy), 1), "¿Y hoy?");
  assert.equal(
    currentQueryText(JSON.stringify({ ...legacy, memory_revision: 2 }), 3),
    "¿Y hoy?",
  );
  assert.deepEqual(
    JSON.parse(
      currentQueryText(JSON.stringify({ ...legacy, memory_revision: 2 }), 2),
    ),
    legacy,
  );
  assert.deepEqual(
    JSON.parse(currentQueryText(JSON.stringify(legacy), 0)),
    legacy,
  );
  assert.equal(currentQueryText("¿Qué vi?", 4), "¿Qué vi?");
});

test("normalized query envelopes retain only context of the authorized current memory revision", () => {
  const payload = JSON.stringify({
    pregunta_actual: "Dime qué me recomendó Ada ayer",
    preguntas_anteriores_solo_contexto: ["¿Dónde dejé mi paraguas?"],
    memory_revision: 4,
  });
  assert.deepEqual(queryInput(currentQueryText(payload, 4)), {
    question: "¿Qué me recomendó Ada ayer?",
    previousQuestions: ["¿Dónde dejé mi paraguas?"],
  });
  assert.deepEqual(queryInput(currentQueryText(payload, 5)), {
    question: "¿Qué me recomendó Ada ayer?",
    previousQuestions: [],
  });
});
