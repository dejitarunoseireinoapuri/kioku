import test from "node:test";
import assert from "node:assert/strict";
import {
  indexedText,
  expandInterpretation,
  indexedInterpretationSchema,
} from "../ai/indexed-evidence.ts";
import type { IndexedInterpretation } from "../ai/indexed-evidence.ts";
import type { Input } from "../ai/contracts.ts";
import { harness } from "../fixtures/harness.ts";
import { twoPlans } from "../fixtures/scenarios.ts";
import { materialize } from "../ai/interpreter.ts";
import { CoreError } from "../src/errors.ts";

test("wire contract prevents empty/shared primary owners, owned replacements and unknown date anchors", () => {
  for (const [role, owners] of [
    ["primary", []],
    ["primary", ["a", "b"]],
    ["context", []],
    ["time", []],
    ["separator", []],
    ["replaced", ["a"]],
  ]) {
    assert.equal(
      indexedInterpretationSchema.safeParse({
        ...empty(),
        segments: [{ end: 0, role, owners }],
      }).success,
      false,
    );
  }
  const u = twoPlans().units[0]!;
  for (const time of [
    { precision: "unknown", value: null, end: null, fragment: 0 },
    { precision: "unknown", value: "2026-07-14", end: null, fragment: null },
    { precision: "day", value: null, end: null, fragment: 0 },
  ])
    assert.equal(
      indexedInterpretationSchema.safeParse({
        ...empty(),
        units: [{ ...u, existing: null, time }],
      }).success,
      false,
    );
});

test("structural diagnostics disclose a closed reason and never the rejected literal", () => {
  const d = twoPlans();
  const p = {
    ...empty(),
    retention: [],
    units: d.units.map((u) => ({ ...u, existing: null })),
    segments: d.fragments.map((f) => ({
      literal: d.text.slice(f.start, f.end),
      role: f.role,
      owners: f.owners,
    })),
  };
  p.segments[0]!.role = "separator";
  assert.throws(
    () => materialize(p, { ...input, text: d.text }, []),
    (e: unknown) => {
      assert.ok(e instanceof CoreError);
      assert.equal(e.code, "evidence_invariant");
      assert.equal(e.reason, "semantic_separator");
      assert.equal(e.message, "evidence_invariant");
      return true;
    },
  );
});

const input: Input = {
  text: "Á😀\r\n44, 憶!",
  at: "2026-07-14T12:00:00Z",
  zone: "Europe/Madrid",
  mode: "capture",
};
const empty = (): IndexedInterpretation => ({
  status: "ready",
  question: null,
  preserveTime: false,
  retention: [],
  units: [],
  segments: [],
  relations: [],
});

test("indexed evidence is lossless across accents, emoji, repeated words and newlines", () => {
  assert.deepEqual(
    indexedText("12kg").map((t) => t.literal),
    ["12", "kg"],
  );
  for (const text of [
    input.text,
    "hola hola  hola",
    "きおく",
    "x\t\n y",
    "a\u0301",
  ])
    assert.equal(
      indexedText(text)
        .map((t) => t.literal)
        .join(""),
      text,
    );
  const wire = empty();
  const tokens = indexedText(input.text);
  wire.segments = tokens.map((t) => ({
    end: t.index,
    role: "primary",
    owners: ["a"],
  }));
  assert.equal(
    expandInterpretation(wire, input)
      .segments.map((p) => p.literal)
      .join(""),
    input.text,
  );
});

test("bad or incomplete token boundaries cannot skip, overlap or invent evidence", () => {
  for (const ends of [[-1], [999], [0, 0], [1, 0], [0], [0.5]]) {
    const wire = empty();
    wire.segments = ends.map((end) => ({
      end,
      role: "primary",
      owners: ["a"],
    }));
    assert.throws(() => expandInterpretation(wire, input));
  }
});

test("retention selects exact current fragment tokens and cannot use a foreign index", () => {
  const h = harness(),
    saved = h.save(twoPlans());
  const target = h.store.read().units[saved.refs[0]!.id]!;
  const state = h.store.read();
  const evidence = Object.values(state.fragments)
    .filter((f) => f.owners.includes(target.id))
    .map((fragment) => ({
      fragment,
      source: state.sources[fragment.sourceId]!,
    }));
  const edit: Input = { ...input, mode: "correction", target, evidence };
  const wire = empty();
  wire.segments = [
    { end: indexedText(input.text).length - 1, role: "primary", owners: ["a"] },
  ];
  wire.retention = evidence.map(({ fragment }, index) => ({
    index,
    parts: [{ end: indexedText(fragment.text).length - 1, keep: true }],
  }));
  assert.deepEqual(
    expandInterpretation(wire, edit).retention.map((p) => p.parts[0]!.literal),
    evidence.map((e) => e.fragment.text),
  );
  wire.retention[0]!.index = 999;
  assert.throws(() => expandInterpretation(wire, edit), {
    message: "RETENTION_REFERENCE",
  });
});
