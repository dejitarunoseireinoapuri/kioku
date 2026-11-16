import type { StructuredModel } from "./contracts.ts";
import type { CatalogReader, SearchIndex } from "../src/search-index.ts";
import type { Reference } from "../src/contracts.ts";
import type { MemoryPrototype } from "../src/memory.ts";
import { InterpretationError } from "./contracts.ts";
import { answerEvidence } from "./query.ts";
import { retrieve } from "./search.ts";

export interface EvidenceReader extends CatalogReader {
  evidence(
    actor: string,
    epoch: number,
    refs: Reference[],
  ): Promise<ReturnType<MemoryPrototype["evidence"]>["items"]>;
}

export async function queryCatalog(
  model: StructuredModel,
  reader: EvidenceReader,
  index: SearchIndex,
  input: {
    actor: string;
    text: string;
    at: string;
    zone: string;
    previous?: string;
  },
) {
  const found = await retrieve(model, reader, index, input);
  if (found.exhaustiveRequested && found.truncated)
    return {
      status: "clarify" as const,
      text: "Hay más recuerdos de los que puedo revisar juntos. Concreta el tema o el periodo para acotar la búsqueda.",
      evidence: [],
      ids: [],
      retrieval: found,
    };
  const items = await reader.evidence(input.actor, found.epoch, found.refs);
  if (
    items.length !== found.refs.length ||
    items.some(
      (item, i) =>
        item.unit.id !== found.refs[i]!.id ||
        item.unit.revision !== found.refs[i]!.revision,
    )
  )
    throw new InterpretationError("SEARCH_EVIDENCE_MISMATCH");
  if (!items.length) {
    await reader.assertCurrent(input.actor, found.epoch);
    return {
      status: "not_found" as const,
      text: "No encuentro ese dato con esta búsqueda.",
      evidence: [],
      ids: [],
      retrieval: found,
    };
  }
  const answer = await answerEvidence(
    model,
    items,
    {
      question: input.text,
      at: input.at,
      zone: input.zone,
      previousQuestion: input.previous,
      ranked: true,
    },
    () => reader.assertCurrent(input.actor, found.epoch),
  );
  return { ...answer, retrieval: found };
}
