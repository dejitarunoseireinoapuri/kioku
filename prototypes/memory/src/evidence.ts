import type { Candidate, Source } from "./domain.ts";
import { MemoryError } from "./domain.ts";

export function selectEvidence(candidates: Candidate[], sources: Source[]) {
  const selected: Source[] = [];
  let characters = 0;
  for (const { memory } of candidates) {
    if (selected.some((source) => source.id === memory.sourceId)) continue;
    const source = sources.find((entry) => entry.id === memory.sourceId);
    if (!source) throw new MemoryError("MEMORY_SOURCE_MISSING");
    if (characters + source.text.length > 16_000) continue;
    selected.push(source);
    characters += source.text.length;
  }
  const ids = new Set(selected.map((source) => source.id));
  return {
    sources: selected,
    candidates: candidates.filter(({ memory }) => ids.has(memory.sourceId)),
  };
}
