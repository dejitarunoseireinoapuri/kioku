import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { scopeReserve } from "../evaluation/scope.ts";
import { groupingReserve } from "../evaluation/grouping.ts";
import { finalReserve } from "../evaluation/final.ts";
import { reserve } from "../evaluation/reserve.ts";
import { fresh } from "../evaluation/fresh.ts";
import { holdout } from "../evaluation/holdout.ts";
import { tuning } from "../evaluation/tuning.ts";
import { reliability } from "../evaluation/reliability.ts";
import { adjustment } from "../evaluation/adjustment.ts";
import { validatePrevious } from "../evaluation/final-protocol.ts";
import { profile } from "../ai/provider.ts";

test("scope reserve has sixty new stories, ten complete families and predeclared lifecycle expectations", () => {
  const old = new Set(
    [
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
  assert.equal(scopeReserve.length, 60);
  assert.equal(new Set(scopeReserve.map((c) => c.text)).size, 60);
  assert.deepEqual(
    scopeReserve.map((c) => c.id),
    Array.from({ length: 60 }, (_, i) => `h${String(i + 1).padStart(2, "0")}`),
  );
  const families = new Map<string, number>();
  for (const c of scopeReserve) {
    assert.ok(!old.has(c.text.normalize("NFKC").toLowerCase()));
    families.set(c.family, (families.get(c.family) ?? 0) + 1);
    const labels = new Set(c.units.map((u) => u.label));
    assert.equal(labels.size, c.units.length);
    assert.ok(c.queries.length >= 2 && c.after.length >= 2);
    assert.ok(c.forget.every((label) => labels.has(label)));
    assert.ok(
      c.after.every((q) =>
        q.labels.every(
          (label) => labels.has(label) && !c.forget.includes(label),
        ),
      ),
    );
    assert.ok(c.status !== "clarify" || c.clarification);
    for (const q of [...c.queries, ...c.after]) {
      assert.ok(q.labels.every((label) => labels.has(label)));
      for (const pattern of [...q.terms, ...(q.forbidden ?? [])])
        assert.doesNotThrow(() => new RegExp(pattern, "u"));
      for (const quote of q.quotations ?? []) {
        assert.ok(q.labels.includes(quote.label));
        assert.ok(c.text.includes(quote.literal));
        assert.doesNotThrow(() => new RegExp(quote.introduction, "u"));
        assert.doesNotThrow(() => new RegExp(quote.attribution, "u"));
      }
    }
  }
  assert.equal(families.size, 10);
  assert.ok([...families.values()].every((n) => n === 6));
  assert.equal(scopeReserve.filter((c) => c.correction).length, 5);
  assert.equal(scopeReserve.filter((c) => c.repeat).length, 6);
  assert.equal(scopeReserve.filter((c) => c.status === "clarify").length, 4);
  assert.equal(
    scopeReserve.reduce(
      (n, c) =>
        n + c.queries.length + c.after.length + Number(Boolean(c.correction)),
      0,
    ),
    247,
  );
});

test("scope protocol refuses another corpus, selected subsets and fourth rounds before any API call", () => {
  const ids = scopeReserve.map((c) => c.id),
    fingerprint = "a".repeat(64);
  const valid = {
    round: 1,
    complete: true,
    corpus: "scope-v7",
    profile,
    resolvedModel: profile.model,
    fingerprint,
    results: ids.map((id) => ({ id })),
  };
  assert.equal(
    validatePrevious(valid, 2, fingerprint, ids, "scope-v7"),
    profile.model,
  );
  assert.throws(() =>
    validatePrevious(
      { ...valid, corpus: "grouping-v6" },
      2,
      fingerprint,
      ids,
      "scope-v7",
    ),
  );
  for (const args of [
    [],
    ["--live", "--round", "4"],
    ["--live", "--round", "1", "--cases", "h01"],
  ]) {
    const result = spawnSync(
      process.execPath,
      ["prototypes/memory-core/evaluation/scope-run.ts", ...args],
      { encoding: "utf8", env: { ...process.env, OPENAI_API_KEY: "" } },
    );
    assert.equal(result.status, 1);
    assert.equal(result.stdout, "");
    assert.match(result.stderr, /LIVE_REQUIRED|FINAL_ROUND_REQUIRED/u);
  }
});
