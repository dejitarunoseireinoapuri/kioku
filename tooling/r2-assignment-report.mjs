import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

// Fixed exposed runs, closed observations only. No provider calls or historical rewrites.
const names = ["diagnostic", "targeted", "h-full", "g-controls", "h49-wording"];
const expectedIds = {
    diagnostic: ["h30", "h49", "h53"],
    targeted: ["h26", "h30", "h43", "h49", "h52", "h53"],
    "h-full": Array.from(
        { length: 60 },
        (_, i) => `h${String(i + 1).padStart(2, "0")}`,
    ),
    "g-controls": [
        "g05",
        "g23",
        "g24",
        "g33",
        "g36",
        "g38",
        "g45",
        "g53",
        "g58",
    ],
    "h49-wording": ["h49"],
};
const percentile = (values, p) =>
    values.toSorted((a, b) => a - b)[Math.ceil(values.length * p) - 1] ?? null;
const runs = [];
for (const name of names) {
    const bytes = await readFile(`local-data/r2/tuning-followup2-${name}.json`);
    const r = JSON.parse(bytes);
    assert.equal(r.complete, true);
    assert.equal(r.run, `followup2-${name}`);
    assert.deepEqual(r.results.map((x) => x.id).sort(), expectedIds[name]);
    assert.equal(
        r.corpus,
        name === "diagnostic"
            ? "regression-v7-original"
            : name === "g-controls"
              ? "regression-v6"
              : "regression-v7-adapted",
    );
    assert.equal(r.profile.model, "gpt-6.1-sol");
    assert.equal(r.profile.reasoning, "medium");
    assert.ok(r.resolvedModel);
    runs.push({
        name,
        reportSha256: createHash("sha256").update(bytes).digest("hex"),
        corpus: r.corpus,
        fingerprint: r.fingerprint,
        profile: r.profile,
        resolvedModel: r.resolvedModel,
        total: r.results.length,
        passed: r.results.filter(
            (x) => !x.error && x.checks.every((c) => c.passed),
        ).length,
        calls: r.metrics.length,
        spentUsd: r.budget.spentUsd - r.baseline.spentUsd,
        uncertainReservationDeltaUsd:
            r.budget.reservedUsd - r.baseline.reservedUsd,
        queriesReturned: r.results.reduce((n, x) => n + x.queryCount, 0),
        criticalChecksFailed: r.results.flatMap((x) =>
            x.checks.filter((c) => c.critical && !c.passed),
        ).length,
        latency: Object.fromEntries(
            ["capture", "clarification", "correction", "query", "forget"].map(
                (stage) => {
                    const values = r.results.flatMap((x) =>
                        Object.entries(x.stages)
                            .filter(([key]) =>
                                stage === "query"
                                    ? /^(query|after|corrected_query)\d+$/u.test(
                                          key,
                                      )
                                    : key === stage,
                            )
                            .map(([, ms]) => ms),
                    );
                    return [
                        stage,
                        {
                            attempts: values.length,
                            p50: percentile(values, 0.5),
                            p95: percentile(values, 0.95),
                        },
                    ];
                },
            ),
        ),
        cases: r.results
            .toSorted((a, b) => a.id.localeCompare(b.id))
            .map((x) => ({
                id: x.id,
                error: x.error,
                passed: !x.error && x.checks.every((c) => c.passed),
                failures: x.checks
                    .filter((c) => !c.passed)
                    .map((c) => ({ name: c.name, critical: c.critical })),
                observations: x.observations,
            })),
    });
}
const ledger = JSON.parse(await readFile("local-data/r2/budget.json", "utf8"));
assert.ok(Math.abs(ledger.reservedUsd - 1.78895) < 1e-9);
assert.ok(Math.abs(ledger.previousM0Spent - 21.71988544) < 1e-9);
assert.ok(ledger.spentUsd + ledger.reservedUsd <= 80);
assert.ok(
    Math.abs(
        runs.reduce((sum, r) => sum + r.spentUsd, 0) -
            (ledger.spentUsd - 71.2454975),
    ) < 1e-9,
);
const output = {
    status: "open",
    independentEvaluation: false,
    historicalReportsUnchanged: true,
    continuation: 2,
    finalContinuation: true,
    evaluatedCodeCommit: "26175f81c8c3e83a1db6ee657ee551d4cc46f859",
    postFreezeRevision: {
        run: "followup2-h49-wording",
        changed: "h49-specific-question-only",
        fullRegressionRepeated: false,
    },
    baselineSpentUsd: 71.2454975,
    spentWholeContinuationUsd: ledger.spentUsd - 71.2454975,
    budget: ledger,
    runs,
};
await writeFile(
    "docs/09-planning/evidence/r2-assignment-results.json",
    JSON.stringify(output, null, 2) + "\n",
);
console.log(
    JSON.stringify({
        status: output.status,
        runs: runs.map(({ name, total, passed, spentUsd }) => ({
            name,
            total,
            passed,
            spentUsd,
        })),
        spentUsd: ledger.spentUsd,
        reservedUsd: ledger.reservedUsd,
    }),
);
