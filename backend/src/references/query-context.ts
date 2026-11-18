import type { StructuredModel } from "#memory-v2/ai/contracts";
import type { LoadedState } from "../memory-v2/state-store.js";
import { V2Reader } from "../memory-v2/reader.js";
import { presentEvidence, groupsForUnits } from "../memory-v2/presentation.js";
import { answerKnowledge } from "./mixed-answer.js";
import type { ReferenceSource } from "./store.js";

export async function queryKnowledge(
  reader: V2Reader,
  loaded: LoadedState,
  model: StructuredModel,
  sources: ReferenceSource[],
  context: { question: string; zone: string },
  validate: () => Promise<void>,
) {
  const at = new Date().toISOString();
  const found = await reader.candidates(
    loaded,
    model,
    context.question,
    at,
    context.zone,
  );
  if (found.exhaustiveRequested && found.truncated)
    return {
      status: "needsClarification",
      text: "Concreta el tema o periodo para revisar juntos los recuerdos y fuentes pertinentes.",
      sources: [],
      citations: [],
    };
  const items = presentEvidence(
    loaded,
    found.units.map((unit) => ({ id: unit.id, revision: unit.revision })),
  );
  const answer = await answerKnowledge(
    model,
    items,
    sources,
    { ...context, at, ranked: found.ranked },
    validate,
  );
  return {
    status: answer.status,
    text: answer.text,
    sources: groupsForUnits(loaded, answer.ids),
    citations: answer.citations,
  };
}
