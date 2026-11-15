import type { MemoryIntelligence } from "#memory-core/domain";
import type { CaptureStage } from "./diagnostics.js";

/** Observe real boundaries without exposing provider types or retaining their input/output. */
export function observedCapture(
  ai: MemoryIntelligence,
  stage: (value: CaptureStage) => void,
): MemoryIntelligence {
  return {
    extract: async (...args) => {
      stage("interpretation");
      const result = await ai.extract(...args);
      stage("validation");
      return result;
    },
    ...(ai.refineCapture
      ? {
          refineCapture: async (
            ...args: Parameters<
              NonNullable<MemoryIntelligence["refineCapture"]>
            >
          ) => {
            stage("time-text-review");
            const result = await ai.refineCapture!(...args);
            stage("validation");
            return result;
          },
        }
      : {}),
    embed: async (...args) => {
      stage("embedding");
      const result = await ai.embed(...args);
      stage("validation");
      return result;
    },
    answer: (...args) => ai.answer(...args),
  };
}
