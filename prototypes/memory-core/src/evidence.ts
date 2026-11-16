import { requireThat } from "./errors.ts";
import type { Draft, EventTime } from "./contracts.ts";

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

export function validateTime(time: EventTime): void {
  const { precision, value, end } = time;
  if (precision === "unknown") {
    requireThat(value === null && end === null);
    return;
  }
  requireThat(value !== null);
  if (precision === "day" || precision === "interval")
    requireThat(validDate(value));
  if (precision === "month")
    requireThat(/^\d{4}-(?:0[1-9]|1[0-2])$/u.test(value));
  if (precision === "year") requireThat(/^\d{4}$/u.test(value));
  if (precision === "month_day")
    requireThat(
      /^--\d{2}-\d{2}$/u.test(value) && validDate(`2000${value.slice(1)}`),
    );
  if (precision === "interval") {
    requireThat(end !== null && validDate(end) && end >= value);
  } else requireThat(end === null);
}

export function unicodeBoundary(text: string, offset: number): boolean {
  if (offset === 0 || offset === text.length) return true;
  const before = text.charCodeAt(offset - 1),
    after = text.charCodeAt(offset);
  return !(
    before >= 0xd800 &&
    before <= 0xdbff &&
    after >= 0xdc00 &&
    after <= 0xdfff
  );
}

/** Exact UTF-16 spans; semantic ownership must be reviewed upstream (R2). */
export function validateDraft(draft: Draft, correction: boolean): void {
  try {
    new Intl.DateTimeFormat("en", { timeZone: draft.zone });
  } catch {
    requireThat(false, "invalid_input");
  }
  const keys = new Set(draft.units.map((unit) => unit.key));
  if (draft.interventions) {
    let end = 0,
      previous = -1;
    for (const turn of draft.interventions) {
      requireThat(
        turn.start === end &&
          turn.end > turn.start &&
          turn.end <= draft.text.length &&
          unicodeBoundary(draft.text, turn.end),
      );
      requireThat(turn.recordedAt >= previous);
      try {
        new Intl.DateTimeFormat("en", { timeZone: turn.zone });
      } catch {
        requireThat(false, "invalid_input");
      }
      end = turn.end;
      previous = turn.recordedAt;
    }
    requireThat(end === draft.text.length);
  }
  requireThat(
    keys.size === draft.units.length,
    "evidence_invariant",
    "duplicate_unit_key",
  );
  let offset = 0;
  for (const fragment of draft.fragments) {
    requireThat(
      fragment.start === offset && fragment.end > offset,
      "evidence_invariant",
      "fragment_range",
    );
    requireThat(
      fragment.end <= draft.text.length &&
        unicodeBoundary(draft.text, fragment.end),
    );
    offset = fragment.end;
    const owners = new Set(fragment.owners);
    requireThat(
      owners.size === fragment.owners.length,
      "evidence_invariant",
      "duplicate_owner",
    );
    requireThat(
      [...owners].every((key) => keys.has(key)),
      "evidence_invariant",
      "unknown_owner",
    );
    if (fragment.role === "replaced") {
      requireThat(
        correction && owners.size === 0,
        "evidence_invariant",
        "replacement_ownership",
      );
    } else requireThat(owners.size > 0, "evidence_invariant", "missing_owner");
    if (fragment.role === "primary")
      requireThat(owners.size === 1, "evidence_invariant", "primary_ownership");
    if (fragment.role === "time" && draft.interventions)
      requireThat(
        draft.interventions.some(
          (t) => t.start <= fragment.start && t.end >= fragment.end,
        ),
        "scope_unresolved",
      );
    if (fragment.role !== "separator")
      requireThat(
        draft.text.slice(fragment.start, fragment.end).trim(),
        "evidence_invariant",
        "empty_fragment",
      );
    if (fragment.role === "separator") {
      requireThat(
        /^[\s\p{P}]+$/u.test(draft.text.slice(fragment.start, fragment.end)),
        "evidence_invariant",
        "semantic_separator",
      );
    }
  }
  requireThat(
    offset === draft.text.length,
    "evidence_invariant",
    "incomplete_coverage",
  );
  for (const unit of draft.units) validateUnitEvidence(draft, unit);
}

function validateUnitEvidence(
  draft: Draft,
  unit: Draft["units"][number],
): void {
  requireThat(
    draft.fragments.some(
      (f) => f.role === "primary" && f.owners.includes(unit.key),
    ),
    "evidence_invariant",
    "missing_primary",
  );
  validateTime(unit.time);
  if (unit.time.precision === "unknown")
    requireThat(
      unit.time.fragment === null,
      "evidence_invariant",
      "unknown_time_anchor",
    );
  else {
    // A reviewed repeat can inherit its identity's temporal evidence; it does not invent a new quote.
    if (unit.existing && unit.time.fragment === null) return;
    const fragment =
      unit.time.fragment === null
        ? undefined
        : draft.fragments[unit.time.fragment];
    requireThat(
      fragment?.role === "time" && fragment.owners.includes(unit.key),
      "evidence_invariant",
      "invalid_time_anchor",
    );
  }
}
