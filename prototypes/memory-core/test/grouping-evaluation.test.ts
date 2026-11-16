import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { groupingReserve } from "../evaluation/grouping.ts";
import { finalReserve } from "../evaluation/final.ts";
import { reserve } from "../evaluation/reserve.ts";
import { fresh } from "../evaluation/fresh.ts";
import { holdout } from "../evaluation/holdout.ts";
import { tuning } from "../evaluation/tuning.ts";
import { reliability } from "../evaluation/reliability.ts";
import { adjustment } from "../evaluation/adjustment.ts";
import { profile } from "../ai/provider.ts";
import { validatePrevious } from "../evaluation/final-protocol.ts";

test("grouping reserve is sixty new balanced lifecycles with complete before/after obligations", () => {
  const old = new Set(
    [
      ...finalReserve,
      ...reserve,
      ...fresh,
      ...holdout,
      ...tuning,
      ...reliability,
      ...adjustment,
    ].map((c) => c.text.normalize("NFKC").toLowerCase()),
  );
  assert.equal(groupingReserve.length, 60);
  assert.equal(new Set(groupingReserve.map((c) => c.text)).size, 60);
  assert.deepEqual(
    groupingReserve.map((c) => c.id),
    Array.from({ length: 60 }, (_, i) => `g${String(i + 1).padStart(2, "0")}`),
  );
  const families = new Map<string, number>();
  for (const c of groupingReserve) {
    assert.ok(!old.has(c.text.normalize("NFKC").toLowerCase()));
    families.set(c.family, (families.get(c.family) ?? 0) + 1);
    const labels = new Set(c.units.map((u) => u.label));
    assert.equal(labels.size, c.units.length);
    assert.ok(c.queries.length >= 2 && c.after.length >= 2);
    assert.ok(c.forget.every((l) => labels.has(l)));
    assert.ok(
      c.after.every((q) =>
        q.labels.every((l) => labels.has(l) && !c.forget.includes(l)),
      ),
    );
    assert.ok(
      c.expectedRelations?.every((r) => labels.has(r.from) && labels.has(r.to)),
    );
    for (const q of [...c.queries, ...c.after]) {
      assert.ok(q.labels.every((l) => labels.has(l)));
      for (const t of [...q.terms, ...(q.forbidden ?? [])])
        assert.doesNotThrow(() => new RegExp(t, "u"));
    }
    for (const u of c.units)
      for (const t of [...u.terms, ...(u.forbidden ?? [])])
        assert.doesNotThrow(() => new RegExp(t, "u"));
    if (c.status === "clarify") assert.ok(c.clarification);
  }
  assert.equal(families.size, 10);
  assert.ok([...families.values()].every((n) => n === 6));
  assert.equal(groupingReserve.filter((c) => c.correction).length, 5);
  assert.equal(groupingReserve.filter((c) => c.repeat).length, 6);
  assert.equal(groupingReserve.filter((c) => c.status === "clarify").length, 4);
  assert.equal(
    groupingReserve.reduce(
      (n, c) =>
        n + c.queries.length + c.after.length + Number(Boolean(c.correction)),
      0,
    ),
    247,
  );
});

test("reserved rounds cannot borrow results from another corpus or select the passing subset", () => {
  const previous = {
    round: 1,
    complete: true,
    corpus: "grouping-v6",
    profile,
    resolvedModel: profile.model,
    fingerprint: "a".repeat(64),
    results: groupingReserve.map((c) => ({ id: c.id })),
  };
  assert.equal(
    validatePrevious(
      previous,
      2,
      previous.fingerprint,
      groupingReserve.map((c) => c.id),
      "grouping-v6",
    ),
    profile.model,
  );
  assert.throws(
    () =>
      validatePrevious(
        { ...previous, corpus: "independent-v5" },
        2,
        previous.fingerprint,
        groupingReserve.map((c) => c.id),
        "grouping-v6",
      ),
    { message: "PREVIOUS_ROUND_REQUIRED" },
  );
  for (const args of [
    [],
    ["--live", "--round", "4"],
    ["--live", "--round", "1", "--cases", "g01"],
  ]) {
    const result = spawnSync(
      process.execPath,
      ["prototypes/memory-core/evaluation/grouping-run.ts", ...args],
      { encoding: "utf8", env: { ...process.env, OPENAI_API_KEY: "" } },
    );
    assert.equal(result.status, 1);
    assert.match(result.stderr, /LIVE_REQUIRED|FINAL_ROUND_REQUIRED/u);
  }
});
