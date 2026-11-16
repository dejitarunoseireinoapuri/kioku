import assert from "node:assert/strict";
import test from "node:test";
import { harness } from "../fixtures/harness.ts";
import { single, sharedContext, twoPlans } from "../fixtures/scenarios.ts";
import { validateSnapshot } from "../src/invariants.ts";
import { materializeRetention } from "../ai/retention.ts";
import type { Interpretation, Input } from "../ai/contracts.ts";

function quantity() {
  const h = harness(),
    draft = single("guardar fichas");
  draft.text = "Guardé siete fichas en el cajón violeta.";
  draft.fragments[0]!.end = draft.text.length;
  draft.units[0]!.content = {
    ...draft.units[0]!.content,
    text: draft.text,
    proposition: draft.text,
    kind: "fact",
  };
  const saved = h.save(draft);
  const old = Object.values(h.store.read().fragments)[0]!;
  const replacement = single("guardar fichas");
  replacement.text = "Eran seis fichas.";
  replacement.fragments[0]!.end = replacement.text.length;
  replacement.units[0]!.content = {
    ...draft.units[0]!.content,
    text: "Guardé seis fichas en el cajón violeta.",
    proposition: "Guardé seis fichas en el cajón violeta.",
  };
  const command = {
    kind: "correct",
    requestId: h.runtime.id(),
    target: saved.refs[0]!,
    preserveTime: true,
    draft: replacement,
    retainedEvidence: [
      { fragmentId: old.id, start: 0, end: 7 },
      { fragmentId: old.id, start: 12, end: old.text.length },
    ],
  };
  return { h, old, command };
}

test("partial correction keeps original action/location offsets while eliminating the old quantity", () => {
  const { h, old, command } = quantity();
  const source = h.store.read().sources[old.sourceId]!;
  const result = h.engine.commit(h.owner, h.prepare(command).id);
  const state = h.store.read();
  const text = Object.values(state.fragments)
    .map((f) => f.text)
    .join(" ");
  assert.match(text, /cajón violeta/u);
  assert.doesNotMatch(JSON.stringify(state), /siete/u);
  assert.deepEqual(state.sources[source.id], source);
  assert.ok(
    Object.values(state.fragments).some(
      (f) => f.sourceId === old.sourceId && f.start === 12,
    ),
  );
  assert.equal(result.refs[0]!.revision, 2);
  validateSnapshot(state);
  h.erase(result.refs);
  assert.equal(Object.keys(h.store.read().fragments).length, 0);
  assert.equal(Object.keys(h.store.read().sources).length, 0);
});

test("retention rejects foreign ownership, overlapping ranges, and invented offsets without mutation", () => {
  for (const type of ["foreign", "overlap", "bounds"]) {
    const { h, command } = quantity();
    h.save(single("preparar una infusión"));
    const state = h.store.read();
    if (type === "foreign")
      command.retainedEvidence[0]!.fragmentId = Object.values(
        state.fragments,
      ).find((f) => !f.owners.includes(command.target.id))!.id;
    if (type === "overlap")
      command.retainedEvidence.push(command.retainedEvidence[0]!);
    if (type === "bounds") command.retainedEvidence[0]!.end = 9000;
    assert.throws(() => h.prepare(command));
    assert.deepEqual(h.store.read(), state);
  }
});

test("a repeated identity loses obsolete values in every occurrence, and a second edit keeps the retained place", () => {
  const { h, command } = quantity();
  const duplicate = structuredClone(command.draft);
  const original = h.store.read().units[command.target.id]!;
  duplicate.text = original.content.text;
  duplicate.units[0]!.content = original.content;
  duplicate.units[0]!.existing = command.target;
  duplicate.fragments[0]!.end = duplicate.text.length;
  h.save(duplicate);
  h.engine.commit(h.owner, h.prepare(command).id);
  assert.doesNotMatch(JSON.stringify(h.store.read()), /siete/u);
  const before = h.store.read(),
    target = before.units[command.target.id]!;
  const next = structuredClone(command.draft);
  next.text = "Eran cinco fichas.";
  next.fragments[0]!.end = next.text.length;
  next.units[0]!.content.text = next.units[0]!.content.text.replace(
    "seis",
    "cinco",
  );
  next.units[0]!.content.proposition = next.units[0]!.content.text;
  const retainedEvidence = Object.values(before.fragments)
    .filter(
      (f) =>
        f.sourceId !==
        Object.values(before.sources).find((s) => s.kind === "correction")!.id,
    )
    .map((f) => ({ fragmentId: f.id, start: 0, end: f.text.length }));
  const result = h.engine.commit(
    h.owner,
    h.prepare({
      ...command,
      requestId: h.runtime.id(),
      target: { id: target.id, revision: target.revision },
      draft: next,
      retainedEvidence,
    }).id,
  );
  assert.doesNotMatch(JSON.stringify(h.store.read()), /seis|siete/u);
  assert.match(
    Object.values(h.store.read().fragments)
      .map((f) => f.text)
      .join(" "),
    /cajón violeta/u,
  );
  h.erase(result.refs);
  assert.equal(Object.keys(h.store.read().fragments).length, 0);
});

test("a retained source fragment cannot be split inside a Unicode surrogate", () => {
  const h = harness(),
    saved = h.save(single("dibujar 🌻"));
  const fragment = Object.values(h.store.read().fragments)[0]!;
  assert.throws(() =>
    h.prepare({
      kind: "correct",
      requestId: h.runtime.id(),
      target: saved.refs[0],
      preserveTime: true,
      draft: single("dibujar flores"),
      retainedEvidence: [
        {
          fragmentId: fragment.id,
          start: 0,
          end: fragment.text.indexOf("🌻") + 1,
        },
      ],
    }),
  );
});

test("splitting shared context preserves the other owner's exact words and current unit", () => {
  const h = harness(),
    saved = h.save(sharedContext());
  const before = h.store.read();
  const shared = Object.values(before.fragments).find(
    (f) => f.owners.length === 2,
  )!;
  const neighborText = Object.values(before.fragments)
    .filter((f) => f.owners.includes(saved.refs[1]!.id))
    .map((f) => f.text)
    .join("");
  h.engine.commit(
    h.owner,
    h.prepare({
      kind: "correct",
      requestId: h.runtime.id(),
      target: saved.refs[0],
      preserveTime: true,
      draft: single("pintar"),
      retainedEvidence: [{ fragmentId: shared.id, start: 0, end: 5 }],
    }).id,
  );
  const after = h.store.read();
  assert.equal(
    Object.values(after.fragments)
      .filter((f) => f.owners.includes(saved.refs[1]!.id))
      .sort((a, b) => a.start - b.start)
      .map((f) => f.text)
      .join(""),
    neighborText,
  );
  assert.deepEqual(
    after.units[saved.refs[1]!.id]!.content,
    before.units[saved.refs[1]!.id]!.content,
  );
  validateSnapshot(after);
});

test("time preservation requires explicit retained support; stale retention cannot commit", () => {
  const h = harness(),
    saved = h.save(twoPlans());
  const command = {
    kind: "correct",
    requestId: h.runtime.id(),
    target: saved.refs[0],
    preserveTime: true,
    draft: single("cantar"),
  };
  assert.throws(() => h.prepare(command), { code: "evidence_invariant" });
  const unit = h.store.read().units[saved.refs[0]!.id]!;
  const f = h.store.read().fragments[unit.timeEvidenceId!]!;
  const plan = h.prepare({
    ...command,
    requestId: h.runtime.id(),
    retainedEvidence: [{ fragmentId: f.id, start: 0, end: f.text.length }],
  });
  h.erase(saved.refs);
  assert.throws(() => h.engine.commit(h.owner, plan.id));
  assert.equal(Object.keys(h.store.read().fragments).length, 0);
});

test("model retention must cover every supplied fragment literally exactly once", () => {
  const { h, command, old } = quantity();
  const state = h.store.read();
  const input: Input = {
    text: command.draft.text,
    at: new Date(h.runtime.now()).toISOString(),
    zone: "Europe/Madrid",
    mode: "correction",
    target: state.units[command.target.id]!,
    evidence: [{ fragment: old, source: state.sources[old.sourceId]! }],
  };
  const proposal: Interpretation = {
    status: "ready",
    question: null,
    preserveTime: true,
    units: [],
    segments: [],
    relations: [],
    retention: [
      {
        index: 0,
        parts: [
          { literal: old.text.slice(0, 7), keep: true },
          { literal: old.text.slice(7, 12), keep: false },
          { literal: old.text.slice(12), keep: true },
        ],
      },
    ],
  };
  assert.deepEqual(
    materializeRetention(proposal, input),
    command.retainedEvidence,
  );
  assert.throws(
    () => materializeRetention({ ...proposal, retention: [] }, input),
    { message: "RETENTION_COVERAGE" },
  );
  assert.throws(
    () =>
      materializeRetention(
        {
          ...proposal,
          retention: [...proposal.retention, ...proposal.retention],
        },
        input,
      ),
    { message: "RETENTION_COVERAGE" },
  );
  proposal.retention[0]!.parts[0]!.literal = "Inventado";
  assert.throws(() => materializeRetention(proposal, input), {
    message: "RETENTION_LITERAL",
  });
});
