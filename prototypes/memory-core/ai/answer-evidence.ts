import type { MemoryPrototype } from "../src/memory.ts";
import { InterpretationError } from "./contracts.ts";

/** Provider view of current owned support, not a partial reconstruction of a source. */
export function answerEvidenceView(
  items: ReturnType<MemoryPrototype["evidence"]>["items"],
) {
  return items.map(({ unit, fragments, sources, mentionCount }, index) => {
    if (!fragments.length || fragments.some((f) => !f.owners.includes(unit.id)))
      throw new InterpretationError("ANSWER_SUPPORT_OWNERSHIP");
    if (fragments.some((f) => !sources.some((s) => s.id === f.sourceId)))
      throw new InterpretationError("ANSWER_SUPPORT_SOURCE");
    return {
      index,
      content: unit.content,
      time: unit.time,
      recordedAt: unit.recordedAt,
      updatedAt: unit.updatedAt,
      mentionCount,
      supports: sources.map((source) => ({
        recordedAt: source.recordedAt,
        zone: source.zone,
        fragments: fragments
          .filter((f) => f.sourceId === source.id)
          .sort((a, b) => a.start - b.start)
          .map((f) => ({
            text: f.text,
            role: f.role,
            eventTimeAnchor: f.id === unit.timeEvidenceId,
          })),
      })),
    };
  });
}
