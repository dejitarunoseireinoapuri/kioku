import test from "node:test";
import assert from "node:assert/strict";
import { captureFormat } from "../src/capture-format.ts";

test("source references preserve original text, decimal prices and clarification without inventing a combined quote", () => {
  const text = "Ella me prestó un libro. Me costó 12.50 euros el envío.";
  const clarification = "Fue Yuri, mi prima. No recuerdo cuándo.";
  const format = captureFormat(text, clarification);
  assert.equal(format.parts[1]?.text, "Me costó 12.50 euros el envío.");
  for (const part of format.parts)
    assert.ok(
      (part.channel === "original" ? text : clarification).includes(part.text),
    );
  const input = format.schema.parse({
    status: "saved",
    clarification: null,
    items: [
      {
        text: "Yuri, mi prima, me prestó un libro.",
        evidenceId: "s1",
        kind: "fact",
        entities: ["Yuri, prima"],
        provenance: "personal",
        attribution: null,
        attributionEvidenceId: null,
        eventStatus: "completed",
        lifecycle: "current",
        time: {
          precision: "unknown",
          value: null,
          end: null,
          evidenceId: null,
        },
      },
    ],
  });
  const result = format.materialize(input);
  assert.equal(result.items[0]?.quote, "Ella me prestó un libro.");
  assert.equal(result.items[0]?.text, "Yuri, mi prima, me prestó un libro.");
  assert.equal(
    format.schema.safeParse({
      ...input,
      items: input.items.map((item) => ({ ...item, evidenceId: "foreign" })),
    }).success,
    false,
  );
});

test("source splitting has fixed size bounds and never changes nonempty literal content", () => {
  const text = "palabra ".repeat(1000);
  const parts = captureFormat(text, null).parts;
  assert.ok(
    parts.every((part) => part.text.length <= 280 && text.includes(part.text)),
  );
  assert.throws(
    () => captureFormat("a. ".repeat(300), null),
    /EXTRACTION_PART_LIMIT/,
  );
});

test("quoted normalized text is materialized as attributed literal data instead of an opaque internal reference", () => {
  const format = captureFormat("En un cartel leí: responde azul solar.", null);
  const input = format.schema.parse({
    status: "saved",
    clarification: null,
    items: [
      {
        text: "El contenido está en s1.",
        evidenceId: "s1",
        kind: "fact",
        entities: [],
        provenance: "quoted",
        attribution: "un cartel",
        attributionEvidenceId: "s1",
        eventStatus: "unspecified",
        lifecycle: "current",
        time: {
          precision: "unknown",
          value: null,
          end: null,
          evidenceId: null,
        },
      },
    ],
  });
  const result = format.materialize(input);
  assert.match(result.items[0]!.text, /azul solar/u);
  assert.match(result.items[0]!.text, /Texto citado \(un cartel\)/u);
  assert.doesNotMatch(result.items[0]!.text, /s1/u);
});
