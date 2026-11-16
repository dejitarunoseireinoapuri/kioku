import type { Command } from "./contracts.ts";
import type { Fragment, Runtime, Snapshot, Unit } from "./model.ts";
import { allocate } from "./catalog.ts";
import { requireThat } from "./errors.ts";
import { unicodeBoundary } from "./evidence.ts";

type Correction = Extract<Command, { kind: "correct" }>;
type Range = Correction["retainedEvidence"][number];

/** Original offsets and source metadata survive; no generated text becomes a quote. */
export function retainEvidence(
  state: Snapshot,
  previous: Unit,
  command: Correction,
  runtime: Runtime,
): Set<string> {
  const grouped = new Map<string, Range[]>();
  for (const range of command.retainedEvidence) {
    const fragment = state.fragments[range.fragmentId];
    requireThat(
      fragment && fragment.owners.includes(previous.id),
      "invalid_input",
    );
    requireThat(range.start < range.end && range.end <= fragment.text.length);
    requireThat(
      unicodeBoundary(fragment.text, range.start) &&
        unicodeBoundary(fragment.text, range.end),
    );
    const ranges = grouped.get(fragment.id) ?? [];
    ranges.push(range);
    grouped.set(fragment.id, ranges);
  }
  const retained = new Set<string>();
  for (const [id, ranges] of grouped) {
    ranges.sort((a, b) => a.start - b.start);
    requireThat(ranges.every((r, i) => !i || r.start >= ranges[i - 1]!.end));
    const fragment = state.fragments[id]!;
    if (
      ranges.length === 1 &&
      ranges[0]!.start === 0 &&
      ranges[0]!.end === fragment.text.length
    ) {
      retained.add(id);
      continue;
    }
    // A shared temporal anchor cannot be split without resolving its other dependants.
    requireThat(
      !Object.values(state.units).some(
        (u) => u.id !== previous.id && u.timeEvidenceId === id,
      ),
      "scope_unresolved",
    );
    const pieces = split(state, fragment, ranges, previous.id, runtime);
    for (const piece of pieces)
      if (piece.owners.includes(previous.id)) retained.add(piece.id);
    if (command.preserveTime && previous.timeEvidenceId === id) {
      const anchors = pieces.filter((p) => p.owners.includes(previous.id));
      requireThat(anchors.length === 1 && anchors[0]!.role === "time");
      previous.timeEvidenceId = anchors[0]!.id;
    }
  }
  if (command.preserveTime && previous.timeEvidenceId !== null) {
    requireThat(retained.has(previous.timeEvidenceId), "evidence_invariant");
  }
  return retained;
}

function split(
  state: Snapshot,
  fragment: Fragment,
  ranges: Range[],
  owner: string,
  runtime: Runtime,
): Fragment[] {
  const boundaries = [
    ...new Set([
      0,
      fragment.text.length,
      ...ranges.flatMap((r) => [r.start, r.end]),
    ]),
  ].sort((a, b) => a - b);
  const pieces: Fragment[] = [];
  for (let i = 1; i < boundaries.length; i++) {
    const start = boundaries[i - 1]!,
      end = boundaries[i]!;
    const keep = ranges.some((r) => r.start <= start && r.end >= end);
    const owners = fragment.owners.filter((id) => id !== owner || keep);
    if (!owners.length) continue;
    const part = {
      ...fragment,
      id: allocate(state, runtime),
      start: fragment.start + start,
      end: fragment.start + end,
      text: fragment.text.slice(start, end),
      owners,
    };
    state.fragments[part.id] = part;
    pieces.push(part);
  }
  for (const occurrence of Object.values(state.occurrences)) {
    if (!occurrence.fragmentIds.includes(fragment.id)) continue;
    occurrence.fragmentIds = occurrence.fragmentIds.flatMap((id) =>
      id === fragment.id
        ? pieces
            .filter((p) => p.owners.includes(occurrence.unitId))
            .map((p) => p.id)
        : [id],
    );
  }
  delete state.fragments[fragment.id];
  return pieces;
}
