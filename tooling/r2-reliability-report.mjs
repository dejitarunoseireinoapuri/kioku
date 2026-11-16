import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";

const load = async (name) =>
    JSON.parse(await readFile(`local-data/r2/${name}.json`, "utf8"));
const names = [
    "rejection-diagnosis-1",
    "reliability-adjustment-1",
    "ownership-diagnosis-1",
    "reliability-adjustment-2",
    "reliability-new-1",
    "reliability-regression-1",
    "reliability-new-2",
    "reliability-new-3",
];
const runs = await Promise.all(names.map((name) => load(`tuning-${name}`)));
const diagnostic = await load("diagnostic-closed-rejections");
const percentile = (values, p) =>
    values.toSorted((a, b) => a - b)[Math.ceil(values.length * p) - 1] ?? null;
const passed = (result) =>
    result.error === null && result.checks.every((c) => c.passed);
function summarize(run) {
    assert.equal(run.complete, true);
    assert.equal(run.profile.model, "gpt-6.1-sol");
    assert.equal(run.profile.reasoning, "medium");
    assert.equal(run.resolvedModel, "gpt-6.1-sol");
    return {
        run: run.run,
        corpus: run.corpus,
        fingerprint: run.fingerprint,
        total: run.results.length,
        passed: run.results.filter(passed).length,
        queries: run.results.reduce((sum, r) => sum + r.queryCount, 0),
        calls: run.metrics.length,
        spentUsd: run.budget.spentUsd - run.baseline.spentUsd,
        families: [...new Set(run.results.map((r) => r.family))].map(
            (family) => ({
                family,
                total: run.results.filter((r) => r.family === family).length,
                passed: run.results.filter(
                    (r) => r.family === family && passed(r),
                ).length,
            }),
        ),
        latencyP95: Object.fromEntries(
            ["capture", "correction", "clarification", "query", "forget"].map(
                (stage) => [
                    stage,
                    percentile(
                        run.results.flatMap((r) =>
                            Object.entries(r.stages)
                                .filter(([name]) =>
                                    stage === "query"
                                        ? /^(query|after|corrected_query)\d+$/u.test(
                                              name,
                                          )
                                        : name === stage,
                                )
                                .map(([, ms]) => ms),
                        ),
                        0.95,
                    ),
                ],
            ),
        ),
        failures: run.results
            .filter((r) => !passed(r))
            .map((r) => ({
                id: r.id,
                family: r.family,
                error: r.error,
                checks: r.checks.filter((c) => !c.passed),
                observations: r.observations,
            })),
    };
}
const final = runs.at(-1);
const summaries = runs.map(summarize);
assert.equal(runs.at(-2).fingerprint, final.fingerprint);
assert.equal(diagnostic.complete, true);
assert.equal(diagnostic.profile.reasoning, "medium");
const report = {
    profile: final.profile,
    phaseGate: "open_fresh_reserve_required",
    scope: "synthetic_only_no_firebase_no_mobile_no_migration",
    finalFocusedRoundsSameFingerprint: true,
    baselineSpentUsd: runs[0].baseline.spentUsd,
    finalSpentUsd: final.budget.spentUsd,
    spentThisContinuationUsd: final.budget.spentUsd - runs[0].baseline.spentUsd,
    preservedUncertainReservationUsd: final.budget.reservedUsd,
    previousM0SpentUsd: final.budget.previousM0Spent,
    runs: summaries,
    diagnostic: {
        captures: diagnostic.captures,
        bases: diagnostic.bases,
        queryPassed: passed(diagnostic.query),
        calls: diagnostic.budget.calls - diagnostic.baseline.calls,
        spentUsd: diagnostic.budget.spentUsd - diagnostic.baseline.spentUsd,
        interpretation: "model_basis_is_diagnostic_not_independent_proof",
    },
};
// Export only closed diagnostics and aggregate checks, never model/source prose.
function audit(value) {
    if (typeof value === "string")
        assert.ok(/^[A-Za-z0-9_:.-]{1,200}$/u.test(value));
    else if (Array.isArray(value)) value.forEach(audit);
    else if (value && typeof value === "object") {
        for (const [key, item] of Object.entries(value)) {
            assert.ok(
                !/^(text|literal|question|content|prompt|key|authorization|token)$/iu.test(
                    key,
                ),
            );
            audit(item);
        }
    }
}
audit(report);
await writeFile(
    "docs/09-planning/evidence/r2-reliability-results.json",
    JSON.stringify(report, null, 2) + "\n",
);
console.log(
    JSON.stringify({
        runs: summaries.length,
        spentUsd: report.spentThisContinuationUsd,
        finalSpentUsd: report.finalSpentUsd,
        phaseGate: report.phaseGate,
    }),
);
