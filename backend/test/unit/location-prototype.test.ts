import assert from "node:assert/strict";
import test from "node:test";
import {
  parseCurrentLocation,
  parseLocationQuestion,
} from "../../src/memory-v2/direct-intent.js";

test("location rules preserve literal places and normalize only a closed object vocabulary", () => {
  assert.deepEqual(
    parseCurrentLocation("Mi brujula roja está en el cajón azul."),
    {
      object: "brujula",
      color: "rojo",
      place: "el cajón azul",
    },
  );
  assert.deepEqual(parseLocationQuestion("Dime dónde está mi brújula roja"), {
    object: "brujula",
    color: "rojo",
  });
  for (const text of [
    "Mi brújula no está en el cajón azul.",
    "Dejé mi brújula en el cajón azul.",
    "Mi brújula está en el cajón azul si no la han movido.",
    "Mi brújula está en el cajón azul y la otra está en la cocina.",
    "La nota dice: «Mi brújula está en el cajón azul».",
    "Olvida que mi brújula está en el cajón azul.",
    "Mi móvil está en el cajón azul.",
  ])
    assert.equal(parseCurrentLocation(text), null);
  for (const text of [
    "¿Dónde dejé mi brújula?",
    "¿Dónde está?",
    "¿De qué color es mi brújula?",
    "¿Dónde está mi brújula y qué marca es?",
  ]) {
    assert.equal(parseLocationQuestion(text), null);
  }
});
