import test from "node:test";
import assert from "node:assert/strict";
import { PresentSourceMemories } from "../../src/memory-control/presentation.js";
import type { SourceBundle } from "../../src/memory-control/contracts.js";
import { scopeVersion } from "../../src/memory-control/retirement.js";

const id = "fa43dcf1-5cb9-4cb4-a186-122280f740ad";
function fixture() {
  const source = {
    id,
    text: "Quiero ir al parque. Pablo quiere ir al cine.",
    receivedAt: "2026-11-15T12:00:00Z",
    zone: "Europe/Madrid",
  };
  const memories: SourceBundle["memories"] = [
    "El usuario quiere ir al parque.",
    "Pablo quiere ir al cine.",
  ].map((text, index) => ({
    id: `${id}-${index + 1}`,
    sourceId: id,
    revision: 1,
    text,
    quote: index === 0 ? "Quiero ir al parque." : "Pablo quiere ir al cine.",
    receivedAt: source.receivedAt,
    zone: source.zone,
    kind: "intention",
    entities: [],
    time: { precision: "unknown", value: null, end: null, quote: null },
    provenance: "personal",
    attribution: null,
    attributionEvidence: null,
    eventStatus: "planned",
    lifecycle: "current",
    vector: [1],
  }));
  let current: SourceBundle = {
    source,
    memories,
    memoryEpoch: 0,
    scope: {
      scope: "entireSource",
      sourceId: id,
      sourceVersion: "1:1",
      memories: memories.map((item) => ({ id: item.id, version: "1:1" })),
      expiresAtMs: Date.now() + 60_000,
    },
  };
  const original = structuredClone(current);
  let calls = 0,
    authorized = 0;
  const presentation = {
    items: memories.map((item, index) => ({
      id: item.id,
      text: index === 0 ? "Quiero ir al parque." : item.text,
    })),
  };
  const review = {
    faithful: true,
    ownerPerspective: true,
    attributionPreserved: true,
  };
  const ai = {
    async presentMemories(data: unknown): Promise<unknown> {
      calls++;
      assert.equal(JSON.stringify(data).includes('"vector"'), false);
      return presentation;
    },
    async reviewMemoryPresentation(): Promise<unknown> {
      calls++;
      return review;
    },
  };
  const service = new PresentSourceMemories({
    async bundle() {
      return structuredClone(current);
    },
  });
  return {
    service,
    ai,
    presentation,
    review,
    original,
    get current() {
      return current;
    },
    set current(value: SourceBundle) {
      current = value;
    },
    get calls() {
      return calls;
    },
    get authorized() {
      return authorized;
    },
    async authorize() {
      authorized++;
    },
  };
}

test("presentation changes only owner phrasing, keeps order/version and source literal, without writing memory", async () => {
  const f = fixture();
  f.presentation.items.reverse();
  const result = await f.service.execute(
    "synthetic-owner",
    id,
    async () => f.ai,
    f.authorize,
  );
  assert.equal(result.items[0]?.text, "Quiero ir al parque.");
  assert.equal(result.items[1]?.text, "Pablo quiere ir al cine.");
  assert.equal(result.version, scopeVersion(f.original.scope));
  assert.equal(result.text, f.original.source.text);
  assert.deepEqual(f.current, f.original);
  assert.equal(f.calls, 2);
  assert.equal(f.authorized, 1);
});

test("foreign, duplicated, missing and oversized presentation items fail before review", async () => {
  for (const kind of ["foreign", "duplicate", "missing", "oversized"]) {
    const f = fixture();
    if (kind === "foreign") f.presentation.items[0]!.id = "other-owner-item";
    if (kind === "duplicate")
      f.presentation.items[0]!.id = f.presentation.items[1]!.id;
    if (kind === "missing") f.presentation.items.pop();
    if (kind === "oversized") f.presentation.items[0]!.text = "x".repeat(1601);
    await assert.rejects(
      f.service.execute("synthetic-owner", id, async () => f.ai, f.authorize),
    );
    assert.equal(f.calls, 1);
    assert.deepEqual(f.current, f.original);
  }
});

test("unsupported meaning, owner attribution or narrative perspective fail closed", async () => {
  for (const field of [
    "faithful",
    "ownerPerspective",
    "attributionPreserved",
  ] as const) {
    const f = fixture();
    f.review[field] = false;
    await assert.rejects(
      f.service.execute("synthetic-owner", id, async () => f.ai, f.authorize),
    );
    assert.equal(f.authorized, 0);
    assert.deepEqual(f.current, f.original);
  }
});

test("a changed source or memory epoch during presentation cannot return stale text", async () => {
  for (const change of ["source", "epoch"]) {
    const f = fixture();
    f.ai.reviewMemoryPresentation = async () => {
      f.current =
        change === "source"
          ? {
              ...f.current,
              scope: { ...f.current.scope, sourceVersion: "2:1" },
            }
          : { ...f.current, memoryEpoch: 1 };
      return f.review;
    };
    await assert.rejects(
      f.service.execute("synthetic-owner", id, async () => f.ai, f.authorize),
    );
    assert.equal(f.authorized, 1);
  }
});

test("access revoked during the model call is rechecked before returning a presentation", async () => {
  const f = fixture();
  await assert.rejects(
    f.service.execute(
      "synthetic-owner",
      id,
      async () => f.ai,
      async () => {
        throw new Error("Synthetic revoked access");
      },
    ),
  );
  assert.deepEqual(f.current, f.original);
});
