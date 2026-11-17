import { AccountError } from "../account/contracts.js";
import { privateDigest } from "./state-store.js";
import type { LoadedState } from "./state-store.js";

/** A versioned view of one unit, without another stored copy of memory. */
export function unitGroup(loaded: LoadedState, unitId: string) {
  const unit = loaded.state.units[unitId];
  if (!unit) throw new AccountError("failed-precondition");
  const hash = privateDigest([
    "management-unit",
    loaded.runtime.generation,
    unit.id,
    unit.revision,
    unit.membershipRevision,
  ]);
  const id = `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
  return { id, unitIds: [unitId], recordedAt: unit.recordedAt, changed: true };
}

export function managementGroup(loaded: LoadedState, id: string) {
  return (
    loaded.groups.find((g) => g.id === id) ??
    Object.keys(loaded.state.units)
      .map((unitId) => unitGroup(loaded, unitId))
      .find((g) => g.id === id)
  );
}

export function unitReplacements(before: LoadedState, after: LoadedState) {
  return Object.values(before.state.units)
    .filter((unit) => {
      const next = after.state.units[unit.id];
      return (
        !next ||
        unit.revision !== next.revision ||
        unit.membershipRevision !== next.membershipRevision
      );
    })
    .map((unit) => ({
      sourceId: unitGroup(before, unit.id).id,
      sourceIds: after.state.units[unit.id]
        ? [unitGroup(after, unit.id).id]
        : [],
    }));
}
