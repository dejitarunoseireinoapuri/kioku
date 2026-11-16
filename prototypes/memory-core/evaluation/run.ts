import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { SolProvider, profile } from "../ai/provider.ts";
import type { CallMetric } from "../ai/provider.ts";
import { InterpretationError } from "../ai/contracts.ts";
import { EvaluationBudget, executionLock, saveReport } from "./runtime.ts";
import { executeCase } from "./execute.ts";
import type { CaseResult } from "./execute.ts";
import { tuning } from "./tuning.ts";
import { reserve } from "./reserve.ts";
import { fresh } from "./fresh.ts";
import { adjustment } from "./adjustment.ts";
import { holdout } from "./holdout.ts";
import { reliability } from "./reliability.ts";
import { finalReserve } from "./final.ts";
import { groupingRegression } from "./grouping-regression.ts";
import { scopeReserve } from "./scope.ts";
import { scopeRegression } from "./scope-regression.ts";
import { highRegression } from "./high-regression.ts";
import { boundedReserve } from "./bounded.ts";

async function main() {
  const args = process.argv.slice(2);
  if (!args.includes("--live")) throw new InterpretationError("LIVE_REQUIRED");
  if (args.includes("--reserve"))
    throw new InterpretationError("RESERVE_REFRESH_REQUIRED");
  const mode = "tuning";
  const position = args.indexOf("--run");
  const run = args[position + 1];
  if (position < 0 || !run || !/^[a-z0-9_-]{1,40}$/u.test(run))
    throw new InterpretationError("RUN_ID_REQUIRED");
  const finish = await executionLock();
  try {
    const name = `${mode}-${run}.json`;
    try {
      await readFile(`local-data/r2/${name}`);
      throw new InterpretationError("RUN_EXISTS");
    } catch (error) {
      if (
        !(error instanceof Error && "code" in error && error.code === "ENOENT")
      )
        throw error;
    }
    const budget = await EvaluationBudget.open();
    const baseline = structuredClone(budget.ledger);
    const runCap =
      args.includes("--regression-v9") ||
      args.includes("--regression-v8") ||
      args.includes("--regression-v6") ||
      args.includes("--regression-v7") ||
      args.includes("--scope-original") ||
      args.includes("--regression-v5") ||
      args.includes("--regression-v3") ||
      args.includes("--regression") ||
      args.includes("--regression-v2")
        ? 5
        : 2;
    budget.runCeiling = baseline.spentUsd + baseline.reservedUsd + runCap;
    const metrics: CallMetric[] = [];
    const model = new SolProvider(
      process.env.OPENAI_API_KEY ?? "",
      budget,
      (m) => metrics.push(m),
    );
    const selection = args.indexOf("--cases");
    const wanted = selection < 0 ? null : args[selection + 1]?.split(",");
    if (
      [
        "--regression-v9",
        "--regression-v8",
        "--regression-v6",
        "--regression-v7",
        "--scope-original",
        "--regression-v3",
        "--regression-v5",
        "--regression-v2",
        "--regression",
        "--adjustment",
        "--reliability",
      ].filter((flag) => args.includes(flag)).length > 1
    )
      throw new InterpretationError("CORPUS_SELECTION");
    const corpus = args.includes("--regression-v9")
      ? boundedReserve
      : args.includes("--regression-v8")
        ? highRegression
        : args.includes("--regression-v7")
          ? scopeRegression
          : args.includes("--scope-original")
            ? scopeReserve
            : args.includes("--regression-v6")
              ? groupingRegression
              : args.includes("--regression-v5")
                ? finalReserve
                : args.includes("--reliability")
                  ? reliability
                  : args.includes("--regression-v3")
                    ? holdout
                    : args.includes("--adjustment")
                      ? adjustment
                      : args.includes("--regression-v2")
                        ? fresh
                        : args.includes("--regression")
                          ? reserve
                          : tuning;
    const cases = wanted ? corpus.filter((c) => wanted.includes(c.id)) : corpus;
    if (!cases.length || (wanted && cases.length !== new Set(wanted).size))
      throw new InterpretationError("CASE_SELECTION");
    const hash = createHash("sha256").update(JSON.stringify(cases));
    for (const folder of ["ai", "src", "evaluation", "fixtures"]) {
      for (const file of (await readdir(`prototypes/memory-core/${folder}`))
        .filter((f) => f.endsWith(".ts"))
        .sort())
        hash
          .update(`${folder}/${file}`)
          .update(await readFile(`prototypes/memory-core/${folder}/${file}`));
    }
    const fingerprint = hash.digest("hex");
    const results: CaseResult[] = [];
    const report = () => ({
      profile,
      runCap,
      run,
      mode,
      corpus: args.includes("--regression-v9")
        ? "regression-v9-exposed"
        : args.includes("--regression-v8")
          ? "regression-v8-adapted"
          : args.includes("--regression-v7")
            ? "regression-v7-adapted"
            : args.includes("--scope-original")
              ? "regression-v7-original"
              : args.includes("--regression-v6")
                ? "regression-v6"
                : args.includes("--regression-v5")
                  ? "regression-v5"
                  : args.includes("--reliability")
                    ? "reliability-v4"
                    : args.includes("--regression-v3")
                      ? "regression-v3"
                      : args.includes("--adjustment")
                        ? "adjustment-v3"
                        : args.includes("--regression")
                          ? "regression-v1"
                          : args.includes("--regression-v2")
                            ? "regression-v2"
                            : "tuning-v1",
      fingerprint,
      baseline,
      budget: budget.ledger,
      resolvedModel: model.resolvedModel,
      results,
      metrics,
      complete: results.length === cases.length,
    });
    await saveReport(name, report());
    let checkpoint = Promise.resolve();
    let cursor = 0;
    let halted = false;
    // Independent fictitious stores; paid calls have no automatic retries.
    const workers = await Promise.allSettled(
      Array.from({ length: 3 }, async () => {
        while (cursor < cases.length && !halted) {
          const fixture = cases[cursor++]!;
          const result = await executeCase(model, fixture);
          results.push(result);
          if (
            result.error &&
            /^(BUDGET_|HTTP_(401|403|429)|LOCAL_WRITE_|TRANSPORT_OR_RESPONSE)/u.test(
              result.error,
            )
          )
            halted = true;
          checkpoint = checkpoint.then(() => saveReport(name, report()));
          try {
            await checkpoint;
          } catch (error) {
            halted = true;
            throw error;
          }
          console.log(
            JSON.stringify({
              id: result.id,
              passed:
                result.checks.every((c) => c.passed) && result.error === null,
              failures: result.checks
                .filter((c) => !c.passed)
                .map((c) => c.name),
              error: result.error,
            }),
          );
        }
      }),
    );
    const failure = workers.find((worker) => worker.status === "rejected");
    if (failure?.status === "rejected")
      throw new InterpretationError("CHECKPOINT_FAILED");
    await saveReport(name, report());
    console.log(
      JSON.stringify({
        mode,
        run,
        total: results.length,
        passed: results.filter(
          (r) => r.error === null && r.checks.every((c) => c.passed),
        ).length,
        spentUsd: budget.ledger.spentUsd - baseline.spentUsd,
        reservedUsd: budget.ledger.reservedUsd,
        calls: metrics.length,
      }),
    );
    if (halted) throw new InterpretationError("RUN_HALTED");
  } finally {
    await finish();
  }
}
main().catch((error) => {
  console.error(
    error instanceof InterpretationError ? error.code : "R2_INTERNAL_ERROR",
  );
  process.exitCode = 1;
});
