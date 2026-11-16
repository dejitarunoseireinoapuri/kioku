import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";

const args = process.argv.slice(2);
assert.ok(
    args.length === 0 ||
        (args.length === 1 && ["--grouping", "--scope"].includes(args[0])),
);
const grouping = args[0] === "--grouping";
const scope = args[0] === "--scope";
const corpus = scope ? "scope-v7" : grouping ? "grouping-v6" : "independent-v5";
const prefix = scope ? "scope" : grouping ? "grouping" : "final";
const rounds = await Promise.all(
    [1, 2, 3].map(async (round) =>
        JSON.parse(
            await readFile(
                `local-data/r2/reserve-${prefix}-independent-${round}.json`,
                "utf8",
            ),
        ),
    ),
);
const expectedIds = Array.from(
    { length: 60 },
    (_, i) =>
        `${scope ? "h" : grouping ? "g" : "f"}${String(i + 1).padStart(2, "0")}`,
);
const passed = (r) => r.error === null && r.checks.every((c) => c.passed);
const percentile = (values, p) =>
    values.toSorted((a, b) => a - b)[Math.ceil(values.length * p) - 1] ?? null;
function summarize(run, index) {
    assert.equal(run.complete, true);
    assert.equal(run.round, index + 1);
    assert.equal(run.corpus, corpus);
    assert.equal(run.expectedCases, 60);
    assert.equal(run.expectedQueries, 247);
    assert.equal(run.profile.model, "gpt-6.1-sol");
    assert.equal(run.profile.reasoning, "medium");
    assert.equal(run.resolvedModel, rounds[0].resolvedModel);
    assert.equal(run.fingerprint, rounds[0].fingerprint);
    assert.deepEqual(run.results.map((r) => r.id).sort(), expectedIds);
    const families = [...new Set(run.results.map((r) => r.family))]
        .sort()
        .map((family) => {
            const cases = run.results.filter((r) => r.family === family);
            assert.equal(cases.length, 6);
            return {
                family,
                total: cases.length,
                passed: cases.filter(passed).length,
            };
        });
    assert.equal(families.length, 10);
    const count = run.results.filter(passed).length;
    const critical = run.results.flatMap((r) =>
        r.checks.filter((c) => c.critical && !c.passed),
    );
    return {
        round: run.round,
        total: 60,
        passed: count,
        families,
        gatePassed:
            count / 60 >= 0.95 &&
            families.every((f) => f.passed / f.total >= 0.95) &&
            critical.length === 0,
        criticalChecksFailed: critical.length,
        queriesReturned: run.results.reduce((n, r) => n + r.queryCount, 0),
        queriesExpected: 247,
        calls: run.metrics.length,
        spentUsd: run.budget.spentUsd - run.baseline.spentUsd,
        latency: Object.fromEntries(
            ["capture", "clarification", "correction", "query", "forget"].map(
                (stage) => {
                    const values = run.results.flatMap((r) =>
                        Object.entries(r.stages)
                            .filter(([name]) =>
                                stage === "query"
                                    ? /^(query|after|corrected_query)\d+$/u.test(
                                          name,
                                      )
                                    : name === stage,
                            )
                            .map(([, ms]) => ms),
                    );
                    return [
                        stage,
                        {
                            attempts: values.length,
                            p50: percentile(values, 0.5),
                            p95: percentile(values, 0.95),
                            maximum: values.length ? Math.max(...values) : null,
                        },
                    ];
                },
            ),
        ),
        cases: run.results
            .toSorted((a, b) => a.id.localeCompare(b.id))
            .map((r) => ({
                id: r.id,
                family: r.family,
                passed: passed(r),
                error: r.error,
                queryCount: r.queryCount,
                failures: r.checks.filter((c) => !c.passed),
                ...(passed(r)
                    ? {}
                    : { observations: r.observations, stages: r.stages }),
            })),
    };
}
const summaries = rounds.map(summarize);
const report = {
    profile: rounds[0].profile,
    resolvedModel: rounds[0].resolvedModel,
    corpus,
    fingerprint: rounds[0].fingerprint,
    scope: "synthetic_only_no_firebase_no_mobile_no_migration",
    semanticGatePassed: summaries.every((r) => r.gatePassed),
    baselineSpentUsd: rounds[0].baseline.spentUsd,
    finalSpentUsd: rounds[2].budget.spentUsd,
    spentThisEvaluationUsd:
        rounds[2].budget.spentUsd - rounds[0].baseline.spentUsd,
    uncertainReservationUsd: rounds[2].budget.reservedUsd,
    previousM0SpentUsd: rounds[2].budget.previousM0Spent,
    rounds: summaries,
};
if (grouping) {
    const regressions = await Promise.all(
        ["grouping-diagnostic-1", "grouping-regression-1"].map(
            async (name, index) => {
                const run = JSON.parse(
                    await readFile(`local-data/r2/tuning-${name}.json`, "utf8"),
                );
                assert.equal(run.complete, true);
                assert.equal(run.corpus, "regression-v5");
                assert.deepEqual(run.profile, rounds[0].profile);
                assert.equal(run.resolvedModel, rounds[0].resolvedModel);
                const ids =
                    index === 0
                        ? ["f04", "f21", "f37", "f41", "f49", "f53"]
                        : Array.from(
                              { length: 60 },
                              (_, i) => `f${String(i + 1).padStart(2, "0")}`,
                          );
                assert.deepEqual(run.results.map((r) => r.id).sort(), ids);
                return {
                    name,
                    corpus: run.corpus,
                    fingerprint: run.fingerprint,
                    total: run.results.length,
                    passed: run.results.filter(passed).length,
                    calls: run.metrics.length,
                    baselineSpentUsd: run.baseline.spentUsd,
                    spentUsd: run.budget.spentUsd - run.baseline.spentUsd,
                    queriesReturned: run.results.reduce(
                        (n, r) => n + r.queryCount,
                        0,
                    ),
                    cases: run.results
                        .toSorted((a, b) => a.id.localeCompare(b.id))
                        .map((r) => ({
                            id: r.id,
                            passed: passed(r),
                            error: r.error,
                            failures: r.checks.filter((c) => !c.passed),
                        })),
                };
            },
        ),
    );
    report.regressions = regressions;
    report.continuationBaselineSpentUsd = regressions[0].baselineSpentUsd;
    report.spentWholeContinuationUsd =
        report.finalSpentUsd - regressions[0].baselineSpentUsd;
}
if (scope) {
    const names = [
        "followup1-baseline",
        "followup1-network",
        "followup1-directed",
        "followup1-g-full",
        "followup1-f-full",
    ];
    const regressions = [];
    for (const [index, name] of names.entries()) {
        const run = JSON.parse(
            await readFile(`local-data/r2/tuning-${name}.json`, "utf8"),
        );
        const targeted = [
            "g05",
            "g23",
            "g24",
            "g33",
            "g36",
            "g38",
            "g45",
            "g53",
            "g58",
        ];
        const ids =
            index < 3
                ? targeted
                : Array.from(
                      { length: 60 },
                      (_, i) =>
                          `${index === 3 ? "g" : "f"}${String(i + 1).padStart(2, "0")}`,
                  );
        assert.equal(run.complete, true);
        assert.equal(
            run.corpus,
            index === 4 ? "regression-v5" : "regression-v6",
        );
        assert.deepEqual(run.profile, rounds[0].profile);
        assert.ok(
            run.resolvedModel === rounds[0].resolvedModel ||
                (index === 0 && run.resolvedModel === null),
        );
        assert.deepEqual(run.results.map((r) => r.id).sort(), ids);
        regressions.push({
            name,
            corpus: run.corpus,
            fingerprint: run.fingerprint,
            total: run.results.length,
            passed: run.results.filter(passed).length,
            calls: run.metrics.length,
            baselineSpentUsd: run.baseline.spentUsd,
            spentUsd: run.budget.spentUsd - run.baseline.spentUsd,
            uncertainReservationDeltaUsd:
                run.budget.reservedUsd - run.baseline.reservedUsd,
            queriesReturned: run.results.reduce((n, r) => n + r.queryCount, 0),
            cases: run.results
                .toSorted((a, b) => a.id.localeCompare(b.id))
                .map((r) => ({
                    id: r.id,
                    passed: passed(r),
                    error: r.error,
                    failures: r.checks.filter((c) => !c.passed),
                    ...(passed(r) ? {} : { observations: r.observations }),
                })),
        });
    }
    report.regressions = regressions;
    report.continuationBaselineSpentUsd = regressions[0].baselineSpentUsd;
    report.spentWholeContinuationUsd =
        report.finalSpentUsd - regressions[0].baselineSpentUsd;
}
function audit(value) {
    if (typeof value === "string")
        assert.ok(/^[A-Za-z0-9_:.-]{1,200}$/u.test(value));
    else if (Array.isArray(value)) value.forEach(audit);
    else if (value && typeof value === "object")
        for (const [key, item] of Object.entries(value)) {
            assert.ok(
                !/^(text|literal|question|content|prompt|key|authorization|token)$/iu.test(
                    key,
                ),
            );
            audit(item);
        }
}
audit(report);
await writeFile(
    `docs/09-planning/evidence/r2-${prefix}-results.json`,
    JSON.stringify(report, null, 2) + "\n",
);
console.log(
    JSON.stringify({
        passed: summaries.map((r) => r.passed),
        semanticGatePassed: report.semanticGatePassed,
        spentUsd: report.spentThisEvaluationUsd,
        finalSpentUsd: report.finalSpentUsd,
    }),
);
