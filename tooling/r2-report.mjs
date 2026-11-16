import { readFile, mkdir, writeFile } from "node:fs/promises";

// Export only experiment metadata, never provider text or memory contents.
const reports = await Promise.all(
    [1, 2, 3].map(async (round) =>
        JSON.parse(
            await readFile(
                `local-data/r2/reserve-frozen-${round}.json`,
                "utf8",
            ),
        ),
    ),
);
if (
    reports.some((r) => !r.complete || r.results.length !== 60) ||
    new Set(reports.map((r) => r.fingerprint)).size !== 1
)
    throw new Error("R2_ROUNDS_INCOMPLETE_OR_CHANGED");
const passed = (result) =>
    result.error === null && result.checks.every((c) => c.passed);
const percentile = (values, p) =>
    values.length
        ? Math.round(
              [...values].sort((a, b) => a - b)[
                  Math.ceil(values.length * p) - 1
              ] * 1000,
          ) / 1000
        : null;
const latency = (results) => {
    const groups = { capture: [], correction: [], query: [], forget: [] };
    for (const result of results)
        for (const [stage, milliseconds] of Object.entries(result.stages)) {
            const group =
                stage === "capture" ||
                stage === "correction" ||
                stage === "forget"
                    ? stage
                    : /^(query|after|corrected_query)/u.test(stage)
                      ? "query"
                      : null;
            if (group) groups[group].push(milliseconds / 1000);
        }
    return Object.fromEntries(
        Object.entries(groups).map(([name, values]) => [
            name,
            {
                count: values.length,
                p50Seconds: percentile(values, 0.5),
                p95Seconds: percentile(values, 0.95),
            },
        ]),
    );
};
const rounds = reports.map((r) => ({
    run: r.run,
    model: r.resolvedModel,
    fingerprint: r.fingerprint,
    cases: r.results.length,
    passed: r.results.filter(passed).length,
    queriesCompleted: r.results.reduce((n, c) => n + c.queryCount, 0),
    criticalAlerts: r.results
        .filter((c) => c.checks.some((x) => x.critical && !x.passed))
        .map((c) => c.id),
    failures: r.results
        .filter((c) => c.error)
        .map((c) => ({ id: c.id, code: c.error })),
    families: Object.fromEntries(
        [...new Set(r.results.map((c) => c.family))].sort().map((family) => [
            family,
            {
                passed: r.results.filter(
                    (c) => c.family === family && passed(c),
                ).length,
                total: r.results.filter((c) => c.family === family).length,
            },
        ]),
    ),
    calls: r.metrics.length,
    estimatedCostUsd: r.budget.spentUsd - r.baseline.spentUsd,
    inputTokens: r.metrics.reduce((n, m) => n + m.input, 0),
    outputTokens: r.metrics.reduce((n, m) => n + m.output, 0),
    latency: latency(r.results),
    perCase: [...r.results]
        .sort((a, b) => a.id.localeCompare(b.id))
        .map((c) => ({
            id: c.id,
            family: c.family,
            passed: passed(c),
            checks: c.checks.length,
            failedChecks: c.checks.filter((x) => !x.passed),
            error: c.error,
            queriesCompleted: c.queryCount,
        })),
}));
const report = {
    experiment: "R2-frozen-reserve-2026-11-16",
    sourceCommit: "b6a147e",
    model: "gpt-6.1-sol",
    reasoning: "medium",
    acceptance: {
        globalMinimum: 0.95,
        perFamilyMinimum: 0.95,
        unresolvedCriticalAlertsAllowed: 0,
    },
    limitations: [
        "Small RAM catalog; no search scale validation",
        "Lexical oracle needs semantic adjudication",
        "No personal data or production integration",
    ],
    rounds,
};
await mkdir("docs/09-planning/evidence", { recursive: true });
await writeFile(
    "docs/09-planning/evidence/r2-results.json",
    JSON.stringify(report, null, 2) + "\n",
);
const firstAudit = JSON.parse(
    await readFile("local-data/r2/evidence-audit.json", "utf8"),
);
const correctedAudit = JSON.parse(
    await readFile("local-data/r2/evidence-audit-v2.json", "utf8"),
);
const diagnostics = {
    type: "post-reserve-diagnostics-not-a-new-reserve",
    deterministic: {
        providerCalls: 0,
        canonicalRetainsUnchangedDetail: true,
        literalRetainsUnchangedDetail: false,
        replacedValueAbsent: true,
    },
    firstAudit: {
        calls: firstAudit.metrics.length,
        estimatedCostUsd:
            firstAudit.budget.spentUsd - firstAudit.baseline.spentUsd,
        distinctEventResults: firstAudit.results.filter((r) =>
            r.id.startsWith("cross-"),
        ),
        invalidatedCheck:
            "Initial old-value check scanned metadata and matched primary/opaque-ID digits; no conclusion about old content retained is drawn from it.",
    },
    correctedAudit: {
        calls: correctedAudit.metrics.length,
        estimatedCostUsd:
            correctedAudit.budget.spentUsd - correctedAudit.baseline.spentUsd,
        results: correctedAudit.results,
    },
};
await writeFile(
    "docs/09-planning/evidence/r2-diagnostics.json",
    JSON.stringify(diagnostics, null, 2) + "\n",
);
console.log(
    JSON.stringify(
        rounds.map(({ perCase, ...summary }) => summary),
        null,
        2,
    ),
);
