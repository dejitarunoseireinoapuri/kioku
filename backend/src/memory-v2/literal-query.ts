import type { Snapshot } from "#memory-v2/src/model";

// Only the quoted words are search data. The entire surrounding request must be a lookup.
const literalLookup =
  /^¿?en qu[ée] recuerdo (?:aparece|figura|dije) (?:«([^«»"\r\n]{2,100})»|"([^«»"\r\n]{2,100})")\??$/iu;

export function requestedLiteral(question: string): string | null {
  const match = literalLookup.exec(question.trim());
  const words = match?.[1] ?? match?.[2];
  return words?.trim() ? words : null;
}

export function findLiteral(state: Snapshot, question: string) {
  const words = requestedLiteral(question);
  if (!words) return null;
  const ids = new Set<string>();
  for (const row of Object.values(state.occurrences)) {
    if (
      !state.units[row.unitId] ||
      state.revocations[row.unitId] ||
      !state.sources[row.sourceId]
    )
      continue;
    if (
      row.fragmentIds.some((id) => {
        const fragment = state.fragments[id];
        return (
          fragment?.role === "primary" &&
          fragment.sourceId === row.sourceId &&
          fragment.owners.includes(row.unitId) &&
          fragment.text.includes(words)
        );
      })
    )
      ids.add(row.unitId);
  }
  const [unitId] = ids;
  return ids.size === 1 && unitId
    ? {
        kind: "match" as const,
        text: `La frase «${words}» aparece en este recuerdo.`,
        unitId,
      }
    : null;
}
