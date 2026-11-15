import type { z } from "zod";
import type { Turn } from "./domain.ts";
import type { captureFormat } from "./capture-format.ts";
import { canonicalizeCapture } from "./capture-normalization.ts";
type Format = ReturnType<typeof captureFormat>;
type Draft = z.infer<Format["schema"]>;

/** The independent review sees canonical metadata, not a candidate modified after approval. */
export function prepareCaptureReview(
  draft: Draft,
  format: Format,
  turn: Turn,
  clarification: string | null,
) {
  try {
    const source = clarification
      ? `${turn.text}\nAclaración: ${clarification}`
      : turn.text;
    const { extraction, changed } = canonicalizeCapture(
      format.materialize(draft),
      source,
      turn,
      clarification,
    );
    const prepared: Draft = {
      ...draft,
      items: draft.items.map((item, index) => {
        const time = extraction.items[index]!.time;
        return {
          ...item,
          time: {
            precision: time.precision,
            value: time.value,
            end: time.end,
            evidenceId:
              time.precision === "unknown" ? null : item.time.evidenceId,
            evidenceText: time.precision === "unknown" ? null : time.quote,
          },
        };
      }),
    };
    return {
      draft: prepared,
      normalizationApplied: changed,
      validationIssues: [] as string[],
    };
  } catch {
    return {
      draft,
      normalizationApplied: false,
      validationIssues: ["literal-or-time-validation"],
    };
  }
}
