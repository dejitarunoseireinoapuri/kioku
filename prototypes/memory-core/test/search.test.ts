import test from "node:test";
import assert from "node:assert/strict";
import { SearchIndex } from "../src/search-index.ts";
import { LargeCatalog, syntheticId } from "../fixtures/large-catalog.ts";
import { queryCatalog } from "../ai/catalog-query.ts";
import type { StructuredModel } from "../ai/contracts.ts";
import type { CatalogReader } from "../src/search-index.ts";
import { z } from "zod";

test("complete paginated indexes retrieve rare targets at 100, 1000 and 10000 and disclose truncation", async () => {
  for (const size of [100, 1000, 10_000]) {
    const catalog = new LargeCatalog(size),
      index = await SearchIndex.load(catalog, catalog.owner);
    assert.equal(index.total, size);
    assert.equal(index.pages, Math.ceil(size / 256));
    for (const [i, terms] of [
      [0, ["cuaderno", "granate"]],
      [1, ["rios", "sal"]],
      [2, ["videojuego", "clave"]],
      [3, ["torno", "julia"]],
      [4, ["eclipse", "damian"]],
      [5, ["enzo"]],
    ] as const) {
      assert.equal(
        index.search(catalog.owner, [...terms]).refs[0]!.id,
        syntheticId(i + 1),
      );
    }
    const broad = index.search(catalog.owner, ["catalogué", "ficha"]);
    assert.equal(broad.truncated, true);
    assert.equal(broad.refs.length, 32);
    assert.equal(broad.coverage, "ranked_candidates");
  }
});

test("index cannot cross accounts, accept partial pages or combine epochs", async () => {
  for (const fault of [
    "owner",
    "epoch",
    "gap",
    "duplicate",
    "oversize",
  ] as const) {
    const catalog = new LargeCatalog(1000);
    const bad: CatalogReader = {
      assertCurrent: (actor, epoch) => catalog.assertCurrent(actor, epoch),
      async page(actor, cursor, limit) {
        const p = await catalog.page(actor, cursor, limit);
        if (fault === "owner") p.owner = "other";
        if (fault === "epoch" && cursor) p.epoch++;
        if (fault === "gap") p.next = null;
        if (fault === "duplicate") p.entries[1] = p.entries[0]!;
        if (fault === "oversize") p.total = 10001;
        return p;
      },
    };
    await assert.rejects(() => SearchIndex.load(bad, catalog.owner));
  }
});

test("forgotten projections vanish and in-flight index/answers are revoked", async () => {
  const catalog = new LargeCatalog(100),
    index = await SearchIndex.load(catalog, catalog.owner);
  let calls = 0;
  const model: StructuredModel = {
    async call<T>(
      stage: string,
      _i: string,
      _d: unknown,
      schema: z.ZodType<T>,
    ) {
      calls++;
      if (stage === "search_plan")
        return schema.parse({ terms: ["granate"], exhaustive: false });
      if (stage === "answer") {
        catalog.forget(syntheticId(1));
        return schema.parse({
          status: "answered",
          text: "En el baúl.",
          evidence: [0],
        });
      }
      return schema.parse({ accepted: true, issues: [] });
    },
  };
  await assert.rejects(
    () =>
      queryCatalog(model, catalog, index, {
        actor: catalog.owner,
        text: "synthetic",
        at: "2026-07-14T12:00:00Z",
        zone: "Europe/Madrid",
      }),
    { message: "stale_version" },
  );
  const rebuilt = await SearchIndex.load(catalog, catalog.owner);
  assert.deepEqual(rebuilt.search(catalog.owner, ["granate"]).refs, []);
  await assert.rejects(() =>
    queryCatalog(model, catalog, index, {
      actor: catalog.owner,
      text: "synthetic",
      at: "2026-07-14T12:00:00Z",
      zone: "Europe/Madrid",
    }),
  );
  assert.equal(calls, 3);
  assert.throws(() => rebuilt.search("other", ["granate"]), {
    message: "not_authorized",
  });
});

test("an exhaustive truncated search cannot be presented as a complete list", async () => {
  const catalog = new LargeCatalog(100),
    index = await SearchIndex.load(catalog, catalog.owner);
  let calls = 0;
  const model: StructuredModel = {
    async call<T>(_s: string, _i: string, _d: unknown, schema: z.ZodType<T>) {
      calls++;
      return schema.parse({ terms: ["ficha"], exhaustive: true });
    },
  };
  const result = await queryCatalog(model, catalog, index, {
    actor: catalog.owner,
    text: "Todos",
    at: "2026-07-14T12:00:00Z",
    zone: "Europe/Madrid",
  });
  assert.equal(result.status, "clarify");
  assert.equal(calls, 1);
  assert.deepEqual(result.ids, []);
});

test("large-catalog retrieval receives the current query separately from its elliptical context", async () => {
  const catalog = new LargeCatalog(100),
    index = await SearchIndex.load(catalog, catalog.owner);
  const previous = "¿Qué objeto es granate?";
  const model: StructuredModel = {
    async call(stage, _instructions, raw, schema) {
      if (stage === "search_plan") {
        const data = raw as { text: string; previous: string };
        assert.equal(data.text, "¿Dónde está?");
        assert.equal(data.previous, previous);
        return schema.parse({ terms: ["granate"], exhaustive: false });
      }
      const data = raw as { question: string; previousQuestions: string[] };
      assert.equal(data.question, "¿Dónde está?");
      assert.deepEqual(data.previousQuestions, [previous]);
      return schema.parse(
        stage === "answer"
          ? {
              status: "answered",
              text: "Dato ficticio del objeto granate.",
              evidence: [0],
            }
          : { accepted: true, issues: [] },
      );
    },
  };
  const result = await queryCatalog(model, catalog, index, {
    actor: catalog.owner,
    text: JSON.stringify({
      pregunta_actual: "¿Dónde está?",
      preguntas_anteriores_solo_contexto: [previous],
    }),
    at: "2026-11-20T11:00:00Z",
    zone: "Europe/Madrid",
  });
  assert.equal(result.status, "answered");
  assert.deepEqual(result.ids, [syntheticId(1)]);
});

test("an explicit empty query context cannot inherit a legacy previous question during search", async () => {
  const catalog = new LargeCatalog(100),
    index = await SearchIndex.load(catalog, catalog.owner);
  let calls = 0;
  const model: StructuredModel = {
    async call(stage, _instructions, raw, schema) {
      calls++;
      assert.equal(stage, "search_plan");
      assert.equal((raw as { previous: unknown }).previous, null);
      return schema.parse({ terms: ["objeto-inexistente"], exhaustive: false });
    },
  };
  const result = await queryCatalog(model, catalog, index, {
    actor: catalog.owner,
    text: JSON.stringify({
      pregunta_actual: "¿Dónde está?",
      preguntas_anteriores_solo_contexto: [],
    }),
    previous: "¿Qué objeto es granate?",
    at: "2026-11-20T11:00:00Z",
    zone: "Europe/Madrid",
  });
  assert.equal(calls, 1);
  assert.equal(result.status, "not_found");
  assert.deepEqual(result.ids, []);
});

test("an index with too many short pages is rejected, never returned as a partial catalog", async () => {
  const catalog = new LargeCatalog(100);
  const reader: CatalogReader = {
    assertCurrent: (actor, epoch) => catalog.assertCurrent(actor, epoch),
    page: (actor, cursor) => catalog.page(actor, cursor, 1),
  };
  await assert.rejects(() => SearchIndex.load(reader, catalog.owner), {
    message: "scope_too_large",
  });
});
