import { limits } from "./contracts.ts";
import type { Snapshot } from "./model.ts";
import { assertAcyclic, project, requiredClosure } from "./catalog.ts";
import { requireThat } from "./errors.ts";
import { forget } from "./removal.ts";

export function validateSnapshot(state: Snapshot): void {
  requireThat(
    Object.keys(state.units).length <= limits.catalogUnits,
    "scope_too_large",
  );
  requireThat(
    tables.reduce((sum, key) => sum + Object.keys(state[key]).length, 0) <=
      limits.catalogDocuments,
    "scope_too_large",
  );
  for (const unit of Object.values(state.units)) {
    requireThat(!state.revocations[unit.id]);
    const owned = Object.values(state.fragments).filter((f) =>
      f.owners.includes(unit.id),
    );
    requireThat(owned.some((f) => f.role === "primary"));
    if (unit.time.precision !== "unknown") {
      const evidence =
        unit.timeEvidenceId === null
          ? undefined
          : state.fragments[unit.timeEvidenceId];
      requireThat(
        evidence?.role === "time" && evidence.owners.includes(unit.id),
      );
    } else requireThat(unit.timeEvidenceId === null);
    const expected: Snapshot = { ...state, projections: {} };
    project(expected, unit.id);
    requireThat(
      JSON.stringify(state.projections[unit.id]) ===
        JSON.stringify(expected.projections[unit.id]),
    );
  }
  for (const fragment of Object.values(state.fragments)) {
    requireThat(state.sources[fragment.sourceId] && fragment.owners.length > 0);
    requireThat(fragment.text.length === fragment.end - fragment.start);
    requireThat(new Set(fragment.owners).size === fragment.owners.length);
    for (const owner of fragment.owners) {
      requireThat(state.units[owner]);
      requireThat(
        Object.values(state.occurrences).filter(
          (o) =>
            o.unitId === owner &&
            o.sourceId === fragment.sourceId &&
            o.fragmentIds.includes(fragment.id),
        ).length === 1,
      );
    }
  }
  for (const occurrence of Object.values(state.occurrences)) {
    requireThat(
      state.units[occurrence.unitId] && state.sources[occurrence.sourceId],
    );
    requireThat(occurrence.fragmentIds.length > 0);
    for (const id of occurrence.fragmentIds) {
      const fragment = state.fragments[id];
      requireThat(
        fragment?.sourceId === occurrence.sourceId &&
          fragment.owners.includes(occurrence.unitId),
      );
    }
  }
  for (const source of Object.values(state.sources)) {
    const parts = Object.values(state.fragments)
      .filter((f) => f.sourceId === source.id)
      .sort((a, b) => a.start - b.start);
    requireThat(parts.length > 0);
    let end = 0;
    for (const part of parts) {
      requireThat(part.start >= end && part.end <= source.length);
      end = part.end;
    }
  }
  for (const relation of Object.values(state.relations)) {
    requireThat(
      state.units[relation.from] &&
        state.units[relation.to] &&
        relation.from !== relation.to,
    );
  }
  requireThat(Object.keys(state.projections).every((id) => state.units[id]));
  assertAcyclic(state);
}

const tables = [
  "units",
  "sources",
  "fragments",
  "occurrences",
  "relations",
  "projections",
  "revocations",
  "admissions",
  "receipts",
] as const;

export function changeSize(
  before: Snapshot,
  next: Snapshot,
): { writes: number; bytes: number } {
  let writes = 1,
    bytes = 128; // Account epoch is also written.
  for (const name of tables) {
    for (const id of new Set([
      ...Object.keys(before[name]),
      ...Object.keys(next[name]),
    ])) {
      const previous = JSON.stringify(before[name][id]),
        value = JSON.stringify(next[name][id]);
      if (previous === value) continue;
      writes++;
      bytes += new TextEncoder().encode(
        `${id}${previous ?? ""}${value ?? ""}`,
      ).length;
    }
  }
  return { writes, bytes };
}

export function checkChangeLimits(before: Snapshot, next: Snapshot): void {
  const size = changeSize(before, next);
  requireThat(
    size.writes <= limits.writes && size.bytes <= limits.changeBytes,
    "scope_too_large",
  );
}

/** Admission must not create a catalog whose required deletion already exceeds capacity. */
export function checkManageability(state: Snapshot): void {
  for (const unit of Object.values(state.units)) {
    requireThat(
      Object.values(state.fragments).filter((f) => f.owners.includes(unit.id))
        .length <= limits.fragmentsPerTurn,
      "scope_too_large",
    );
    const ids = requiredClosure(state, [unit.id]);
    requireThat(ids.length <= limits.affectedUnits, "scope_too_large");
    const count = Object.values(state.occurrences).filter((o) =>
      ids.includes(o.unitId),
    ).length;
    requireThat(count <= limits.occurrences, "scope_too_large");
    const removed = structuredClone(state);
    forget(removed, ids, "capacity-check");
    const size = changeSize(state, removed);
    // Reserve space for receipt, durable admission and metadata finalization.
    requireThat(
      size.writes + 4 <= limits.writes &&
        size.bytes + 4096 <= limits.changeBytes,
      "scope_too_large",
    );
  }
}
