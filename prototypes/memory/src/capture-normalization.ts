import { extractionSchema, MemoryError } from "./domain.ts";
import type { Extraction, MemoryIntelligence, Turn } from "./domain.ts";
import { canonicalTime, unknownTime } from "./temporal.ts";
import { literalQuote } from "./literal.ts";

/** Canonical time must never replace one fact's text with a broader, shared evidence sentence. */
export function canonicalizeCapture(
  parsed: Extraction,
  source: string,
  turn: Turn,
  clarification: string | null,
) {
  let changed = false;
  const normalized: Extraction = {
    ...parsed,
    items: parsed.items.map((item) => {
      const quote = literalQuote(item.quote, source);
      const time =
        item.provenance === "quoted"
          ? unknownTime
          : canonicalTime(item.time, quote, source, {
              receivedAt: turn.receivedAt,
              zone: turn.zone,
              clarification,
            });
      changed ||=
        time.precision !== item.time.precision ||
        time.value !== item.time.value ||
        time.end !== item.time.end;
      return {
        ...item,
        quote,
        time,
        eventStatus:
          item.provenance === "quoted" ? "unspecified" : item.eventStatus,
      };
    }),
  };
  return { extraction: normalized, changed };
}

export async function normalizeCapture(
  parsed: Extraction,
  source: string,
  turn: Turn,
  intelligence: MemoryIntelligence,
  clarification: string | null,
): Promise<Extraction> {
  const { extraction: normalized, changed } = canonicalizeCapture(
    parsed,
    source,
    turn,
    clarification,
  );
  if (!changed || parsed.status !== "saved") return normalized;
  if (!intelligence.refineCapture)
    throw new MemoryError("CAPTURE_TIME_TEXT_REVIEW_REQUIRED");
  const refined = extractionSchema.parse(
    await intelligence.refineCapture({ ...turn, text: source }, normalized),
  );
  const metadata = (value: Extraction) =>
    JSON.stringify({
      ...value,
      items: value.items.map(({ text: _text, ...item }) => item),
    });
  if (metadata(refined) !== metadata(normalized))
    throw new MemoryError("CAPTURE_REFINEMENT_CHANGED_EVIDENCE");
  return refined;
}
