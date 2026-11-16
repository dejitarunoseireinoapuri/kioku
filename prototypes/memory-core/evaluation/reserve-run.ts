import { readFile } from "node:fs/promises";
import { SolProvider, profile } from "../ai/provider.ts";
import type { CallMetric } from "../ai/provider.ts";
import { InterpretationError } from "../ai/contracts.ts";
import { EvaluationBudget, executionLock, saveReport } from "./runtime.ts";
import { executeCase } from "./execute.ts";
import type { CaseResult } from "./execute.ts";
import type { Scenario } from "./case.ts";
import {
  finalFingerprint,
  finalRound,
  validatePrevious,
} from "./final-protocol.ts";

export async function runReserve(spec: {
  corpus: string;
  name: (round: number) => string;
  cases: Scenario[];
}) {
  const round = finalRound(process.argv.slice(2));
  const finish = await executionLock();
  try {
    const name = spec.name(round);
    try {
      await readFile(`local-data/r2/${name}`);
      throw new InterpretationError("RUN_EXISTS");
    } catch (error) {
      if (
        !(error instanceof Error && "code" in error && error.code === "ENOENT")
      )
        throw error;
    }
    const fingerprint = await finalFingerprint(spec.cases);
    let expectedModel: string | null = null;
    if (round > 1) {
      let raw: unknown;
      try {
        raw = JSON.parse(
          await readFile(`local-data/r2/${spec.name(round - 1)}`, "utf8"),
        );
      } catch {
        throw new InterpretationError("PREVIOUS_ROUND_REQUIRED");
      }
      expectedModel = validatePrevious(
        raw,
        round,
        fingerprint,
        spec.cases.map((c) => c.id),
        spec.corpus,
      );
    }
    const budget = await EvaluationBudget.open();
    const baseline = structuredClone(budget.ledger);
    const runCap = 5;
    budget.runCeiling = baseline.spentUsd + baseline.reservedUsd + runCap;
    const metrics: CallMetric[] = [];
    const model = new SolProvider(
      process.env.OPENAI_API_KEY ?? "",
      budget,
      (m) => metrics.push(m),
    );
    const results: CaseResult[] = [];
    const report = () => ({
      mode: "reserve",
      round,
      corpus: spec.corpus,
      profile,
      runCap,
      fingerprint,
      baseline,
      budget: budget.ledger,
      resolvedModel: model.resolvedModel,
      expectedCases: spec.cases.length,
      expectedQueries: spec.cases.reduce(
        (n, c) =>
          n + c.queries.length + c.after.length + Number(Boolean(c.correction)),
        0,
      ),
      results,
      metrics,
      complete: results.length === spec.cases.length,
    });
    await saveReport(name, report());
    let cursor = 0,
      halted = false;
    let checkpoint = Promise.resolve();
    const workers = await Promise.allSettled(
      Array.from({ length: 3 }, async () => {
        while (cursor < spec.cases.length && !halted) {
          const result = await executeCase(model, spec.cases[cursor++]!);
          results.push(result);
          if (
            result.error &&
            /^(BUDGET_|HTTP_(401|403|429)|LOCAL_WRITE_|TRANSPORT_OR_RESPONSE)/u.test(
              result.error,
            )
          )
            halted = true;
          if (
            expectedModel !== null &&
            model.resolvedModel !== null &&
            model.resolvedModel !== expectedModel
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
              round,
              id: result.id,
              passed:
                result.error === null && result.checks.every((c) => c.passed),
              failures: result.checks
                .filter((c) => !c.passed)
                .map((c) => c.name),
              error: result.error,
            }),
          );
        }
      }),
    );
    if (workers.some((w) => w.status === "rejected"))
      throw new InterpretationError("CHECKPOINT_FAILED");
    await saveReport(name, report());
    console.log(
      JSON.stringify({
        round,
        total: results.length,
        passed: results.filter(
          (r) => r.error === null && r.checks.every((c) => c.passed),
        ).length,
        spentUsd: budget.ledger.spentUsd - baseline.spentUsd,
        calls: metrics.length,
      }),
    );
    if (halted) throw new InterpretationError("RUN_HALTED");
  } finally {
    await finish();
  }
}
