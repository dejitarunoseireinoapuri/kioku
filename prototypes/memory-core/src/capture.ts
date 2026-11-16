import type { Draft, EventTime } from "./contracts.ts";
import type { Runtime, Snapshot, Unit } from "./model.ts";
import { requireThat } from "./errors.ts";
import { allocate, assertAcyclic, current, project } from "./catalog.ts";
import { validateDraft } from "./evidence.ts";

function eventTime(unit: Draft["units"][number]): EventTime {
  const { precision, value, end } = unit.time;
  return { precision, value, end };
}

export function sameContentMeaning(
  previous: Unit,
  draft: Draft["units"][number],
): void {
  const { text: ignoredPrevious, ...left } = previous.content;
  const { text: ignoredDraft, ...right } = draft.content;
  void ignoredPrevious;
  void ignoredDraft;
  requireThat(
    JSON.stringify(left) === JSON.stringify(right),
    "scope_unresolved",
  );
}

export interface Replacement {
  unit: Unit;
  preserveTime: boolean;
  kind: "correction" | "enrichment";
}

/** Receives a reviewed interpretation, not natural language from an untrusted caller. */
export function capture(
  state: Snapshot,
  draft: Draft,
  runtime: Runtime,
  replacement?: Replacement,
): string[] {
  validateDraft(draft, Boolean(replacement));
  const sourceId = allocate(state, runtime);
  state.sources[sourceId] = {
    id: sourceId,
    kind: replacement?.kind ?? "capture",
    recordedAt: runtime.now(),
    zone: draft.zone,
    length: draft.text.length,
  };
  const ids = materializeUnits(state, draft, runtime, replacement);
  const fragments = materializeFragments(state, draft, sourceId, ids, runtime);
  for (const item of draft.units) {
    const id = ids.get(item.key)!;
    const occurrenceId = allocate(state, runtime);
    state.occurrences[occurrenceId] = {
      id: occurrenceId,
      unitId: id,
      sourceId,
      fragmentIds: fragments
        .filter((f) => f.owners.includes(id))
        .map((f) => f.id),
    };
    const unit = state.units[id]!;
    if (!item.existing && !replacement?.preserveTime) {
      const index = item.time.fragment;
      unit.timeEvidenceId =
        index === null
          ? null
          : fragments.find((f) => f.start === draft.fragments[index]!.start)!
              .id;
    }
    project(state, id);
  }
  addRelations(state, draft, ids, runtime);
  assertAcyclic(state);
  return [...ids.values()];
}

function materializeUnits(
  state: Snapshot,
  draft: Draft,
  runtime: Runtime,
  replacement?: Replacement,
): Map<string, string> {
  const ids = new Map<string, string>();
  for (const item of draft.units) {
    if (item.existing) {
      requireThat(!replacement);
      const unit = current(state, item.existing);
      sameContentMeaning(unit, item);
      requireThat(
        JSON.stringify(unit.time) === JSON.stringify(eventTime(item)),
        "scope_unresolved",
      );
      requireThat(![...ids.values()].includes(unit.id));
      ids.set(item.key, unit.id);
      continue;
    }
    const id = replacement?.unit.id ?? allocate(state, runtime);
    requireThat(!ids.size || !replacement);
    ids.set(item.key, id);
    state.units[id] = {
      id,
      revision: (replacement?.unit.revision ?? 0) + 1,
      membershipRevision: 0,
      content: structuredClone(item.content),
      time: replacement?.preserveTime ? replacement.unit.time : eventTime(item),
      timeEvidenceId: replacement?.preserveTime
        ? replacement.unit.timeEvidenceId
        : null,
      recordedAt: replacement?.unit.recordedAt ?? runtime.now(),
      updatedAt: runtime.now(),
    };
  }
  return ids;
}

function materializeFragments(
  state: Snapshot,
  draft: Draft,
  sourceId: string,
  ids: Map<string, string>,
  runtime: Runtime,
) {
  return draft.fragments.flatMap((part) => {
    if (part.role === "replaced") return [];
    const id = allocate(state, runtime);
    const fragment = {
      id,
      sourceId,
      start: part.start,
      end: part.end,
      text: draft.text.slice(part.start, part.end),
      role: part.role,
      owners: part.owners.map((key) => ids.get(key)!),
    };
    state.fragments[id] = fragment;
    return [fragment];
  });
}

function addRelations(
  state: Snapshot,
  draft: Draft,
  ids: Map<string, string>,
  runtime: Runtime,
): void {
  for (const proposed of draft.relations) {
    const from = ids.get(proposed.from);
    const to =
      "key" in proposed.to
        ? ids.get(proposed.to.key)
        : current(state, proposed.to).id;
    requireThat(from && to && from !== to);
    if (
      Object.values(state.relations).some(
        (r) => r.from === from && r.to === to && r.kind === proposed.kind,
      )
    )
      continue;
    const id = allocate(state, runtime);
    state.relations[id] = { id, from, to, kind: proposed.kind };
  }
}
