import { randomUUID } from "node:crypto";
import {
  memorySchema,
  sourceSchema,
  snapshotVersion,
} from "#memory-core/domain";
import type { Memory, Snapshot, Source } from "#memory-core/domain";
import { AccountError } from "../account/contracts.js";

export const retainedNotice =
  "[Texto conservado tras un cambio solicitado por ti]\n";
export const correctionNotice = "[Fragmento de una corrección tuya]\n";
const removedNotice = "\n[Fragmento retirado]\n";

export interface SelectiveChange {
  readonly source: Source;
  readonly removed: Memory[];
  readonly kept: Memory[];
  readonly replacement: Snapshot;
}

/** Only literal evidence is removed. Everything outside those spans stays byte-for-byte.
 * Semantic authorization and checking for duplicated facts are separate, mandatory steps.
 */
export function selectiveChange(
  source: Source,
  memories: Memory[],
  ids: string[],
): SelectiveChange {
  if (
    !ids.length ||
    new Set(ids).size !== ids.length ||
    memories.length > 8 ||
    !memories.length ||
    memories.some((memory) => memory.sourceId !== source.id) ||
    ids.some((id) => !memories.some((memory) => memory.id === id))
  )
    throw new AccountError("failed-precondition");
  const removed = memories.filter((memory) => ids.includes(memory.id));
  const kept = memories.filter((memory) => !ids.includes(memory.id));
  if (!kept.length)
    return {
      source,
      removed,
      kept,
      replacement: { version: snapshotVersion, sources: [], memories: [] },
    };
  const spans: { start: number; end: number }[] = [];
  for (const memory of removed) {
    let start = source.text.indexOf(memory.quote);
    if (start < 0) throw new AccountError("failed-precondition");
    while (start >= 0) {
      spans.push({ start, end: start + memory.quote.length });
      start = source.text.indexOf(memory.quote, start + memory.quote.length);
    }
  }
  spans.sort((left, right) => left.start - right.start);
  const merged: typeof spans = [];
  for (const span of spans) {
    const last = merged.at(-1);
    if (last && span.start <= last.end) last.end = Math.max(last.end, span.end);
    else merged.push({ ...span });
  }
  let text = "",
    offset = 0;
  for (const span of merged) {
    text += source.text.slice(offset, span.start) + removedNotice;
    offset = span.end;
  }
  text += source.text.slice(offset);
  if (!text.startsWith(retainedNotice)) text = retainedNotice + text;
  if (
    text.length > 10_020 ||
    kept.some(
      (memory) =>
        occurrences(text, memory.quote) !==
        occurrences(source.text, memory.quote),
    )
  )
    throw new AccountError("failed-precondition");
  const nextSource = sourceSchema.parse({ ...source, id: randomUUID(), text });
  const next = kept.map((memory, index) =>
    memorySchema.parse({
      ...memory,
      id: `${nextSource.id}-${index + 1}`,
      sourceId: nextSource.id,
      revision: memory.revision + 1,
    }),
  );
  return {
    source,
    removed,
    kept,
    replacement: {
      version: snapshotVersion,
      sources: [nextSource],
      memories: next,
    },
  };
}

function occurrences(text: string, quote: string): number {
  if (!quote) throw new AccountError("failed-precondition");
  return text.split(quote).length - 1;
}

export function literalFact(text: string, fact: string): string {
  if (
    !fact.trim() ||
    fact.length > 2000 ||
    !text.includes(fact) ||
    /sk-[A-Za-z0-9_-]{20,}/u.test(fact)
  )
    throw new AccountError("failed-precondition");
  return fact;
}
