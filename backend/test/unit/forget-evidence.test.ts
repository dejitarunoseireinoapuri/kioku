import assert from "node:assert/strict";
import { test } from "node:test";
import { separateForgetEvidence } from "../../src/memory-control/forget-evidence.js";
import type { Memory } from "#memory-core/domain";

const source = {
  id: "7f0949d4-1657-4df9-b46a-bcf0342ff456",
  text: "Iré a cerámica el 18 de diciembre y visitaré el acuario el 20 de diciembre.",
  receivedAt: "2026-11-15T12:00:00Z",
  zone: "Europe/Madrid",
};
const memories: Memory[] = [
  ["Iré a cerámica el 18 de diciembre", "18", "18 de diciembre"],
  ["visitaré el acuario el 20 de diciembre.", "20", "20 de diciembre"],
].map(([text, day, quote], index) => ({
  id: `${source.id}-${index + 1}`,
  sourceId: source.id,
  text: text!,
  quote: source.text,
  kind: "intention",
  entities: index === 0 ? ["cerámica"] : ["acuario"],
  time: { precision: "day", value: `2026-12-${day}`, end: null, quote: quote! },
  provenance: "personal",
  attribution: null,
  attributionEvidence: null,
  eventStatus: "planned",
  lifecycle: "current",
  receivedAt: source.receivedAt,
  zone: source.zone,
  revision: 1,
  vector: Array.from({ length: 512 }, () => 0.1),
}));
const evidence = memories.map((m) => ({
  memoryId: m.id,
  quote: m.text,
  timeQuote: m.time.quote,
  attributionEvidence: m.attributionEvidence,
}));
const prepare = (edits = evidence, units = memories) =>
  separateForgetEvidence(source, units, [memories[0]!.id], edits);

test("independent facts sharing one quote separate without changing the surviving fact or date", () => {
  const result = prepare().replacement;
  assert.equal(result.sources.length, 1);
  assert.ok(!JSON.stringify(result).includes("cerámica"));
  assert.ok(result.sources[0]!.text.endsWith(memories[1]!.text));
  assert.equal(result.sources[0]!.receivedAt, source.receivedAt);
  const kept = result.memories[0]!;
  const original = memories[1]!;
  const {
    id: _id,
    sourceId: _sourceId,
    revision: _revision,
    quote: _quote,
    ...rest
  } = kept;
  const {
    id: _oldId,
    sourceId: _oldSourceId,
    revision: _oldRevision,
    quote: _oldQuote,
    ...expected
  } = original;
  assert.deepEqual(rest, expected);
  assert.equal(kept.quote, original.text);
  assert.equal(kept.revision, 2);
});

test("without an explicit literal plan a shared quote still fails closed", () => {
  assert.throws(() => prepare([]), { message: "failed-precondition" });
});

test("invented quotes, foreign IDs, duplicate edits and dropping a date cannot authorize a separation", () => {
  for (const invalid of [
    [{ ...evidence[0]!, quote: "Me he comprado una bicicleta." }, evidence[1]!],
    [{ ...evidence[0]!, memoryId: "foreign" }, evidence[1]!],
    [...evidence, evidence[0]!],
    [evidence[0]!, { ...evidence[1]!, timeQuote: null }],
    [evidence[0]!, { ...evidence[1]!, attributionEvidence: "Pablo" }],
    [evidence[0]!, { ...evidence[1]!, text: "Otro hecho." }],
  ])
    assert.throws(() => prepare(invalid), { message: "failed-precondition" });
});

test("a kept date or attribution cannot silently disappear with the removed evidence", () => {
  const attributed = memories.map((m) => ({
    ...m,
    attributionEvidence: "Iré a cerámica",
  }));
  assert.throws(
    () =>
      prepare(
        evidence.map((e) => ({ ...e, attributionEvidence: "Iré a cerámica" })),
        attributed,
      ),
    { message: "failed-precondition" },
  );
  const timed = memories.map((m) => ({
    ...m,
    time: { ...m.time, quote: "18 de diciembre" },
  }));
  assert.throws(
    () =>
      prepare(
        evidence.map((e) => ({ ...e, timeQuote: "18 de diciembre" })),
        timed,
      ),
    { message: "failed-precondition" },
  );
});

test("narrowing removes every occurrence of the target literal and preserves the surviving evidence count", () => {
  const repeated = { ...source, text: `${source.text} ${memories[0]!.text}` };
  const result = separateForgetEvidence(
    repeated,
    memories,
    [memories[0]!.id],
    evidence,
  );
  assert.ok(!JSON.stringify(result.replacement).includes("cerámica"));
  assert.equal(result.replacement.memories[0]!.time.value, "2026-12-20");
});

test("two independent facts on the same day keep their shared date without requiring its deleted occurrence", () => {
  const sameDay = {
    ...source,
    text: source.text.replaceAll("20 de diciembre", "18 de diciembre"),
  };
  const units = memories.map((m) => ({
    ...m,
    text: m.text.replaceAll("20 de diciembre", "18 de diciembre"),
    quote: sameDay.text,
    time: { ...m.time, value: "2026-12-18", quote: "18 de diciembre" },
  }));
  const edits = units.map((m) => ({
    memoryId: m.id,
    quote: m.text,
    timeQuote: m.time.quote,
    attributionEvidence: null,
  }));
  const result = separateForgetEvidence(
    sameDay,
    units,
    [units[0]!.id],
    edits,
  ).replacement;
  assert.equal(result.memories[0]!.time.value, "2026-12-18");
  assert.ok(result.sources[0]!.text.includes("18 de diciembre"));
  assert.ok(!JSON.stringify(result).includes("cerámica"));
});
