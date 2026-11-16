import { createHmac, randomBytes } from "node:crypto";
import { MemoryPrototype } from "../src/memory.ts";
import type { Plan, Result } from "../src/memory.ts";
import { InMemoryStore } from "../src/in-memory-store.ts";
import { emptySnapshot } from "../src/model.ts";
import type { Draft, Reference } from "../src/contracts.ts";
import { requireThat } from "../src/errors.ts";

export function harness() {
  let sequence = 0,
    now = Date.parse("2026-05-10T10:00:00Z"),
    enabled = true;
  const owner = "synthetic-owner";
  const key = randomBytes(32); // RAM-only private digest key; never an API credential.
  const runtime = {
    now: () => now,
    id: () =>
      `00000000-0000-4000-8000-${(++sequence).toString(16).padStart(12, "0")}`,
    digest: (value: string) =>
      createHmac("sha256", key).update(value).digest("hex"),
  };
  const store = new InMemoryStore(emptySnapshot(owner));
  const engine = new MemoryPrototype(
    store,
    runtime,
    (actor) => enabled && actor === owner,
  );
  function prepare(command: unknown): Plan {
    const result = engine.prepare(owner, command);
    requireThat(result.status === "ready", "scope_unresolved");
    return result;
  }
  function save(draft: Draft): Result {
    const plan = prepare({ kind: "capture", requestId: runtime.id(), draft });
    return engine.commit(owner, plan.id);
  }
  function erase(targets: Reference[]): Result {
    return engine.commit(
      owner,
      prepare({
        kind: "forget",
        requestId: runtime.id(),
        targets,
        excludeMatches: [],
      }).id,
    );
  }
  return {
    owner,
    runtime,
    store,
    engine,
    prepare,
    save,
    erase,
    advance: (milliseconds: number) => {
      now += milliseconds;
    },
    disable: () => {
      enabled = false;
    },
  };
}

export type Harness = ReturnType<typeof harness>;
