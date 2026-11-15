import { isDeepStrictEqual } from "node:util";
import type { Snapshot } from "#memory-core/domain";
import { AccountError } from "../account/contracts.js";
import type { ChangeInput } from "./contracts.js";
import type { MemoryInventory, ForgetReplacement } from "./forget-contracts.js";
import { forgetLimits } from "./forget-contracts.js";
import { scopeVersion } from "./retirement.js";
import { validateReplacement } from "./replacement.js";
import { separateForgetEvidence } from "./forget-evidence.js";

function normalize(snapshot: Snapshot) {
  return {
    sources: snapshot.sources.map(({ id: _id, ...source }) => source),
    memories: snapshot.memories.map(
      ({ id: _id, sourceId: _sourceId, ...memory }) => memory,
    ),
  };
}

/** The storage boundary independently verifies a literal-preserving transformation of its inventory. */
export function validateForgetChanges(
  input: ChangeInput,
  inventory: MemoryInventory,
  changes: ForgetReplacement[],
  now: number,
) {
  if (
    input.action !== "forget" ||
    input.forgetScope !== "allOccurrences" ||
    !changes.length ||
    changes.length > forgetLimits.affectedSources ||
    new Set(changes.map((c) => c.bundle.source.id)).size !== changes.length
  )
    throw new AccountError("invalid-argument");
  for (const change of changes) {
    const id = change.bundle.source.id;
    const original = inventory.snapshot.sources.find(
      (source) => source.id === id,
    );
    const memories = inventory.snapshot.memories.filter(
      (memory) => memory.sourceId === id,
    );
    const version = inventory.versions.find(
      (v) => v.collection === "sources" && v.id === id,
    )?.version;
    if (
      !original ||
      !isDeepStrictEqual(original, change.bundle.source) ||
      !isDeepStrictEqual(memories, change.bundle.memories) ||
      change.bundle.scope.sourceId !== id ||
      change.bundle.scope.sourceVersion !== version ||
      change.bundle.memoryEpoch !== inventory.memoryEpoch ||
      change.bundle.scope.expiresAtMs <= now ||
      change.bundle.scope.expiresAtMs > now + 300_000 ||
      change.bundle.scope.memories.length !== memories.length ||
      change.bundle.scope.memories.some(
        (item) =>
          !inventory.versions.some(
            (v) =>
              v.collection === "memories" &&
              v.id === item.id &&
              v.version === item.version &&
              memories.some((memory) => memory.id === item.id),
          ),
      )
    )
      throw new AccountError("failed-precondition");
    if (
      id === input.sourceId &&
      (scopeVersion(change.bundle.scope) !== input.expectedVersion ||
        input.memoryIds.some((target) => !change.selectedIds.includes(target)))
    )
      throw new AccountError("failed-precondition");
    const prepared = validateReplacement(change.snapshot, id);
    const expected = separateForgetEvidence(
      original,
      memories,
      change.selectedIds,
      change.evidence,
    ).replacement;
    if (!isDeepStrictEqual(normalize(prepared), normalize(expected)))
      throw new AccountError("failed-precondition");
  }
  if (!changes.some((c) => c.bundle.source.id === input.sourceId))
    throw new AccountError("failed-precondition");
}
