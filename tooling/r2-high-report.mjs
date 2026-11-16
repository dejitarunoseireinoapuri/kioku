import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const ids = Array.from(
    { length: 60 },
    (_, i) => `i${String(i + 1).padStart(2, "0")}`,
);
const percentile = (values, p) =>
    values.toSorted((a, b) => a - b)[Math.ceil(values.length * p) - 1] ?? null;
const passed = (r) => r.error === null && r.checks.every((c) => c.passed);
const rounds = [];
for (let round = 1; round <= 3; round++) {
    const bytes = await readFile(
        `local-data/r2/reserve-high-independent-${round}.json`,
    );
    const r = JSON.parse(bytes);
    assert.equal(r.complete, true);
    assert.equal(r.round, round);
    assert.equal(r.corpus, "high-v8");
    assert.equal(r.profile.model, "gpt-6.1-sol");
    assert.equal(r.profile.reasoning, "high");
    assert.equal(r.expectedCases, 60);
    assert.equal(r.expectedQueries, 252);
    assert.equal(
        r.fingerprint,
        "8acbb1f6a8454b9a73a37b163f852b96843636b0301a93c5f0626b0a005459ef",
    );
    assert.deepEqual(r.results.map((x) => x.id).sort(), ids);
    if (round > 1) assert.equal(r.resolvedModel, rounds[0].resolvedModel);
    const families = [...new Set(r.results.map((x) => x.family))]
        .sort()
        .map((family) => {
            const cases = r.results.filter((x) => x.family === family);
            assert.equal(cases.length, 6);
            return {
                family,
                total: cases.length,
                passed: cases.filter(passed).length,
            };
        });
    assert.equal(families.length, 10);
    const critical = r.results.flatMap((x) =>
        x.checks.filter((c) => c.critical && !c.passed),
    ).length;
    const latency = Object.fromEntries(
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
    );
    rounds.push({
        round,
        profile: r.profile,
        resolvedModel: r.resolvedModel,
        fingerprint: r.fingerprint,
        reportSha256: createHash("sha256").update(bytes).digest("hex"),
        total: 60,
        passed: r.results.filter(passed).length,
        families,
        criticalChecksFailed: critical,
        semanticGatePassed:
            r.results.filter(passed).length / 60 >= 0.95 &&
            families.every((f) => f.passed / 6 >= 0.95) &&
            critical === 0,
        latency,
        queriesReturned: r.results.reduce((n, x) => n + x.queryCount, 0),
        queriesExpected: 252,
        calls: r.metrics.length,
        inputTokens: r.metrics.reduce((n, x) => n + x.input, 0),
        outputTokens: r.metrics.reduce((n, x) => n + x.output, 0),
        spentUsd: r.budget.spentUsd - r.baseline.spentUsd,
        uncertainReservationDeltaUsd:
            r.budget.reservedUsd - r.baseline.reservedUsd,
        cases: r.results
            .toSorted((a, b) => a.id.localeCompare(b.id))
            .map((x) => ({
                id: x.id,
                passed: passed(x),
                error: x.error,
                failures: x.checks
                    .filter((c) => !c.passed)
                    .map(({ name, critical }) => ({ name, critical })),
                stages: x.stages,
                queryCount: x.queryCount,
                observations: x.observations,
            })),
    });
}
const preflight = [];
for (const name of ["high-preflight", "high-scope-regression"]) {
    const r = JSON.parse(
        await readFile(`local-data/r2/tuning-${name}.json`, "utf8"),
    );
    assert.equal(r.complete, true);
    preflight.push({
        name,
        profile: r.profile,
        fingerprint: r.fingerprint,
        total: r.results.length,
        passed: r.results.filter(passed).length,
        spentUsd: r.budget.spentUsd - r.baseline.spentUsd,
        calls: r.metrics.length,
        cases: r.results.map((x) => ({
            id: x.id,
            error: x.error,
            failures: x.checks.filter((c) => !c.passed).map((c) => c.name),
        })),
    });
}
const budget = JSON.parse(await readFile("local-data/r2/budget.json", "utf8"));
const regressions = [];
for (const [name, count] of [
    ["high-targeted", 8],
    ["high-full", 60],
    ["high-controls", 3],
    ["high-final-contrast", 5],
]) {
    let bytes;
    try {
        bytes = await readFile(`local-data/r2/tuning-${name}.json`);
    } catch (error) {
        if (error?.code === "ENOENT") continue;
        throw error;
    }
    const r = JSON.parse(bytes);
    assert.equal(r.complete, true);
    assert.equal(r.results.length, count);
    assert.equal(r.profile.reasoning, "high");
    regressions.push({
        name,
        profile: r.profile,
        resolvedModel: r.resolvedModel,
        fingerprint: r.fingerprint,
        reportSha256: createHash("sha256").update(bytes).digest("hex"),
        total: count,
        passed: r.results.filter(passed).length,
        queriesReturned: r.results.reduce((n, x) => n + x.queryCount, 0),
        spentUsd: r.budget.spentUsd - r.baseline.spentUsd,
        uncertainReservationDeltaUsd:
            r.budget.reservedUsd - r.baseline.reservedUsd,
        calls: r.metrics.length,
        cases: r.results
            .toSorted((a, b) => a.id.localeCompare(b.id))
            .map((x) => ({
                id: x.id,
                passed: passed(x),
                error: x.error,
                failures: x.checks
                    .filter((c) => !c.passed)
                    .map(({ name, critical }) => ({ name, critical })),
                stages: x.stages,
                queryCount: x.queryCount,
                observations: x.observations,
            })),
    });
}
const result = {
    evaluatedCodeCommit: "5de2f5f5ac89a39a684914fb944a509f74b25a77",
    status: "open",
    corpus: "high-v8",
    independentFromEarlierCorpora: true,
    externalAudit: false,
    controlledMediumComparison: false,
    baselineSpentUsd: 75.79987,
    budget,
    preflight,
    rounds,
    regressions,
};
await writeFile(
    "docs/09-planning/evidence/r2-high-results.json",
    JSON.stringify(result, null, 2) + "\n",
);
console.log(
    JSON.stringify({
        rounds: rounds.map(
            ({
                round,
                passed,
                calls,
                spentUsd,
                semanticGatePassed,
                latency,
            }) => ({
                round,
                passed,
                calls,
                spentUsd,
                semanticGatePassed,
                latency,
            }),
        ),
        budget,
        regressions: regressions.map(({ name, total, passed, spentUsd }) => ({
            name,
            total,
            passed,
            spentUsd,
        })),
    }),
);
