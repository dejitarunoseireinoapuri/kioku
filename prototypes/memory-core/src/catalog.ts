import { requireThat } from "./errors.ts";
import type { Reference } from "./contracts.ts";
import type { Runtime, Snapshot, Unit } from "./model.ts";

export function current(state: Snapshot, ref: Reference): Unit {
  const unit = state.units[ref.id];
  requireThat(unit && unit.revision === ref.revision, "stale_version");
  requireThat(!state.revocations[ref.id], "stale_version");
  return unit;
}

export function allocate(state: Snapshot, runtime: Runtime): string {
  const id = runtime.id();
  requireThat(/^[0-9a-f-]{36}$/u.test(id), "invalid_input");
  for (const table of [
    state.units,
    state.sources,
    state.fragments,
    state.occurrences,
    state.relations,
    state.revocations,
  ]) {
    requireThat(!Object.hasOwn(table, id));
  }
  return id;
}

export function terms(text: string): string[] {
  return [
    ...new Set(
      text
        .toLocaleLowerCase("es")
        .normalize("NFD")
        .replace(/\p{M}/gu, "")
        .match(/[\p{L}\p{N}]+/gu) ?? [],
    ),
  ].sort();
}

export function project(state: Snapshot, id: string): void {
  const unit = state.units[id];
  requireThat(unit);
  state.projections[id] = {
    unitId: id,
    revision: unit.revision,
    terms: terms(
      Object.values(unit.content)
        .filter((v) => typeof v === "string")
        .join(" "),
    ),
  };
}

export function requiredClosure(state: Snapshot, selected: string[]): string[] {
  const ids = new Set(selected),
    queue = [...selected];
  const edges = Object.values(state.relations).filter(
    (r) => r.kind === "requires",
  );
  for (let i = 0; i < queue.length; i++) {
    for (const edge of edges) {
      if (edge.to === queue[i] && !ids.has(edge.from)) {
        ids.add(edge.from);
        queue.push(edge.from);
      }
    }
  }
  return [...ids].sort();
}

export function assertAcyclic(state: Snapshot): void {
  const edges = Object.values(state.relations).filter(
    (r) => r.kind === "requires",
  );
  const active = new Set<string>(),
    visited = new Set<string>();
  function visit(id: string, depth: number): void {
    requireThat(depth <= 32, "scope_too_large");
    requireThat(!active.has(id));
    if (visited.has(id)) return;
    active.add(id);
    for (const edge of edges.filter((edge) => edge.from === id))
      visit(edge.to, depth + 1);
    active.delete(id);
    visited.add(id);
  }
  for (const edge of edges) visit(edge.from, 0);
}

/** Refresh membership only, never rewrite an unaffected unit's semantic content. */
export function refreshMembership(before: Snapshot, next: Snapshot): void {
  for (const unit of Object.values(next.units)) {
    const membership = (state: Snapshot) =>
      JSON.stringify({
        occurrences: Object.values(state.occurrences).filter(
          (o) => o.unitId === unit.id,
        ),
        relations: Object.values(state.relations).filter(
          (r) => r.from === unit.id || r.to === unit.id,
        ),
      });
    const previous = before.units[unit.id];
    unit.membershipRevision = previous
      ? previous.membershipRevision +
        Number(membership(before) !== membership(next))
      : 1;
  }
}
