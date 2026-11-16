import type { Reference } from "./contracts.ts";
import type { Snapshot } from "./model.ts";
import { current, requiredClosure } from "./catalog.ts";
import { requireThat } from "./errors.ts";

export interface ScopeQuestion {
  status: "needs_scope";
  reason: "dependent_memory" | "possible_duplicate";
  refs: Reference[];
}

export function resolveScope(
  state: Snapshot,
  targets: Reference[],
  excludeMatches: Reference[],
): string[] | ScopeQuestion {
  const ids = targets.map((ref) => current(state, ref).id);
  const excluded = excludeMatches.map((ref) => current(state, ref).id);
  requireThat(new Set(ids).size === ids.length, "invalid_input");
  requireThat(
    new Set(excluded).size === excluded.length &&
      !ids.some((id) => excluded.includes(id)),
    "invalid_input",
  );
  const dependent = requiredClosure(state, ids).filter(
    (id) => !ids.includes(id),
  );
  if (dependent.length) return question(state, dependent, "dependent_memory");
  const possible = Object.values(state.relations)
    .filter((r) => r.kind === "possibleSameAs")
    .flatMap((r) =>
      ids.includes(r.from) ? [r.to] : ids.includes(r.to) ? [r.from] : [],
    )
    .filter((id) => !ids.includes(id));
  requireThat(
    excluded.every((id) => possible.includes(id)),
    "invalid_input",
  );
  const unresolved = [...new Set(possible)].filter(
    (id) => !excluded.includes(id),
  );
  return unresolved.length
    ? question(state, unresolved, "possible_duplicate")
    : ids;
}

function question(
  state: Snapshot,
  ids: string[],
  reason: ScopeQuestion["reason"],
): ScopeQuestion {
  return {
    status: "needs_scope",
    reason,
    refs: ids.map((id) => ({ id, revision: state.units[id]!.revision })),
  };
}

/** Remove exact ownership; shared context survives only for its remaining owners. */
export function removeSupport(
  state: Snapshot,
  ids: string[],
  keepTimeId?: string | null,
): void {
  for (const fragment of Object.values(state.fragments)) {
    if (fragment.id === keepTimeId) continue;
    fragment.owners = fragment.owners.filter((id) => !ids.includes(id));
    if (!fragment.owners.length) delete state.fragments[fragment.id];
  }
  for (const occurrence of Object.values(state.occurrences)) {
    occurrence.fragmentIds = occurrence.fragmentIds.filter((id) =>
      state.fragments[id]?.owners.includes(occurrence.unitId),
    );
    if (!occurrence.fragmentIds.length) delete state.occurrences[occurrence.id];
  }
  const sources = new Set(
    Object.values(state.fragments).map((f) => f.sourceId),
  );
  for (const id of Object.keys(state.sources))
    if (!sources.has(id)) delete state.sources[id];
  for (const relation of Object.values(state.relations)) {
    if (ids.includes(relation.from) || ids.includes(relation.to))
      delete state.relations[relation.id];
  }
}

export function forget(
  state: Snapshot,
  ids: string[],
  requestId: string,
): void {
  removeSupport(state, ids);
  for (const id of ids) {
    const unit = state.units[id]!;
    state.revocations[id] = {
      operationId: requestId,
      epoch: state.epoch + 1,
      revision: unit.revision,
    };
    delete state.units[id];
    delete state.projections[id];
  }
}
