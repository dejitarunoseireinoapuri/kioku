import test from "node:test";
import assert from "node:assert/strict";
import { normalizeCapture } from "../src/capture-normalization.ts";
import type { Extraction, MemoryIntelligence } from "../src/domain.ts";

const turn = {
  id: "atomic-source",
  text: "Quiero visitar el vivero el 16 de noviembre de 2026 y leer un cómic mañana.",
  receivedAt: "2026-11-15T12:00:00Z",
  zone: "Europe/Madrid",
};
const extraction: Extraction = {
  status: "saved",
  clarification: null,
  items: [
    {
      text: "Quiero visitar el vivero el 16 de noviembre de 2026.",
      quote: turn.text,
      kind: "intention",
      entities: ["vivero"],
      time: {
        precision: "day",
        value: "2026-11-17",
        end: null,
        quote: "16 de noviembre de 2026",
      },
      provenance: "personal",
      attribution: null,
      attributionEvidence: null,
      eventStatus: "planned",
      lifecycle: "current",
    },
    {
      text: "Quiero leer un cómic mañana.",
      quote: turn.text,
      kind: "intention",
      entities: ["cómic"],
      time: {
        precision: "day",
        value: "2026-11-16",
        end: null,
        quote: "mañana",
      },
      provenance: "personal",
      attribution: null,
      attributionEvidence: null,
      eventStatus: "planned",
      lifecycle: "current",
    },
  ],
};
const base: MemoryIntelligence = {
  extract: async () => extraction,
  embed: async () => [],
  answer: async () => {
    throw Error("Not a query");
  },
};

test("a time correction keeps independent texts and requests review instead of copying shared evidence", async () => {
  let reviewed = false;
  const normalized = await normalizeCapture(
    extraction,
    turn.text,
    turn,
    {
      ...base,
      refineCapture: async (original, value) => {
        reviewed = true;
        assert.equal(original.receivedAt, turn.receivedAt);
        assert.equal(value.items[0]!.time.value, "2026-11-16");
        assert.equal(value.items[0]!.text, extraction.items[0]!.text);
        assert.doesNotMatch(value.items[0]!.text, /cómic/u);
        return value;
      },
    },
    null,
  );
  assert.equal(reviewed, true);
  assert.equal(normalized.items[0]!.text, extraction.items[0]!.text);
  assert.equal(normalized.items[1]!.text, extraction.items[1]!.text);
});

test("missing or failed text review cannot widen a fact or approve a capture", async () => {
  await assert.rejects(
    normalizeCapture(extraction, turn.text, turn, base, null),
    /CAPTURE_TIME_TEXT_REVIEW_REQUIRED/,
  );
  await assert.rejects(
    normalizeCapture(
      extraction,
      turn.text,
      turn,
      {
        ...base,
        refineCapture: async () => {
          throw Error("Review refused");
        },
      },
      null,
    ),
    /Review refused/,
  );
});

test("a text refinement cannot change evidence, time or the number of captured facts", async () => {
  for (const mutate of [
    (value: Extraction) => {
      value.items[0]!.quote = "A different source";
    },
    (value: Extraction) => {
      value.items[0]!.time.value = "2026-11-18";
    },
    (value: Extraction) => {
      value.items.pop();
    },
  ]) {
    await assert.rejects(
      normalizeCapture(
        extraction,
        turn.text,
        turn,
        {
          ...base,
          refineCapture: async (_original, value) => {
            const altered = structuredClone(value);
            mutate(altered);
            return altered;
          },
        },
        null,
      ),
      /CAPTURE_REFINEMENT_CHANGED_EVIDENCE/,
    );
  }
});
