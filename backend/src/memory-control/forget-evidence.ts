import { forgetEvidenceSchema } from "#memory-core/forget-format";
import type { ForgetEvidence } from "#memory-core/forget-format";
import type { Memory, Source } from "#memory-core/domain";
import { AccountError } from "../account/contracts.js";
import { selectiveChange } from "./selection.js";

/** Only narrow existing literal evidence; semantic facts, time values and vectors never change.
 * Both preparation and the persistence boundary run this exact deterministic transformation.
 * A separate semantic review must still approve preservation and absence of the forgotten fact.
 */
export function separateForgetEvidence(
  source: Source,
  memories: Memory[],
  selectedIds: string[],
  evidence: ForgetEvidence[] = [],
) {
  if (
    evidence.length > 8 ||
    new Set(evidence.map((item) => item.memoryId)).size !== evidence.length
  )
    throw new AccountError("failed-precondition");
  const narrowed = new Map<string, ForgetEvidence>();
  for (const value of evidence) {
    const parsed = forgetEvidenceSchema.safeParse(value);
    const original = memories.find((item) => item.id === value.memoryId);
    if (
      !parsed.success ||
      !original ||
      !isNarrowing(original.quote, value.quote) ||
      !isNarrowing(original.time.quote, value.timeQuote) ||
      !isNarrowing(original.attributionEvidence, value.attributionEvidence)
    )
      throw new AccountError("failed-precondition");
    narrowed.set(value.memoryId, parsed.data);
  }
  const units = memories.map((memory) => {
    const edit = narrowed.get(memory.id);
    return edit
      ? {
          ...memory,
          quote: edit.quote,
          time: { ...memory.time, quote: edit.timeQuote },
          attributionEvidence: edit.attributionEvidence,
        }
      : memory;
  });
  const change = selectiveChange(source, units, selectedIds);
  const retained = change.replacement.sources[0]?.text ?? "";
  for (const memory of change.kept) {
    for (const quote of [
      memory.quote,
      memory.time.quote,
      memory.attributionEvidence,
    ]) {
      if (
        quote !== null &&
        (!source.text.includes(quote) || !retained.includes(quote))
      )
        throw new AccountError("failed-precondition");
    }
  }
  return change;
}

function isNarrowing(original: string | null, next: string | null) {
  return original === null
    ? next === null
    : next !== null && Boolean(next.trim()) && original.includes(next);
}
