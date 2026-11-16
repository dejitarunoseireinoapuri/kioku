import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { highReserve } from "../evaluation/high.ts";
import { scopeReserve } from "../evaluation/scope.ts";
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

test("high reserve defines sixty fresh complete lifecycles with fixed relations and explicit dependency consent", () => {
  const used = new Set(
    [
      ...scopeReserve,
      ...groupingReserve,
      ...finalReserve,
      ...reserve,
      ...fresh,
      ...holdout,
      ...tuning,
      ...reliability,
      ...adjustment,
    ].map((c) => c.text.normalize("NFKC").toLowerCase()),
  );
  assert.equal(highReserve.length, 60);
  assert.equal(new Set(highReserve.map((c) => c.text)).size, 60);
  assert.deepEqual(
    highReserve.map((c) => c.id),
    Array.from({ length: 60 }, (_, i) => `i${String(i + 1).padStart(2, "0")}`),
  );
  const families = new Map<string, number>();
  for (const c of highReserve) {
    assert.ok(!used.has(c.text.normalize("NFKC").toLowerCase()));
    families.set(c.family, (families.get(c.family) ?? 0) + 1);
    const labels = new Set(c.units.map((u) => u.label));
    assert.equal(labels.size, c.units.length);
    assert.ok(c.queries.length >= 2 && c.after.length >= 2);
    const forgotten = [...c.forget, ...(c.forgetClosure ?? [])];
    assert.ok(forgotten.every((l) => labels.has(l)));
    assert.equal(new Set(forgotten).size, forgotten.length);
    assert.ok(
      c.after.every((q) =>
        q.labels.every((l) => labels.has(l) && !forgotten.includes(l)),
      ),
    );
    assert.ok(
      c.expectedRelations?.every((r) => labels.has(r.from) && labels.has(r.to)),
    );
    for (const q of [...c.queries, ...c.after]) {
      assert.ok(
        [...q.labels, ...(q.contextLabels ?? [])].every((l) => labels.has(l)),
      );
      for (const pattern of [...q.terms, ...(q.forbidden ?? [])])
        assert.doesNotThrow(() => new RegExp(pattern, "u"));
    }
    for (const u of c.units)
      for (const pattern of [
        ...u.terms,
        ...(u.forbidden ?? []),
        ...(u.evidenceTerms ?? []),
      ])
        assert.doesNotThrow(() => new RegExp(pattern, "u"));
    if (c.status === "clarify") assert.ok(c.clarification);
  }
  assert.equal(families.size, 10);
  assert.ok([...families.values()].every((n) => n === 6));
  assert.equal(highReserve.filter((c) => c.correction).length, 6);
  assert.equal(highReserve.filter((c) => c.repeat).length, 7);
  assert.equal(highReserve.filter((c) => c.status === "clarify").length, 4);
  assert.equal(highReserve.filter((c) => c.forgetClosure).length, 1);
});

test("historical reserves cannot silently run with high and high reserve forbids subsets or fourth rounds", () => {
  assert.equal(profile.reasoning, "high");
  for (const file of ["final-run.ts", "grouping-run.ts", "scope-run.ts"]) {
    const r = spawnSync(
      process.execPath,
      [`prototypes/memory-core/evaluation/${file}`, "--live", "--round", "1"],
      { encoding: "utf8", env: { ...process.env, OPENAI_API_KEY: "" } },
    );
    assert.equal(r.status, 1);
    assert.equal(r.stderr.trim(), "HISTORICAL_PROFILE_MISMATCH");
  }
  for (const args of [
    [],
    ["--live", "--round", "4"],
    ["--live", "--round", "1", "--cases", "i01"],
  ]) {
    const r = spawnSync(
      process.execPath,
      ["prototypes/memory-core/evaluation/high-run.ts", ...args],
      { encoding: "utf8", env: { ...process.env, OPENAI_API_KEY: "" } },
    );
    assert.equal(r.status, 1);
    assert.match(r.stderr, /LIVE_REQUIRED|FINAL_ROUND_REQUIRED/u);
  }
  const ids = highReserve.map((c) => c.id),
    fingerprint = "b".repeat(64);
  const valid = {
    round: 1,
    complete: true,
    corpus: "high-v8",
    profile,
    resolvedModel: profile.model,
    fingerprint,
    results: ids.map((id) => ({ id })),
  };
  assert.equal(
    validatePrevious(valid, 2, fingerprint, ids, "high-v8"),
    profile.model,
  );
  for (const invalid of [
    { ...valid, profile: { ...profile, reasoning: "medium" } },
    { ...valid, corpus: "scope-v7" },
  ])
    assert.throws(
      () => validatePrevious(invalid, 2, fingerprint, ids, "high-v8"),
      { message: "PREVIOUS_ROUND_REQUIRED" },
    );
});
