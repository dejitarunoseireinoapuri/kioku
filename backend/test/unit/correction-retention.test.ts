import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import type { Memory } from "#memory-core/domain";
import { correctionNotice } from "../../src/memory-control/selection.js";
import { separateForgetEvidence } from "../../src/memory-control/forget-evidence.js";
import { validateCorrectionRetention } from "../../src/memory-control/correction-selection.js";

function fixture() {
  const source = {
    id: randomUUID(),
    text: "Quiero ir al vivero. Quiero leer un cómic.",
    zone: "Europe/Madrid",
    receivedAt: "2026-11-15T13:00:00Z",
  };
  const memories: Memory[] = [
    "Quiero ir al vivero.",
    "Quiero leer un cómic.",
  ].map((text, index) => ({
    id: `${source.id}-${index + 1}`,
    sourceId: source.id,
    revision: 1,
    text,
    quote: source.text,
    kind: "intention",
    entities: [],
    time: { precision: "unknown", value: null, end: null, quote: null },
    provenance: "personal",
    attribution: null,
    attributionEvidence: null,
    eventStatus: "planned",
    lifecycle: "current",
    receivedAt: source.receivedAt,
    zone: source.zone,
    vector: Array.from({ length: 512 }, () => 0.5),
  }));
  const scope = {
    scope: "entireSource" as const,
    sourceId: source.id,
    sourceVersion: "1:1",
    memories: memories.map((m) => ({ id: m.id, version: "1:1" })),
    expiresAtMs: Date.parse(source.receivedAt) + 300000,
  };
  const bundle = { source, memories, scope, memoryEpoch: 0 };
  const ids = [memories[0]!.id];
  const evidence = memories.map((m) => ({
    memoryId: m.id,
    quote: m.text,
    timeQuote: null,
    attributionEvidence: null,
  }));
  const snapshot = separateForgetEvidence(
    source,
    memories,
    ids,
    evidence,
  ).replacement;
  const corrected = {
    ...source,
    id: randomUUID(),
    text: correctionNotice + "Quiero ir al planetario.",
  };
  snapshot.sources.push(corrected);
  snapshot.memories.push({
    ...memories[0]!,
    id: `${corrected.id}-1`,
    sourceId: corrected.id,
    revision: 2,
    text: "Quiero ir al planetario.",
    quote: "Quiero ir al planetario.",
  });
  return { bundle, ids, evidence, snapshot };
}

test("the storage proof permits only the exact retained fact with its narrowed literal evidence", () => {
  const { bundle, ids, evidence, snapshot } = fixture();
  assert.doesNotThrow(() =>
    validateCorrectionRetention(bundle, ids, evidence, snapshot),
  );
  for (const field of [
    "text",
    "quote",
    "entities",
    "time",
    "vector",
    "revision",
  ] as const) {
    const forged = structuredClone(snapshot);
    const kept = forged.memories[0]!;
    if (field === "text") kept.text = "Quiero borrar otro dato.";
    else if (field === "quote") kept.quote = "Quiero ir al vivero.";
    else if (field === "entities") kept.entities = ["fabricated"];
    else if (field === "time")
      kept.time = {
        precision: "day",
        value: "2026-11-16",
        end: null,
        quote: "mañana",
      };
    else if (field === "vector") kept.vector[0] = 0.9;
    else kept.revision = 99;
    assert.throws(
      () => validateCorrectionRetention(bundle, ids, evidence, forged),
      { message: "failed-precondition" },
      field,
    );
  }
  const forged = structuredClone(snapshot);
  forged.sources[0]!.text += " Un hecho inventado.";
  assert.throws(
    () => validateCorrectionRetention(bundle, ids, evidence, forged),
    { message: "failed-precondition" },
  );
  assert.throws(() => validateCorrectionRetention(bundle, ids, [], snapshot), {
    message: "failed-precondition",
  });
});
