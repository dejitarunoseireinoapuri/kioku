import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, mkdir, writeFile } from "node:fs/promises";
import { MemoryEngine } from "../src/engine.ts";
import { JsonMemoryRepository } from "../src/repository.ts";
import type {
  Answer,
  Extraction,
  MemoryIntelligence,
  Turn,
} from "../src/domain.ts";
import { cosine } from "../src/search.ts";

const turn: Turn = {
  id: "source-1",
  text: "Me gusta el ramen.",
  receivedAt: "2026-11-11T12:00:00Z",
  zone: "Europe/Madrid",
};
const saved: Extraction = {
  status: "saved",
  clarification: null,
  items: [
    {
      text: "Le gusta el ramen.",
      quote: "Me gusta el ramen.",
      kind: "opinion",
      entities: [],
      occurredOn: null,
    },
  ],
};

function fake(overrides: Partial<MemoryIntelligence> = {}): MemoryIntelligence {
  return {
    extract: async () => saved,
    embed: async (texts) => texts.map(() => [1, 0]),
    answer: async () => ({
      status: "answered",
      answer: "Te gusta el ramen.",
      sourceIds: ["source-1"],
    }),
    ...overrides,
  };
}

async function fixture() {
  await mkdir("local-data/m0/tests", { recursive: true });
  const directory = await mkdtemp("local-data/m0/tests/case-");
  const repository = new JsonMemoryRepository(directory);
  return {
    directory,
    repository,
    async close() {
      await rm(directory, { recursive: true, force: true });
    },
  };
}

test("a clarification is not saved separately and source survives a new engine", async () => {
  const f = await fixture();
  try {
    const intelligence = fake({
      extract: async (_turn, clarification) =>
        clarification
          ? saved
          : {
              status: "needs_clarification",
              clarification: "¿Qué plato?",
              items: [],
            },
    });
    const engine = new MemoryEngine(f.repository, intelligence);
    assert.equal((await engine.tell(turn)).status, "needs_clarification");
    assert.equal((await f.repository.load()).sources.length, 0);
    await engine.tell(turn, "Ramen.");
    const fresh = new MemoryEngine(
      new JsonMemoryRepository(f.directory),
      intelligence,
    );
    const answer = await fresh.ask("¿Qué me gusta?", "2026-11-20T12:00:00Z");
    assert.deepEqual(answer.answer.sourceIds, ["source-1"]);
    assert.equal((await f.repository.load()).sources.length, 1);
  } finally {
    await f.close();
  }
});

test("missing literal evidence and failed embeddings never announce or persist a save", async () => {
  const f = await fixture();
  try {
    const invented = fake({
      extract: async () => ({
        ...saved,
        items: [{ ...saved.items[0]!, quote: "No existe" }],
      }),
    });
    await assert.rejects(
      new MemoryEngine(f.repository, invented).tell(turn),
      /QUOTE_NOT_IN_SOURCE/,
    );
    const failing = fake({
      embed: async () => {
        throw new Error("synthetic provider failure");
      },
    });
    await assert.rejects(new MemoryEngine(f.repository, failing).tell(turn));
    assert.equal((await f.repository.load()).memories.length, 0);
  } finally {
    await f.close();
  }
});

test("ignored questions do not mutate storage and repeated source IDs are rejected", async () => {
  const f = await fixture();
  try {
    const question = fake({
      extract: async () => ({
        status: "ignored",
        clarification: null,
        items: [],
      }),
    });
    await new MemoryEngine(f.repository, question).tell({
      ...turn,
      text: "¿Me gusta el ramen?",
    });
    assert.equal((await f.repository.load()).sources.length, 0);
    const engine = new MemoryEngine(f.repository, fake());
    await engine.tell(turn);
    await assert.rejects(engine.tell(turn), /TURN_ALREADY_EXISTS/);
    assert.equal((await f.repository.load()).sources.length, 1);
  } finally {
    await f.close();
  }
});

test("forget removes original source and vectors after reload, preserving other sources", async () => {
  const f = await fixture();
  try {
    const engine = new MemoryEngine(f.repository, fake());
    await engine.tell(turn);
    await engine.tell({ ...turn, id: "source-2" });
    await engine.forget("source-1");
    const snapshot = await new JsonMemoryRepository(f.directory).load();
    assert.deepEqual(
      snapshot.sources.map((source) => source.id),
      ["source-2"],
    );
    assert.deepEqual(
      snapshot.memories.map((memory) => memory.sourceId),
      ["source-2"],
    );
    await assert.rejects(engine.forget("missing"), /SOURCE_NOT_FOUND/);
    assert.equal(
      JSON.parse(await readFile(f.repository.file, "utf8")).sources.length,
      1,
    );
  } finally {
    await f.close();
  }
});

test("answers cannot cite foreign or withdrawn sources, or omit evidence for a factual answer", async () => {
  const f = await fixture();
  try {
    for (const sourceIds of [["foreign"], []]) {
      const answer: Answer = {
        status: "answered",
        answer: "Unsupported",
        sourceIds,
      };
      const engine = new MemoryEngine(
        f.repository,
        fake({ answer: async () => answer }),
      );
      await assert.rejects(
        engine.ask("¿Qué recuerdo?", "2026-11-20T12:00:00Z"),
        /ANSWER_EVIDENCE_INVALID/,
      );
    }
  } finally {
    await f.close();
  }
});

test("storage rejects traversal, corrupt snapshots and unknown fields", async () => {
  assert.throws(
    () => new JsonMemoryRepository("../elsewhere"),
    /STORE_OUTSIDE_M0/,
  );
  assert.throws(
    () => new JsonMemoryRepository("local-data/m0/test", "../escape.json"),
    /STORE_OUTSIDE_M0/,
  );
  const f = await fixture();
  try {
    await writeFile(
      f.repository.file,
      '{"version":1,"sources":[],"memories":[],"secret":"synthetic"}',
    );
    await assert.rejects(f.repository.load(), /STORE_READ_FAILED/);
  } finally {
    await f.close();
  }
});

test("invalid vector dimensions fail instead of silently distorting retrieval", () => {
  assert.throws(() => cosine([1, 2], [1]), /VECTOR_DIMENSIONS/);
  assert.throws(() => cosine([NaN], [1]), /VECTOR_INVALID/);
  assert.equal(cosine([1, 0], [1, 0]), 1);
});
