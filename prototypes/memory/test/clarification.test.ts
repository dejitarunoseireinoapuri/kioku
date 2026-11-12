import test from "node:test";
import assert from "node:assert/strict";
import { requiredClarification } from "../src/clarification.ts";

test("a standalone unbound person or incomplete event date requires clarification", () => {
  assert.ok(requiredClarification("Él me dijo que la tutoría era el viernes."));
  assert.ok(requiredClarification("Ella me prestó un cargador."));
  assert.ok(requiredClarification("La revisión del aparato es el día 18."));
});

test("explicit identity, recurring birthday and an admitted unknown date do not force extra questions", () => {
  assert.equal(
    requiredClarification("Riku me dijo que la tutoría era el viernes."),
    null,
  );
  assert.equal(
    requiredClarification("Alex cumple años el 2 de febrero."),
    null,
  );
  assert.equal(
    requiredClarification("La revisión fue el día 18, no recuerdo el mes."),
    null,
  );
});
