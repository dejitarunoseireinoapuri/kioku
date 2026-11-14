import test from "node:test";
import assert from "node:assert/strict";
import { captureFormat } from "../src/capture-format.ts";
import { canonicalTime } from "../src/temporal.ts";

const text =
  "Además de pintar pasado mañana, quiero ir al planetario el sábado.";
const anchor = {
  receivedAt: "2026-11-14T18:11:09.924Z",
  zone: "Europe/Madrid",
};
const format = captureFormat(text, null);
function draft(evidenceText: string, value = "2026-11-16") {
  return {
    status: "saved",
    clarification: null,
    items: [
      {
        text: "Plan ficticio.",
        evidenceId: "s1",
        kind: "intention",
        entities: [],
        provenance: "personal",
        attribution: null,
        attributionEvidenceId: null,
        eventStatus: "planned",
        lifecycle: "current",
        time: {
          precision: "day",
          value,
          end: null,
          evidenceId: "s1",
          evidenceText,
        },
      },
    ],
  };
}

test("two dates in one sentence bind independently without weakening the temporal guard", () => {
  assert.throws(
    () =>
      canonicalTime(
        { precision: "day", value: "2026-11-16", end: null, quote: text },
        text,
        text,
        anchor,
      ),
    /TIME_RELATIVE_MISMATCH/,
  );
  for (const [phrase, value] of [
    ["pasado mañana", "2026-11-16"],
    ["el sábado", "2026-11-21"],
  ]) {
    const extracted = format.materialize(
      format.schema.parse(draft(phrase!, value)),
    );
    const item = extracted.items[0]!;
    assert.equal(item.quote, text);
    assert.equal(item.time.quote, phrase);
    assert.equal(
      canonicalTime(item.time, item.quote, text, anchor).value,
      value,
    );
  }
});

test("temporal text cannot invent a literal or borrow one from a different evidence part", () => {
  assert.throws(
    () => format.materialize(format.schema.parse(draft("el martes"))),
    /QUOTE_NOT_IN_SOURCE/,
  );
  const separated = captureFormat(
    "Hoy pintaré. El sábado iré al planetario.",
    null,
  );
  assert.throws(
    () => separated.materialize(separated.schema.parse(draft("el sábado"))),
    /QUOTE_NOT_IN_SOURCE/,
  );
});

test("an incompatible weekday or a conflicting same-event phrase still fails validation", () => {
  const item = format.materialize(
    format.schema.parse(draft("el sábado", "2026-11-16")),
  ).items[0]!;
  assert.throws(
    () => canonicalTime(item.time, item.quote, text, anchor),
    /TIME_RELATIVE_MISMATCH/,
  );
  const conflict = "Iré al museo pasado mañana, el sábado.";
  assert.throws(
    () =>
      canonicalTime(
        { precision: "day", value: "2026-11-16", end: null, quote: conflict },
        conflict,
        conflict,
        anchor,
      ),
    /TIME_RELATIVE_MISMATCH/,
  );
});
