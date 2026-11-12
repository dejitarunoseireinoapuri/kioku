import test from "node:test";
import assert from "node:assert/strict";
import { literalQuote } from "../src/literal.ts";

test("quote formatting is repaired to an actual source span without inventing words", () => {
  const original = "Sara me recomendó «La casa de los relojes»; me gustó.";
  const result = literalQuote(
    "Sara me recomendó La casa de los relojes.",
    original,
  );
  assert.ok(original.includes(result));
  assert.equal(result, "Sara me recomendó «La casa de los relojes");
});

test("a removed negation or changed numerical value inside a quote cannot be repaired", () => {
  assert.throws(
    () => literalQuote("Pablo quiere ir", "Pablo no quiere ir."),
    /QUOTE_NOT_IN_SOURCE/,
  );
  assert.throws(
    () => literalQuote("Costó 48 euros", "Costó 84 euros."),
    /QUOTE_NOT_IN_SOURCE/,
  );
  assert.throws(
    () => literalQuote("Llegó a las 18:30", "Llegó a las 18:40."),
    /QUOTE_NOT_IN_SOURCE/,
  );
});
