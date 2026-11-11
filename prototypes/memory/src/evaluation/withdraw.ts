import type { MemoryEngine } from "../engine.ts";

// An unsaved fixture cannot demonstrate that a later withdrawal worked.
export async function withdrawForEvaluation(
  engine: MemoryEngine,
  sourceId: string,
) {
  const snapshot = await engine.repository.load();
  if (!snapshot.sources.some((source) => source.id === sourceId)) {
    return { performed: false, reason: "SOURCE_NEVER_SAVED" } as const;
  }
  await engine.forget(sourceId);
  return { performed: true, reason: null } as const;
}
