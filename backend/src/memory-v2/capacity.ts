import type { Snapshot } from "#memory-v2/src/model";
import { requiredClosure } from "#memory-v2/src/catalog";
import { forget } from "#memory-v2/src/removal";
import { changeSize } from "#memory-v2/src/invariants";
import { AccountError } from "../account/contracts.js";
import type { MemoryGroup } from "./records.js";

/** Include management aliases and pending-work cleanup in future deletion capacity. */
export function checkStorageCapacity(state: Snapshot, groups: MemoryGroup[]) {
  if (groups.length > 4096) throw new AccountError("resource-exhausted");
  for (const unit of Object.values(state.units)) {
    const ids = requiredClosure(state, [unit.id]);
    const affected = groups.filter((g) =>
      g.unitIds.some((id) => ids.includes(id)),
    );
    const removed = structuredClone(state);
    forget(removed, ids, "capacity-check");
    const size = changeSize(state, removed);
    if (
      affected.length > 128 ||
      size.writes + affected.length * 2 + 20 > 400 ||
      size.bytes + 64_000 > 2 * 1024 * 1024
    )
      throw new AccountError("resource-exhausted");
  }
}
