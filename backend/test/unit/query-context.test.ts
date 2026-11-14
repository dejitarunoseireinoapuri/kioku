import assert from "node:assert/strict";
import { test } from "node:test";
import { currentQueryText } from "../../src/query/context.js";

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
