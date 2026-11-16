import { readFile, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";

const load = async (name) =>
    JSON.parse(await readFile(`local-data/r2/${name}.json`, "utf8"));
const names = [1, 2, 3].map((round) => `reserve-indexed-frozen-${round}`);
const rounds = await Promise.all(names.map(load));
const adjustments = await Promise.all(
    [
        "tuning-indexed-adjustment-1",
        "tuning-late-adjustment-1",
        "tuning-late-adjustment-2",
        "tuning-indexed-regression-1",
    ].map(load),
);
const scale = await load("scale-retrieval-adjustment-1");
const ledger = await load("budget");
const passed = (r) => r.error === null && r.checks.every((c) => c.passed);
const percentile = (values, p) => {
    const sorted = values.toSorted((a, b) => a - b);
    return sorted[Math.ceil(sorted.length * p) - 1] ?? null;
};
for (const round of rounds) {
    assert.equal(round.complete, true);
    assert.equal(round.corpus, "holdout-v3");
    assert.equal(round.results.length, 60);
    assert.equal(new Set(round.results.map((r) => r.id)).size, 60);
    assert.equal(round.profile.model, "gpt-6.1-sol");
    assert.equal(round.profile.reasoning, "medium");
    assert.equal(round.resolvedModel, rounds[0].resolvedModel);
    assert.equal(round.fingerprint, rounds[0].fingerprint);
}
function summarize(run) {
    assert.equal(run.complete, true);
    const families = [...new Set(run.results.map((r) => r.family))].map(
        (family) => {
            const cases = run.results.filter((r) => r.family === family);
            return {
                family,
                total: cases.length,
                passed: cases.filter(passed).length,
            };
        },
    );
    const durations = (prefix) =>
        run.results.flatMap((r) =>
            Object.entries(r.stages)
                .filter(([key]) =>
                    prefix === "query"
                        ? /^(query|after|corrected_query)\d+$/u.test(key)
                        : key.startsWith(prefix),
                )
                .map(([, v]) => v),
        );
    return {
        run: run.run,
        fingerprint: run.fingerprint,
        total: run.results.length,
        passed: run.results.filter(passed).length,
        families,
        queriesReturned: run.results.reduce((n, r) => n + r.queryCount, 0),
        calls: run.metrics.length,
        spentUsd: run.budget.spentUsd - run.baseline.spentUsd,
        latency: Object.fromEntries(
            ["capture", "query", "correction", "clarification", "forget"].map(
                (stage) => [
                    stage,
                    {
                        attempts: durations(stage).length,
                        p50: percentile(durations(stage), 0.5),
                        p95: percentile(durations(stage), 0.95),
                    },
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
                stages: r.stages,
                observations: r.observations,
            })),
        results: run.results,
        metrics: run.metrics,
    };
}
const summaries = rounds.map(summarize);
const phaseGatePassed = summaries.every(
    (r) =>
        r.passed / r.total >= 0.95 &&
        r.families.every((f) => f.passed / f.total >= 0.95) &&
        r.failures.every((f) => f.checks.every((c) => !c.critical)),
);
assert.equal(scale.complete, true);
assert.equal(scale.rows.length, 18);
const report = {
    profile: rounds[0].profile,
    sourceCommit: "e3d03c2969281f125b6e479146d579df253cd899",
    corpus: "holdout-v3",
    independentStories: 60,
    plannedQueriesPerRound: 245,
    phaseGatePassed,
    rounds: summaries,
    adjustments: adjustments.map(summarize),
    scale,
    scaleScope:
        "retrieval and repeat interpretation only; mutation store remains 256 units, no Firebase or native app",
    ledger,
    continuationSpentUsd: ledger.spentUsd - 16.93638750000003,
    validation: {
        coreTests: 93,
        legacyTests: 102,
        transientLegacyFileTest:
            "EPERM once in combined run; isolated and legacy suite subsequently pass unchanged",
        native: false,
        firebase: false,
    },
};
function inspect(value) {
    if (!value || typeof value !== "object") return;
    for (const [key, child] of Object.entries(value)) {
        assert.ok(
            ![
                "text",
                "prompt",
                "question",
                "sourceText",
                "apiKey",
                "output_text",
            ].includes(key),
        );
        inspect(child);
    }
}
inspect(report);
const encoded = JSON.stringify(report, null, 2) + "\n";
assert.equal(/sk-(?:proj-)?[A-Za-z0-9_-]{20,}/u.test(encoded), false);
await writeFile("docs/09-planning/evidence/r2-indexed-results.json", encoded);
console.log(
    JSON.stringify({
        rounds: summaries.map((r) => ({
            run: r.run,
            passed: r.passed,
            queries: r.queriesReturned,
            calls: r.calls,
            cost: r.spentUsd,
        })),
        phaseGatePassed,
        continuationSpentUsd: report.continuationSpentUsd,
    }),
);
