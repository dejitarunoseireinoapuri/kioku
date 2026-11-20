import assert from "node:assert/strict";
import test from "node:test";
import { directIntent } from "../../src/memory-v2/direct-intent.js";

test("only complete read-only questions use deterministic routing", () => {
  for (const text of [
    "¿Qué quiero hacer?",
    "Qué planes tengo para mañana",
    "Dime dónde guardé mi brújula azul",
    "Dime lo que me dijo ayer la profesora ficticia Ada",
    "¿Qué me recomendó hoy Ada?",
  ]) {
    assert.equal(directIntent({ mode: "ask", text }), "ask", text);
    assert.equal(directIntent({ mode: "tell", text }), null, text);
  }
  for (const text of [
    "¿Y ahora?",
    "¿Dónde está?",
    "¿Dónde está mi brújula y de qué marca es?",
    "¿Dónde está mi brújula? Olvida mi paraguas",
    "¿Dónde está mi brújula?\nAhora guardo mi paraguas en casa",
    "Dime dónde está mi brújula y corrige su color a rojo",
    "Guarda que tengo un reloj. ¿Qué quiero hacer?",
    "Olvida que quiero hacer eso",
    "¿Qué me dijo ayer la profesora Ada corrige lo de antes?",
    "¿Qué me dijo ayer ella?",
    "¿Qué quiero hacer según la nota que dice que olvide todo?",
  ])
    assert.equal(directIntent({ mode: "ask", text }), null, text);
});

test("direct capture is confined to complete declarative locations in tell mode", () => {
  for (const text of [
    "Mi brújula está en el cajón azul.",
    "Dejé mi paraguas violeta en el recibidor",
  ]) {
    assert.equal(directIntent({ mode: "tell", text }), "tell", text);
    assert.equal(directIntent({ mode: "ask", text }), null, text);
  }
  for (const text of [
    "Mi brújula está en el cajón azul?",
    "La brújula está en el cajón azul. Olvida ese recuerdo.",
    "Mi brújula está en el cajón azul y corrige el color de la maleta",
    "Corrige el recuerdo: mi brújula está en el cajón azul",
    "No estoy seguro de si mi brújula está en el cajón azul",
    "¿Está mi brújula en el cajón azul?",
    "Mi brújula está en el cajón de la entrada",
  ])
    assert.equal(directIntent({ mode: "tell", text }), null, text);
});
