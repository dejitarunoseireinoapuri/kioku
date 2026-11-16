import type { Draft, EventTime } from "./contracts.ts";
import type { Runtime, Snapshot, Unit } from "./model.ts";
import { requireThat } from "./errors.ts";
import { allocate, assertAcyclic, current, project } from "./catalog.ts";
import { validateDraft } from "./evidence.ts";
import { createSourceParts, materializeSourceParts } from "./source-parts.ts";

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
  requireThat(!replacement || !draft.interventions, "invalid_input");
  validateDraft(draft, Boolean(replacement) || Boolean(draft.interventions));
  const sources = createSourceParts(
    state,
    draft,
    runtime,
    replacement?.kind ?? "capture",
  );
  const ids = materializeUnits(state, draft, runtime, replacement);
  const fragments = materializeSourceParts(state, draft, sources, ids, runtime);
  for (const item of draft.units) {
    const id = ids.get(item.key)!;
    const unit = state.units[id]!;
    if (!item.existing && !replacement?.preserveTime) {
      const index = item.time.fragment;
      unit.timeEvidenceId =
        index === null
          ? null
          : fragments.find((f) => f.draftIndex === index)!.fragment.id;
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
