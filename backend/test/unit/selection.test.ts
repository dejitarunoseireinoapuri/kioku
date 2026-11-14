import assert from "node:assert/strict";
import { test } from "node:test";
import {
  literalFact,
  retainedNotice,
  selectiveChange,
} from "../../src/memory-control/selection.js";
import type { Memory, Source } from "#memory-core/domain";

const source: Source = {
  id: "85091620-5b43-4a73-afb2-fb486322b07a",
  text: "Quiero ver Loto. Mi examen es el jueves. Me gusta el té.",
  receivedAt: "2026-11-14T12:00:00Z",
  zone: "Europe/Madrid",
};
const make = (quote: string, index: number): Memory => ({
  id: `${source.id}-${index}`,
  sourceId: source.id,
  revision: 1,
  quote,
  text: quote,
  receivedAt: source.receivedAt,
  zone: source.zone,
  kind: "fact",
  entities: [],
  time: { precision: "unknown", value: null, end: null, quote: null },
  provenance: "personal",
  attribution: null,
  attributionEvidence: null,
  eventStatus: "unspecified",
  lifecycle: "current",
  vector: Array(512).fill(0.1) as number[],
});
const memories = [
  make("Quiero ver Loto.", 1),
  make("Mi examen es el jueves.", 2),
  make("Me gusta el té.", 3),
];
test("selective withdrawal preserves all other literal text, time, vectors and advances canonical revisions", () => {
  const change = selectiveChange(source, memories, [memories[0]!.id]);
  assert.ok(change.replacement.sources[0]!.text.startsWith(retainedNotice));
  assert.equal(change.replacement.sources[0]!.text.includes("Loto"), false);
  assert.ok(
    change.replacement.sources[0]!.text.endsWith(
      " Mi examen es el jueves. Me gusta el té.",
    ),
  );
  assert.equal(change.replacement.sources[0]!.receivedAt, source.receivedAt);
  assert.deepEqual(
    change.replacement.memories.map((item) => item.text),
    memories.slice(1).map((item) => item.text),
  );
  assert.deepEqual(change.replacement.memories[0]!.vector, memories[1]!.vector);
  assert.equal(change.replacement.memories[0]!.revision, 2);
  assert.notEqual(change.replacement.memories[0]!.sourceId, source.id);
});
test("all repeated occurrences are removed, not just the first one", () => {
  const repeated = { ...source, text: `${source.text} Quiero ver Loto.` };
  assert.equal(
    selectiveChange(repeated, memories, [
      memories[0]!.id,
    ]).replacement.sources[0]!.text.includes("Loto"),
    false,
  );
});
test("overlapping unrelated evidence fails instead of deleting another subject", () => {
  const combined = {
    ...memories[0]!,
    quote: "Quiero ver Loto. Mi examen es el jueves.",
  };
  assert.throws(
    () =>
      selectiveChange(source, [combined, ...memories.slice(1)], [combined.id]),
    { message: "failed-precondition" },
  );
});
test("unknown, duplicate, foreign or unsupported references cannot expand a selection", () => {
  for (const ids of [[], ["unknown"], [memories[0]!.id, memories[0]!.id]])
    assert.throws(() => selectiveChange(source, memories, ids), {
      message: "failed-precondition",
    });
  assert.throws(
    () =>
      selectiveChange(
        source,
        [{ ...memories[0]!, sourceId: "other" }],
        [memories[0]!.id],
      ),
    { message: "failed-precondition" },
  );
  assert.throws(
    () =>
      selectiveChange(
        source,
        [{ ...memories[0]!, quote: "Otro literal" }, memories[1]!],
        [memories[0]!.id],
      ),
    { message: "failed-precondition" },
  );
});
test("whole-source withdrawal has no retained canonical source or vectors", () => {
  const change = selectiveChange(
    source,
    memories,
    memories.map((item) => item.id),
  );
  assert.deepEqual(change.replacement.sources, []);
  assert.deepEqual(change.replacement.memories, []);
});
test("a correction/proposal must be a literal of the current user message, not a model-created fact", () => {
  assert.equal(
    literalFact(
      "Corrige esto: mi examen es el viernes.",
      "mi examen es el viernes.",
    ),
    "mi examen es el viernes.",
  );
  assert.throws(() => literalFact("¿Es el viernes?", "Es el viernes."), {
    message: "failed-precondition",
  });
});
