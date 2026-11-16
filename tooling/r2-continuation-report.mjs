import { readFile, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { fresh } from "../prototypes/memory-core/evaluation/fresh.ts";

const pass = (r) => !r.error && r.checks.every((c) => c.passed);
const percentile = (values, p) => {
    const ordered = [...values].sort((a, b) => a - b);
    return ordered.length ? ordered[Math.ceil(ordered.length * p) - 1] : null;
};
function latency(results, prefix) {
    const values = results.flatMap((r) =>
        Object.entries(r.stages)
            .filter(([k]) => prefix.test(k))
            .map(([, v]) => v),
    );
    return {
        attempts: values.length,
        p50Milliseconds: percentile(values, 0.5),
        p95Milliseconds: percentile(values, 0.95),
    };
}
function summarize(report) {
    const input = report.metrics.reduce((sum, m) => sum + m.input, 0);
    const output = report.metrics.reduce((sum, m) => sum + m.output, 0);
    const families = Object.fromEntries(
        [...new Set(fresh.map((c) => c.family))].map((family) => {
            const cases = report.results.filter((r) => r.family === family);
            return [
                family,
                { passed: cases.filter(pass).length, total: cases.length },
            ];
        }),
    );
    return {
        run: report.run,
        corpus: report.corpus,
        fingerprint: report.fingerprint,
        profile: report.profile,
        resolvedModel: report.resolvedModel,
        total: report.results.length,
        passed: report.results.filter(pass).length,
        queriesReturned: report.results.reduce(
            (sum, r) => sum + r.queryCount,
            0,
        ),
        queriesPlanned: fresh.reduce(
            (sum, c) =>
                sum +
                c.queries.length +
                c.after.length +
                (c.correction ? 1 : 0),
            0,
        ),
        calls: report.metrics.length,
        tokens: { input, output },
        estimatedUsd: (input * 2.5) / 1e6 + (output * 10) / 1e6,
        families,
        latency: {
            capture: latency(report.results, /^capture$/u),
            correction: latency(report.results, /^correction$/u),
            query: latency(report.results, /^(query|after|corrected_query)/u),
            forget: latency(report.results, /^forget$/u),
        },
        failures: report.results
            .filter((r) => !pass(r))
            .map((r) => ({
                id: r.id,
                family: r.family,
                error: r.error,
                checks: r.checks.filter((c) => !c.passed),
                observations: r.observations,
                stages: r.stages,
            })),
        corrections: report.results
            .filter((r) => r.stages.correction !== undefined)
            .map((r) => {
                const checks = r.checks.filter((c) =>
                    c.name.startsWith("corrected:"),
                );
                return {
                    id: r.id,
                    appliedAndInspected: checks.length > 0,
                    currentEvidenceChecksPassed:
                        checks.length > 0 && checks.every((c) => c.passed),
                    error: r.error,
                };
            }),
    };
}
const reports = [];
for (const round of [1, 2, 3]) {
    const report = JSON.parse(
        await readFile(
            `local-data/r2/reserve-retention-frozen-${round}.json`,
            "utf8",
        ),
    );
    assert.equal(report.complete, true);
    assert.equal(report.results.length, 60);
    assert.equal(new Set(report.results.map((r) => r.id)).size, 60);
    assert.deepEqual(
        report.results.map((r) => r.id).sort(),
        fresh.map((c) => c.id).sort(),
    );
    assert.equal(report.corpus, "fresh-v2");
    assert.equal(report.profile.model, "gpt-6.1-sol");
    assert.equal(report.profile.reasoning, "medium");
    if (reports.length)
        assert.equal(report.fingerprint, reports[0].fingerprint);
    reports.push(report);
}
const rounds = reports.map(summarize);
const adjustmentNames = [
    "tuning-retention-dev1.json",
    "tuning-retention-dev2.json",
    "tuning-retention-regression1.json",
    "tuning-retention-regression2.json",
];
const adjustments = [];
for (const name of adjustmentNames) {
    const r = JSON.parse(await readFile(`local-data/r2/${name}`, "utf8"));
    adjustments.push({
        name,
        total: r.results.length,
        passed: r.results.filter(pass).length,
        calls: r.metrics.length,
        estimatedUsd: r.budget.spentUsd - r.baseline.spentUsd,
        failures: r.results
            .filter((c) => !pass(c))
            .map((c) => ({
                id: c.id,
                error: c.error,
                checks: c.checks.filter((check) => !check.passed),
            })),
    });
}
const ledger = JSON.parse(await readFile("local-data/r2/budget.json", "utf8"));
const focused = JSON.parse(
    await readFile("local-data/r2/tuning-retention-adjudication1.json", "utf8"),
);
const identity = JSON.parse(
    await readFile("local-data/r2/identity-audit-v3.json", "utf8"),
);
assert.equal(focused.complete, true);
assert.equal(identity.complete, true);
assert.equal(identity.results.length, 12);
assert.equal(focused.profile.model, "gpt-6.1-sol");
assert.equal(identity.profile.reasoning, "medium");
const report = {
    sourceCommit: "6d4813e",
    syntheticOnly: true,
    productionAccess: false,
    model: "gpt-6.1-sol",
    reasoning: "medium",
    priorEvidence: "r2-results.json",
    postBenchmark: {
        sourceCommit: "b7bd0d5",
        note: "Focused checks after the frozen benchmark; not a new full reserve and no historical regrading.",
        focused: {
            total: focused.results.length,
            passed: focused.results.filter(pass).length,
            calls: focused.metrics.length,
            estimatedUsd: focused.budget.spentUsd - focused.baseline.spentUsd,
            results: focused.results,
        },
        identity: {
            total: identity.results.length,
            passed: identity.results.filter((r) => r.passed).length,
            calls: identity.metrics.length,
            estimatedUsd: identity.budget.spentUsd - identity.baseline.spentUsd,
            results: identity.results,
        },
    },
    rounds,
    adjustments,
    localTests: {
        total: 179,
        deterministicPartialCorrection: {
            originalLocationRetained: true,
            replacedValueAbsent: true,
            providerCalls: 0,
        },
    },
    threshold: { global: 0.95, perFamily: 0.95, unresolvedCritical: 0 },
    passedGate: rounds.every(
        (r) =>
            r.passed / r.total >= 0.95 &&
            Object.values(r.families).every(
                (f) => f.passed / f.total >= 0.95,
            ) &&
            !r.failures.some((f) => f.checks.some((c) => c.critical)),
    ),
    interpretationLimits: [
        "Lexical oracle is not universal semantic equivalence; alerts need adjudication.",
        "Three rounds reuse sixty stories, not 180 different stories.",
        "No inventory-scale retrieval, Firestore, mobile or migration validation.",
    ],
    cost: {
        cumulativeR2EstimatedUsd: ledger.spentUsd,
        thisContinuationEstimatedUsd: ledger.spentUsd - 7.092565,
        uncertainReservedUsd: ledger.reservedUsd,
        previousM0EstimatedUsd: ledger.previousM0Spent,
        notAccountBalance: true,
    },
};
await writeFile(
    "docs/09-planning/evidence/r2-retention-results.json",
    JSON.stringify(report, null, 2) + "\n",
);
console.log(
    JSON.stringify({
        rounds: rounds.map((r) => ({
            run: r.run,
            passed: r.passed,
            total: r.total,
            queries: r.queriesReturned,
            calls: r.calls,
            estimatedUsd: r.estimatedUsd,
        })),
        cost: report.cost,
        passedGate: report.passedGate,
    }),
);
