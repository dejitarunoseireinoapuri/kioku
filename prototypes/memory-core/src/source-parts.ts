import type { Draft } from "./contracts.ts";
import type { Runtime, Snapshot, SourceEnvelope } from "./model.ts";
import { allocate } from "./catalog.ts";
import { requireThat } from "./errors.ts";

export function createSourceParts(
  state: Snapshot,
  draft: Draft,
  runtime: Runtime,
  kind: SourceEnvelope["kind"],
) {
  const turns = draft.interventions ?? [
    {
      start: 0,
      end: draft.text.length,
      recordedAt: runtime.now(),
      zone: draft.zone,
    },
  ];
  return turns.map((turn) => {
    requireThat(turn.recordedAt <= runtime.now(), "invalid_input");
    const id = allocate(state, runtime);
    state.sources[id] = {
      id,
      kind,
      recordedAt: turn.recordedAt,
      zone: turn.zone,
      length: turn.end - turn.start,
    };
    return { ...turn, id };
  });
}

export function materializeSourceParts(
  state: Snapshot,
  draft: Draft,
  sources: ReturnType<typeof createSourceParts>,
  ids: Map<string, string>,
  runtime: Runtime,
) {
  const fragments = draft.fragments.flatMap((part, draftIndex) => {
    if (part.role === "replaced") return [];
    const role = part.role;
    return sources.flatMap((source) => {
      const start = Math.max(part.start, source.start),
        end = Math.min(part.end, source.end);
      if (start >= end) return [];
      const id = allocate(state, runtime);
      const fragment = {
        id,
        sourceId: source.id,
        start: start - source.start,
        end: end - source.start,
        text: draft.text.slice(start, end),
        role,
        owners: part.owners.map((key) => ids.get(key)!),
      };
      state.fragments[id] = fragment;
      return [{ fragment, draftIndex }];
    });
  });
  for (const source of sources) {
    const parts = fragments.filter((f) => f.fragment.sourceId === source.id);
    if (!parts.length) {
      delete state.sources[source.id];
      continue;
    }
    for (const id of ids.values()) {
      const fragmentIds = parts
        .filter((f) => f.fragment.owners.includes(id))
        .map((f) => f.fragment.id);
      if (!fragmentIds.length) continue;
      const occurrenceId = allocate(state, runtime);
      state.occurrences[occurrenceId] = {
        id: occurrenceId,
        unitId: id,
        sourceId: source.id,
        fragmentIds,
      };
    }
  }
  return fragments;
}
