import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const frozenFingerprint =
    "b1a23691c36e98c04f745f3bd8c872e51bf0c8279646f1001d03ffcb0126dda9";
const ids = Array.from(
    { length: 60 },
    (_, i) => `j${String(i + 1).padStart(2, "0")}`,
);
const passed = (r) => r.error === null && r.checks.every((c) => c.passed);
const percentile = (values, p) =>
    values.toSorted((a, b) => a - b)[Math.ceil(values.length * p) - 1] ?? null;
const rounds = [];
let model = null;
for (let round = 1; round <= 3; round++) {
    let bytes;
    try {
        bytes = await readFile(
            `local-data/r2/reserve-bounded-independent-${round}.json`,
        );
    } catch (error) {
        if (error?.code !== "ENOENT") throw error;
        rounds.push({ round, complete: false, notRun: true });
        continue;
    }
    const r = JSON.parse(bytes);
    assert.equal(r.corpus, "bounded-v9");
    assert.equal(r.round, round);
    assert.equal(r.profile.model, "gpt-6.1-sol");
    assert.equal(r.profile.reasoning, "high");
    assert.equal(r.fingerprint, frozenFingerprint);
    assert.equal(r.authorizedWindow.id, "bounded-v9");
    assert.equal(r.authorizedWindow.additionalUsd, 15);
    assert.equal(r.expectedCases, 60);
    assert.equal(r.expectedQueries, 250);
    assert.ok(r.results.every((x) => ids.includes(x.id)));
    assert.equal(new Set(r.results.map((x) => x.id)).size, r.results.length);
    if (r.complete) assert.deepEqual(r.results.map((x) => x.id).sort(), ids);
    if (model !== null && r.resolvedModel !== null)
        assert.equal(r.resolvedModel, model);
    model ??= r.resolvedModel;
    const families = [...new Set(r.results.map((x) => x.family))]
        .sort()
        .map((family) => {
            const cases = r.results.filter((x) => x.family === family);
            return {
                family,
                total: cases.length,
                passed: cases.filter(passed).length,
            };
        });
    const critical = r.results.flatMap((x) =>
        x.checks.filter((c) => c.critical && !c.passed),
    ).length;
    const latency = Object.fromEntries(
        ["capture", "clarification", "correction", "query", "forget"].map(
            (stage) => {
                const ms = r.results.flatMap((x) =>
                    Object.entries(x.stages)
                        .filter(([k]) =>
                            stage === "query"
                                ? /^(query|after|corrected_query)\d+$/u.test(k)
                                : k === stage,
                        )
                        .map(([, v]) => v),
                );
                return [
                    stage,
                    {
                        attempts: ms.length,
                        p50: percentile(ms, 0.5),
                        p95: percentile(ms, 0.95),
                    },
                ];
            },
        ),
    );
    rounds.push({
        round,
        complete: r.complete,
        profile: r.profile,
        resolvedModel: r.resolvedModel,
        fingerprint: r.fingerprint,
        reportSha256: createHash("sha256").update(bytes).digest("hex"),
        total: r.results.length,
        passed: r.results.filter(passed).length,
        families,
        criticalChecksFailed: critical,
        semanticGatePassed:
            r.complete &&
            r.results.filter(passed).length >= 57 &&
            families.length === 10 &&
            families.every((f) => f.total === 6 && f.passed === 6) &&
            critical === 0,
        latency,
        latencyGatePassed:
            r.complete &&
            r.results.every((x) => x.error === null) &&
            latency.capture.attempts === 60 &&
            latency.correction.attempts === 6 &&
            latency.query.attempts === 250 &&
            latency.capture.p95 <= 15000 &&
            latency.correction.p95 <= 15000 &&
            latency.query.p95 <= 8000,
        queriesReturned: r.results.reduce((n, x) => n + x.queryCount, 0),
        queriesExpected: 250,
        calls: r.metrics.length,
        spentUsd: r.budget.spentUsd - r.baseline.spentUsd,
        uncertainReservationDeltaUsd:
            r.budget.reservedUsd - r.baseline.reservedUsd,
        cases: r.results
            .toSorted((a, b) => a.id.localeCompare(b.id))
            .map((x) => ({
                id: x.id,
                family: x.family,
                passed: passed(x),
                error: x.error,
                checkCount: x.checks.length,
                passedChecks: x.checks.filter((c) => c.passed).length,
                failures: x.checks.filter((c) => !c.passed),
                stages: x.stages,
                queryCount: x.queryCount,
                ...(passed(x) ? {} : { observations: x.observations }),
            })),
        modelStages: [...new Set(r.metrics.map((x) => x.stage))]
            .sort()
            .map((stage) => {
                const calls = r.metrics.filter((x) => x.stage === stage);
                return {
                    stage,
                    calls: calls.length,
                    p50: percentile(
                        calls.map((c) => c.milliseconds),
                        0.5,
                    ),
                    p95: percentile(
                        calls.map((c) => c.milliseconds),
                        0.95,
                    ),
                    input: calls.reduce((n, c) => n + c.input, 0),
                    output: calls.reduce((n, c) => n + c.output, 0),
                };
            }),
    });
}
const pilot = JSON.parse(
    await readFile("local-data/r2/tuning-bounded-pilot.json", "utf8"),
);
assert.equal(pilot.complete, true);
const budget = JSON.parse(await readFile("local-data/r2/budget.json", "utf8"));
const window = JSON.parse(
    await readFile("local-data/r2/authorized-budget.json", "utf8"),
);
const notices = JSON.parse(
    await readFile("local-data/r2/high-spend-notices.json", "utf8"),
);
let reviewPairs = null;
try {
    const bytes = await readFile(
        "local-data/r2/tuning-bounded-review-pairs.json",
    );
    const r = JSON.parse(bytes);
    reviewPairs = {
        complete: r.complete,
        profile: r.profile,
        fingerprint: r.fingerprint,
        reportSha256: createHash("sha256").update(bytes).digest("hex"),
        calls: r.metrics.length,
        spentUsd: r.budget.spentUsd - r.baseline.spentUsd,
        results: r.results,
        variants: ["compact", "indexed"].map((variant) => {
            const reviews = r.results.flatMap((x) =>
                x.reviews.filter((v) => v.variant === variant),
            );
            const metrics = r.metrics.filter((x) => x.mode === variant);
            return {
                variant,
                attempts: reviews.length,
                accepted: reviews.filter(
                    (r) => r.accepted && r.issues.length === 0,
                ).length,
                medianInputBytes: percentile(
                    reviews.map((r) => r.inputBytes),
                    0.5,
                ),
                medianMilliseconds: percentile(
                    metrics.map((m) => m.milliseconds),
                    0.5,
                ),
            };
        }),
    };
} catch (error) {
    if (error?.code !== "ENOENT") throw error;
}
const scopedRegressions = [];
for (const name of ["bounded-scoped-pilot", "bounded-scoped-full"]) {
    let bytes;
    try {
        bytes = await readFile(`local-data/r2/tuning-${name}.json`);
    } catch (error) {
        if (error?.code !== "ENOENT") throw error;
        continue;
    }
    const r = JSON.parse(bytes);
    assert.equal(r.corpus, "regression-v9-exposed");
    assert.equal(r.profile.model, "gpt-6.1-sol");
    assert.equal(r.profile.reasoning, "high");
    assert.ok(r.results.every((x) => ids.includes(x.id)));
    if (name.endsWith("-full") && r.complete)
        assert.deepEqual(r.results.map((x) => x.id).sort(), ids);
    const latency = Object.fromEntries(
        ["capture", "clarification", "correction", "query", "forget"].map(
            (stage) => {
                const ms = r.results.flatMap((x) =>
                    Object.entries(x.stages)
                        .filter(([k]) =>
                            stage === "query"
                                ? /^(query|after|corrected_query)\d+$/u.test(k)
                                : k === stage,
                        )
                        .map(([, v]) => v),
                );
                return [
                    stage,
                    {
                        attempts: ms.length,
                        p50: percentile(ms, 0.5),
                        p95: percentile(ms, 0.95),
                    },
                ];
            },
        ),
    );
    scopedRegressions.push({
        name,
        complete: r.complete,
        independent: false,
        profile: r.profile,
        resolvedModel: r.resolvedModel,
        fingerprint: r.fingerprint,
        reportSha256: createHash("sha256").update(bytes).digest("hex"),
        total: r.results.length,
        passed: r.results.filter(passed).length,
        queriesReturned: r.results.reduce((n, x) => n + x.queryCount, 0),
        criticalChecksFailed: r.results.flatMap((x) =>
            x.checks.filter((c) => c.critical && !c.passed),
        ).length,
        latency,
        calls: r.metrics.length,
        spentUsd: r.budget.spentUsd - r.baseline.spentUsd,
        uncertainReservationDeltaUsd:
            r.budget.reservedUsd - r.baseline.reservedUsd,
        cases: r.results
            .toSorted((a, b) => a.id.localeCompare(b.id))
            .map((x) => ({
                id: x.id,
                family: x.family,
                passed: passed(x),
                error: x.error,
                failures: x.checks.filter((c) => !c.passed),
                queryCount: x.queryCount,
                ...(passed(x) ? {} : { observations: x.observations }),
            })),
    });
}
const result = {
    status: "open",
    evaluatedCodeCommit: "898598b",
    externalAudit: false,
    controlledLatencyComparison: false,
    authorizedWindow: window,
    budget,
    additionalSpentUsd: budget.spentUsd - window.baselineSpentUsd,
    additionalCommittedUsd:
        budget.spentUsd +
        budget.reservedUsd -
        window.baselineSpentUsd -
        window.baselineReservedUsd,
    notices: {
        additionalSpentUsd: budget.spentUsd - notices.baselineSpentUsd,
        notifiedIncrements: notices.notifiedIncrements,
        intervalUsd: notices.intervalUsd,
    },
    pilot: {
        total: pilot.results.length,
        passed: pilot.results.filter(passed).length,
        calls: pilot.metrics.length,
        spentUsd: pilot.budget.spentUsd - pilot.baseline.spentUsd,
        fingerprint: pilot.fingerprint,
    },
    rounds,
    reviewPairs,
    scopedRegressions,
};
assert.ok(result.additionalCommittedUsd <= window.additionalUsd + 1e-8);
await writeFile(
    "docs/09-planning/evidence/r2-bounded-results.json",
    JSON.stringify(result, null, 2) + "\n",
);
console.log(
    JSON.stringify({
        additionalSpentUsd: result.additionalSpentUsd,
        additionalCommittedUsd: result.additionalCommittedUsd,
        rounds: rounds.map(
            ({
                round,
                complete,
                total,
                passed,
                spentUsd,
                semanticGatePassed,
                latencyGatePassed,
                latency,
            }) => ({
                round,
                complete,
                total,
                passed,
                spentUsd,
                semanticGatePassed,
                latencyGatePassed,
                latency,
            }),
        ),
    }),
);
