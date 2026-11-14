import { randomUUID } from "node:crypto";
import type { Memory } from "#memory-core/domain";
import { searchProjection } from "../../src/query/search-projection.js";
import { db } from "./helpers.js";

export const uid = "retirement-owner";
export const at = Date.UTC(2026, 10, 14, 12);
export const vector = () => [1, ...Array.from({ length: 511 }, () => 0)];
export function fixture(count = 2) {
  const id = randomUUID();
  const source = {
    id,
    text: "Quiero ver Loto. El examen ficticio es el martes.",
    receivedAt: new Date(at).toISOString(),
    zone: "Europe/Madrid",
    memoryCount: count,
    requestHash: "a".repeat(64),
  };
  const memories = Array.from(
    { length: count },
    (_, index): Memory => ({
      id: `${id}-${index + 1}`,
      sourceId: id,
      revision: 1,
      text:
        index === 0 ? "Quiero ver Loto." : "El examen ficticio es el martes.",
      quote:
        index === 0 ? "Quiero ver Loto." : "El examen ficticio es el martes.",
      receivedAt: source.receivedAt,
      zone: source.zone,
      kind: "intention",
      entities: ["Loto"],
      time: { precision: "unknown", value: null, end: null, quote: null },
      provenance: "personal",
      attribution: null,
      attributionEvidence: null,
      eventStatus: "planned",
      lifecycle: "current",
      vector: vector(),
    }),
  );
  return { source, memories };
}

export async function seed(owner = uid, count = 2) {
  const { source, memories } = fixture(count);
  const root = db.doc(`accounts/${owner}`);
  await root.collection("sources").doc(source.id).set(source);
  for (const memory of memories)
    await root
      .collection("memories")
      .doc(memory.id)
      .set({ ...memory, ...searchProjection(memory) });
  return { source, memories };
}
