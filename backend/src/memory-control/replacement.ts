import { z } from "zod";
import { snapshotSchema } from "#memory-core/domain";
import type { Snapshot } from "#memory-core/domain";
import { AccountError } from "../account/contracts.js";

/** Persistence accepts prepared canonical data only; it cannot invent arbitrary paths. */
export function validateReplacement(
  value: Snapshot,
  retiredId: string,
): Snapshot {
  const parsed = snapshotSchema.safeParse(value);
  if (!parsed.success) throw new AccountError("failed-precondition");
  const snapshot = parsed.data;
  const sourceIds = new Set(snapshot.sources.map((source) => source.id));
  const memoryIds = new Set(snapshot.memories.map((memory) => memory.id));
  if (
    snapshot.sources.length > 2 ||
    snapshot.memories.length > 16 ||
    sourceIds.has(retiredId) ||
    sourceIds.size !== snapshot.sources.length ||
    memoryIds.size !== snapshot.memories.length ||
    snapshot.sources.some(
      (source) =>
        !z.uuid().safeParse(source.id).success ||
        source.text.length > 10_020 ||
        snapshot.memories.filter((memory) => memory.sourceId === source.id)
          .length < 1 ||
        snapshot.memories.filter((memory) => memory.sourceId === source.id)
          .length > 8,
    ) ||
    snapshot.memories.some((memory) => {
      const source = snapshot.sources.find(
        (item) => item.id === memory.sourceId,
      );
      return (
        !source ||
        !source.text.includes(memory.quote) ||
        memory.vector.length !== 512 ||
        !Number.isSafeInteger(memory.revision) ||
        source.zone !== memory.zone ||
        source.receivedAt !== memory.receivedAt ||
        !Array.from(
          { length: 8 },
          (_, index) => `${source.id}-${index + 1}`,
        ).includes(memory.id)
      );
    })
  )
    throw new AccountError("failed-precondition");
  return snapshot;
}
