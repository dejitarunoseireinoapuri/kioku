import { SourceError } from "./contracts.js";
import type { ReferenceSource } from "./store.js";

const terms = (text: string) =>
  new Set(
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .match(/[\p{L}\p{N}]{3,}/gu) ?? [],
  );
const ignored = new Set([
  "que",
  "cual",
  "como",
  "para",
  "por",
  "del",
  "las",
  "los",
  "una",
  "con",
  "dice",
  "sobre",
]);

/** Extractive evidence only. No invented answer or semantic/AI quality claim. */
export function retrieveReferences(
  sources: ReferenceSource[],
  question: string,
  sourceId?: string,
) {
  if (!question.trim() || question.length > 2000 || sources.length > 100)
    throw new SourceError("invalid");
  const wanted = [...terms(question)].filter((term) => !ignored.has(term));
  const candidates = sources.filter(
    (source) =>
      (!sourceId || source.id === sourceId) &&
      (sourceId || source.document.coverage !== "partial"),
  );
  return candidates
    .flatMap((source) =>
      source.document.chunks.map((chunk) => {
        const content = terms(chunk.text);
        const score = wanted.filter((term) => content.has(term)).length;
        return {
          sourceId: source.id,
          revision: source.revision,
          title: source.title,
          index: chunk.index,
          locator: chunk.locator,
          text: chunk.text,
          coverage: source.document.coverage,
          score,
        };
      }),
    )
    .filter((item) => item.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.sourceId.localeCompare(b.sourceId) ||
        a.index - b.index,
    )
    .slice(0, 12);
}
