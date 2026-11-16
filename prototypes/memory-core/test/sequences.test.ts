import assert from "node:assert/strict";
import test from "node:test";
import { harness } from "../fixtures/harness.ts";
import { single, twoPlans } from "../fixtures/scenarios.ts";
import type { Content, EventTime, Reference } from "../src/contracts.ts";
import { validateSnapshot } from "../src/invariants.ts";

function random(seed: number) {
  let value = seed;
  return () => {
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    return value >>> 0;
  };
}

interface Expected {
  content: Content;
  time: EventTime;
  revision: number;
}

test("80 seeded sequences preserve an independent oracle through 1600 mixed transitions", () => {
  for (let seed = 1; seed <= 80; seed++) {
    const h = harness(),
      rng = random(seed),
      expected = new Map<string, Expected>();
    const removed: string[] = [],
      commands: unknown[] = [];
    for (let step = 0; step < 20; step++) {
      const action = rng() % 4,
        ids = [...expected.keys()];
      if (!ids.length || action === 0) {
        const draft = twoPlans(
          `sintetico_${seed}_${step}_a_fin`,
          `sintetico_${seed}_${step}_b_fin`,
        );
        const command = { kind: "capture", requestId: h.runtime.id(), draft };
        commands.push(command);
        const result = h.engine.commit(h.owner, h.prepare(command).id);
        result.refs.forEach((ref, index) => {
          const unit = draft.units[index]!;
          expected.set(ref.id, {
            content: unit.content,
            time: {
              precision: unit.time.precision,
              value: unit.time.value,
              end: unit.time.end,
            },
            revision: 1,
          });
        });
      } else {
        const id = ids[rng() % ids.length]!,
          previous = expected.get(id)!;
        const target: Reference = { id, revision: previous.revision };
        if (action === 1) {
          const draft = single(`sintetico_${seed}_${step}_corregido_fin`);
          h.engine.commit(
            h.owner,
            h.prepare({
              kind: "correct",
              requestId: h.runtime.id(),
              target,
              preserveTime: true,
              retainedEvidence: Object.values(h.store.read().fragments)
                .filter(
                  (f) => f.id === h.store.read().units[id]!.timeEvidenceId,
                )
                .map((f) => ({
                  fragmentId: f.id,
                  start: 0,
                  end: f.text.length,
                })),
              draft,
            }).id,
          );
          removed.push(previous.content.proposition);
          expected.set(id, {
            ...previous,
            content: draft.units[0]!.content,
            revision: previous.revision + 1,
          });
        } else if (action === 2) {
          h.erase([target]);
          removed.push(previous.content.proposition);
          expected.delete(id);
        } else {
          const before = h.store.read();
          h.engine.prepare(h.owner, commands[rng() % commands.length]);
          assert.deepEqual(h.store.read(), before);
        }
      }
      const state = h.store.read();
      assert.deepEqual(
        Object.keys(state.units).sort(),
        [...expected.keys()].sort(),
      );
      for (const [id, item] of expected) {
        assert.deepEqual(state.units[id]!.content, item.content);
        assert.deepEqual(state.units[id]!.time, item.time);
        assert.equal(state.units[id]!.revision, item.revision);
      }
      const serialized = JSON.stringify(state);
      for (const obsolete of removed)
        assert.ok(!serialized.includes(obsolete), `seed=${seed}, step=${step}`);
      validateSnapshot(state);
    }
  }
});

test("a leap-day birthday retains month/day precision without inventing a year", () => {
  const h = harness(),
    draft = single("celebrar el cumpleaños");
  draft.text += " el 29 de febrero";
  draft.fragments.push({
    start: draft.fragments[0]!.end,
    end: draft.text.length,
    role: "time",
    owners: ["a"],
  });
  draft.units[0]!.time = {
    precision: "month_day",
    value: "--02-29",
    end: null,
    fragment: 1,
  };
  const result = h.save(draft);
  assert.equal(
    h.engine.details(h.owner, result.refs)[0]!.unit.time.value,
    "--02-29",
  );
  draft.units[0]!.time.value = "--02-30";
  assert.throws(() => h.save(draft), { code: "evidence_invariant" });
});

test("explicit management still works when network inference is unavailable", () => {
  const fetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = () => {
    calls++;
    throw new Error("No network allowed in R1");
  };
  try {
    const h = harness(),
      saved = h.save(twoPlans());
    h.engine.details(h.owner, saved.refs);
    h.erase([saved.refs[0]!]);
    assert.equal(h.engine.details(h.owner, [saved.refs[1]!]).length, 1);
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = fetch;
  }
});
