import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { boundedReserve } from "../evaluation/bounded.ts";
import { highRegression } from "../evaluation/high-regression.ts";
import { scopeReserve } from "../evaluation/scope.ts";
import { groupingReserve } from "../evaluation/grouping.ts";
import { finalReserve } from "../evaluation/final.ts";
import { reserve } from "../evaluation/reserve.ts";
import { fresh } from "../evaluation/fresh.ts";
import { holdout } from "../evaluation/holdout.ts";
import { tuning } from "../evaluation/tuning.ts";
import { reliability } from "../evaluation/reliability.ts";
import { adjustment } from "../evaluation/adjustment.ts";
import { calendar } from "../ai/calendar.ts";

test("bounded reserve is a fresh balanced corpus with complete references and explicit changes", () => {
  const used = new Set(
    [
      highRegression,
      scopeReserve,
      groupingReserve,
      finalReserve,
      reserve,
      fresh,
      holdout,
      tuning,
      reliability,
      adjustment,
    ]
      .flat()
      .map((c) => c.text.normalize("NFKC").toLowerCase()),
  );
  assert.equal(boundedReserve.length, 60);
  assert.equal(new Set(boundedReserve.map((c) => c.text)).size, 60);
  assert.deepEqual(
    boundedReserve.map((c) => c.id),
    Array.from({ length: 60 }, (_, i) => `j${String(i + 1).padStart(2, "0")}`),
  );
  const families = new Map<string, number>();
  for (const c of boundedReserve) {
    assert.ok(!used.has(c.text.normalize("NFKC").toLowerCase()));
    families.set(c.family, (families.get(c.family) ?? 0) + 1);
    const labels = c.units.map((u) => u.label),
      removed = [...c.forget, ...(c.forgetClosure ?? [])];
    assert.equal(new Set(labels).size, labels.length);
    assert.ok(c.queries.length >= 2 && c.after.length >= 2);
    assert.ok(removed.every((l) => labels.includes(l)));
    assert.ok(
      c.expectedRelations.every(
        (r) => labels.includes(r.from) && labels.includes(r.to),
      ),
    );
    for (const q of [...c.queries, ...c.after]) {
      assert.ok(
        [...q.labels, ...(q.contextLabels ?? [])].every((l) =>
          labels.includes(l),
        ),
      );
      for (const p of [...q.terms, ...(q.forbidden ?? [])])
        assert.doesNotThrow(() => new RegExp(p, "u"));
    }
    assert.ok(
      c.after.every((q) => q.labels.every((l) => !removed.includes(l))),
    );
    if (c.status === "clarify") assert.ok(c.clarification);
    for (const u of [
      ...c.units,
      ...(c.correction ? [c.correction.expected] : []),
    ])
      for (const p of [
        ...u.terms,
        ...(u.evidenceTerms ?? []),
        ...(u.forbidden ?? []),
        ...(u.condition ? [u.condition] : []),
      ])
        assert.doesNotThrow(() => new RegExp(p, "u"));
  }
  assert.equal(families.size, 10);
  assert.ok([...families.values()].every((n) => n === 6));
  assert.equal(boundedReserve.filter((c) => c.correction).length, 6);
  assert.equal(boundedReserve.filter((c) => c.repeat).length, 7);
  assert.equal(boundedReserve.filter((c) => c.status === "clarify").length, 4);
  assert.equal(
    boundedReserve.reduce(
      (n, c) =>
        n + c.queries.length + c.after.length + Number(Boolean(c.correction)),
      0,
    ),
    250,
  );
  for (const [id, field] of [
    ["j25", "tomorrow"],
    ["j29", "yesterday"],
  ] as const) {
    const c = boundedReserve.find((c) => c.id === id)!;
    assert.equal(c.units[0]!.time.value, calendar(c.at, c.zone)[field]);
  }
});

test("bounded reserve rejects missing live consent, subsets and a fourth round before provider access", () => {
  for (const args of [
    [],
    ["--live", "--round", "4"],
    ["--live", "--round", "1", "--cases", "j01"],
  ]) {
    const result = spawnSync(
      process.execPath,
      ["prototypes/memory-core/evaluation/bounded-run.ts", ...args],
      { encoding: "utf8", env: { ...process.env, OPENAI_API_KEY: "" } },
    );
    assert.equal(result.status, 1);
    assert.match(result.stderr, /LIVE_REQUIRED|FINAL_ROUND_REQUIRED/u);
  }
});
