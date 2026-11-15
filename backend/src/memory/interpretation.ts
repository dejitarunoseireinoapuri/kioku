import { MemoryEngine } from "#memory-core/engine";
import { MemoryError } from "#memory-core/domain";
import type { Extraction, Turn } from "#memory-core/domain";

const uncertainMeaning = new Set([
  "TIME_UNSUPPORTED_PRECISION",
  "TIME_VALUE_NOT_SUPPORTED",
  "TIME_INVALID_DATE",
  "CAPTURE_REFINEMENT_REJECTED",
]);

/** A rejected interpretation is not a saved fact or evidence that the owner misspelled it. */
export async function interpretCapture(
  engine: MemoryEngine,
  turn: Turn,
  clarification: string | null = null,
): Promise<Extraction> {
  try {
    return await engine.tell(turn, clarification);
  } catch (error) {
    if (!(error instanceof MemoryError) || !uncertainMeaning.has(error.message))
      throw error;
    return {
      status: "needs_clarification",
      clarification:
        "No he podido interpretar el recuerdo con seguridad. Reescríbelo en una frase completa, separando las palabras y aclarando las fechas si las hay.",
      items: [],
    };
  }
}
