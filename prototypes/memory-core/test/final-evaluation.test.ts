import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { finalReserve } from "../evaluation/final.ts";
import {
  finalCorpus,
  finalRound,
  validatePrevious,
} from "../evaluation/final-protocol.ts";
import { reserve } from "../evaluation/reserve.ts";
import { fresh } from "../evaluation/fresh.ts";
import { holdout } from "../evaluation/holdout.ts";
import { tuning } from "../evaluation/tuning.ts";
import { adjustment } from "../evaluation/adjustment.ts";
import { reliability } from "../evaluation/reliability.ts";
import { profile } from "../ai/provider.ts";
import { gradeRelations, matches } from "../evaluation/grade.ts";
import { harness } from "../fixtures/harness.ts";
import { twoPlans } from "../fixtures/scenarios.ts";

test("final reserve has sixty unseen stories and ten complete families with explicit lifecycle obligations", () => {
  const old = new Set(
    [
      ...reserve,
      ...fresh,
      ...holdout,
      ...tuning,
      ...adjustment,
      ...reliability,
    ].map((c) => c.text.normalize("NFKC").toLowerCase()),
  );
  assert.equal(finalReserve.length, 60);
  assert.equal(new Set(finalReserve.map((c) => c.text)).size, 60);
  assert.deepEqual(
    finalReserve.map((c) => c.id),
    Array.from({ length: 60 }, (_, i) => `f${String(i + 1).padStart(2, "0")}`),
  );
  const families = new Map<string, number>();
  for (const c of finalReserve) {
    assert.ok(!old.has(c.text.normalize("NFKC").toLowerCase()));
    assert.ok(c.queries.length >= 2 && c.after.length >= 2);
    families.set(c.family, (families.get(c.family) ?? 0) + 1);
    const labels = new Set(c.units.map((u) => u.label));
    assert.equal(labels.size, c.units.length);
    for (const q of [...c.queries, ...c.after]) {
      assert.ok(q.labels.every((l) => labels.has(l)));
      for (const pattern of [...q.terms, ...(q.forbidden ?? [])])
        assert.doesNotThrow(() => new RegExp(pattern, "u"));
    }
    assert.ok(
      c.after.every((q) => !q.labels.some((l) => c.forget.includes(l))),
    );
    assert.ok(c.forget.every((l) => labels.has(l)));
    assert.ok(c.expectedRelations);
    assert.ok(
      c.expectedRelations.every((r) => labels.has(r.from) && labels.has(r.to)),
    );
    if (c.status === "clarify") assert.ok(c.clarification);
  }
  assert.equal(families.size, 10);
  assert.ok([...families.values()].every((n) => n === 6));
  assert.equal(
    finalReserve.reduce(
      (n, c) =>
        n + c.queries.length + c.after.length + Number(Boolean(c.correction)),
      0,
    ),
    247,
  );
  assert.equal(finalReserve.filter((c) => c.repeat).length, 6);
  assert.equal(finalReserve.filter((c) => c.correction).length, 5);
  assert.equal(finalReserve.filter((c) => c.clarification).length, 3);
  for (const q of finalReserve.find((c) => c.id === "f56")!.queries)
    assert.equal(matches("No consta en tus recuerdos", q.terms[0]!), false);
});

test("final protocol forbids subsets, fourth rounds, renamed runs and calls without explicit live", () => {
  for (const n of [1, 2, 3])
    assert.equal(finalRound(["--live", "--round", String(n)]), n);
  for (const args of [
    [],
    ["--live"],
    ["--live", "--round", "4"],
    ["--live", "--round", "1", "--cases", "f01"],
    ["--live", "--run", "different"],
  ])
    assert.throws(() => finalRound(args));
  const result = spawnSync(
    process.execPath,
    [
      "prototypes/memory-core/evaluation/final-run.ts",
      "--live",
      "--round",
      "1",
      "--cases",
      "f01",
    ],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.equal(result.stderr.trim(), "FINAL_ROUND_REQUIRED");
});

test("subsequent final rounds require complete preceding coverage and identical code, corpus and profile", () => {
  const fingerprint = "a".repeat(64),
    ids = finalReserve.map((c) => c.id);
  const valid = {
    round: 1,
    complete: true,
    corpus: finalCorpus,
    fingerprint,
    profile,
    resolvedModel: profile.model,
    results: ids.map((id) => ({ id })),
  };
  assert.equal(validatePrevious(valid, 2, fingerprint, ids), profile.model);
  for (const bad of [
    { ...valid, round: 0 },
    { ...valid, complete: false },
    { ...valid, fingerprint: "b".repeat(64) },
    { ...valid, results: valid.results.slice(1) },
    { ...valid, results: ids.map(() => ({ id: ids[0] })) },
    { ...valid, profile: { ...profile, reasoning: "high" } },
  ])
    assert.throws(() => validatePrevious(bad, 2, fingerprint, ids));
});

test("relation oracle rejects missing evolution, extra dependency and reversed direction", () => {
  const h = harness(),
    saved = h.save(twoPlans());
  const state = h.store.read(),
    mapping = new Map([
      ["before", state.units[saved.refs[0]!.id]!],
      ["now", state.units[saved.refs[1]!.id]!],
    ]);
  const gold = [{ kind: "evolvesFrom" as const, from: "now", to: "before" }];
  assert.equal(gradeRelations(state, gold, mapping)[0]!.passed, false);
  state.relations["synthetic"] = {
    id: "synthetic",
    kind: "evolvesFrom",
    from: saved.refs[1]!.id,
    to: saved.refs[0]!.id,
  };
  assert.equal(gradeRelations(state, gold, mapping)[0]!.passed, true);
  assert.equal(gradeRelations(state, [], mapping)[0]!.passed, false);
  state.relations["synthetic"]!.kind = "requires";
  assert.equal(gradeRelations(state, gold, mapping)[0]!.passed, false);
  state.relations["synthetic"] = {
    id: "synthetic",
    kind: "evolvesFrom",
    from: saved.refs[0]!.id,
    to: saved.refs[1]!.id,
  };
  assert.equal(gradeRelations(state, gold, mapping)[0]!.passed, false);
});
