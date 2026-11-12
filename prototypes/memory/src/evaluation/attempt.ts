import { MemoryError } from "../domain.ts";

/** Model/domain rejections are measured failures, not a reason to discard the rest of a run. */
export async function attempt<T>(
  operation: () => Promise<T>,
): Promise<{ ok: true; value: T } | { ok: false; code: string }> {
  try {
    return { ok: true, value: await operation() };
  } catch (error) {
    if (
      error instanceof MemoryError &&
      /^(TIME_|QUOTE_|EXTRACTION_|ANSWER_|MODEL_OUTPUT_INVALID|MODEL_REFUSAL|MODEL_INCOMPLETE)/u.test(
        error.message,
      )
    ) {
      return { ok: false, code: error.message };
    }
    throw error;
  }
}
