import test from "node:test";
import assert from "node:assert/strict";
import { harness } from "../fixtures/harness.ts";
import { twoPlans } from "../fixtures/scenarios.ts";
import { interventions } from "../ai/interventions.ts";
import type { Input } from "../ai/contracts.ts";
import type { Draft } from "../src/contracts.ts";

test("late admitted fragments retain each intervention's date, zone and local offsets", () => {
  const h = harness(),
    draft = twoPlans();
  const split = draft.fragments[2]!.start,
    original = h.runtime.now();
  h.advance(3 * 86400_000);
  draft.interventions = [
    { start: 0, end: split, recordedAt: original, zone: "Europe/Madrid" },
    {
      start: split,
      end: draft.text.length,
      recordedAt: h.runtime.now(),
      zone: "America/Los_Angeles",
    },
  ];
  const saved = h.save(draft),
    state = h.store.read();
  const a = state.units[saved.refs[0]!.id]!,
    b = state.units[saved.refs[1]!.id]!;
  const aTime = state.fragments[a.timeEvidenceId!]!,
    bTime = state.fragments[b.timeEvidenceId!]!;
  assert.equal(state.sources[aTime.sourceId]!.recordedAt, original);
  assert.equal(state.sources[bTime.sourceId]!.recordedAt, h.runtime.now());
  assert.equal(state.sources[bTime.sourceId]!.zone, "America/Los_Angeles");
  for (const fragment of Object.values(state.fragments)) {
    const turn: NonNullable<Draft["interventions"]>[number] =
      draft.interventions[fragment.sourceId === aTime.sourceId ? 0 : 1]!;
    assert.equal(
      draft.text.slice(turn.start + fragment.start, turn.start + fragment.end),
      fragment.text,
    );
  }
  h.erase([saved.refs[0]!]);
  assert.deepEqual(h.store.read().units[b.id], {
    ...b,
    membershipRevision: h.store.read().units[b.id]!.membershipRevision,
  });
  assert.equal(
    Object.values(h.store.read().sources).some(
      (s) => s.recordedAt === original,
    ),
    false,
  );
});

test("intervention gaps, future times and a temporal fragment crossing sources reject without a write", () => {
  for (const kind of ["gap", "future", "time"] as const) {
    const h = harness(),
      draft = twoPlans(),
      split =
        kind === "time"
          ? draft.fragments[1]!.start + 1
          : draft.fragments[2]!.start;
    draft.interventions = [
      {
        start: 0,
        end: split,
        recordedAt: h.runtime.now(),
        zone: "Europe/Madrid",
      },
      {
        start: split + Number(kind === "gap"),
        end: draft.text.length,
        recordedAt: h.runtime.now() + Number(kind === "future"),
        zone: "Europe/Madrid",
      },
    ];
    assert.throws(() => h.save(draft));
    assert.equal(h.store.read().epoch, 0);
  }
});

test("original and reply calendars are independently anchored, never the assistant question", () => {
  const input: Input = {
    text: "Mañana quiero glanar.\nQuiero patinar.",
    at: "2026-07-17T01:00:00Z",
    zone: "America/Los_Angeles",
    mode: "capture",
    clarification: {
      original: "Mañana quiero glanar.",
      question: "¿Qué actividad?",
    },
    interventions: [
      {
        text: "Mañana quiero glanar.",
        at: "2026-07-14T22:30:00Z",
        zone: "Europe/Madrid",
      },
      {
        text: "Quiero patinar.",
        at: "2026-07-17T01:00:00Z",
        zone: "America/Los_Angeles",
      },
    ],
  };
  const parts = interventions(input)!;
  assert.equal(parts[0]!.calendar.tomorrow, "2026-07-16");
  assert.equal(parts[1]!.calendar.tomorrow, "2026-07-17");
  assert.equal(parts.at(-1)!.end, input.text.length);
  assert.throws(
    () => interventions({ ...input, text: input.text + " fabricated" }),
    { message: "INTERVENTION_SCOPE" },
  );
  assert.throws(() => interventions({ ...input, at: "2020-01-01T00:00:00Z" }), {
    message: "INTERVENTION_TIME",
  });
});
