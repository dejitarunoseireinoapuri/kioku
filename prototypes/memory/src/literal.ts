import { MemoryError } from "./domain.ts";

function words(text: string) {
  return [...text.matchAll(/[\p{L}\p{M}\p{N}]+(?:[.,:][\p{N}]+)*/gu)].map(
    (match) => ({
      value: match[0].normalize("NFC").toLocaleLowerCase("es"),
      start: match.index,
      end: match.index + match[0].length,
    }),
  );
}

/** Return an actual source span; only case, whitespace and punctuation can differ in the proposal. */
export function literalQuote(proposed: string, source: string): string {
  if (source.includes(proposed)) return proposed;
  const requested = words(proposed);
  const available = words(source);
  if (requested.length < 2) throw new MemoryError("QUOTE_NOT_IN_SOURCE");
  for (let index = 0; index <= available.length - requested.length; index++) {
    if (
      !requested.every(
        (word, offset) => available[index + offset]!.value === word.value,
      )
    )
      continue;
    const span = source.slice(
      available[index]!.start,
      available[index + requested.length - 1]!.end,
    );
    if (span.length > 2000) throw new MemoryError("QUOTE_LIMIT");
    return span;
  }
  throw new MemoryError("QUOTE_NOT_IN_SOURCE");
}
