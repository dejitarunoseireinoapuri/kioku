import { readFile } from "node:fs/promises";
import { SolProvider, profile } from "../ai/provider.ts";
import type { CallMetric } from "../ai/provider.ts";
import { Interpreter } from "../ai/interpreter.ts";
import { InterpretationError } from "../ai/contracts.ts";
import { queryCatalog } from "../ai/catalog-query.ts";
import { retrieve } from "../ai/search.ts";
import { SearchIndex } from "../src/search-index.ts";
import { CoreError } from "../src/errors.ts";
import {
  LargeCatalog,
  catalogCases,
  syntheticId,
} from "../fixtures/large-catalog.ts";
import { EvaluationBudget, executionLock, saveReport } from "./runtime.ts";
import { matches } from "./grade.ts";
import { fingerprint } from "./fingerprint.ts";

async function main() {
  const args = process.argv.slice(2),
    run = args[args.indexOf("--run") + 1];
  if (
    !args.includes("--live") ||
    !args.includes("--run") ||
    !run ||
    !/^[a-z0-9_-]{1,40}$/u.test(run)
  )
    throw new InterpretationError("LIVE_RUN_REQUIRED");
  const finish = await executionLock();
  try {
    const name = `scale-${run}.json`;
    try {
      await readFile(`local-data/r2/${name}`);
      throw new InterpretationError("RUN_EXISTS");
    } catch (error) {
      if (
        !(error instanceof Error && "code" in error && error.code === "ENOENT")
      )
        throw error;
    }
    const budget = await EvaluationBudget.open(),
      baseline = structuredClone(budget.ledger);
    budget.runCeiling = baseline.spentUsd + baseline.reservedUsd + 4;
    const metrics: CallMetric[] = [],
      rows: unknown[] = [];
    const model = new SolProvider(
      process.env.OPENAI_API_KEY ?? "",
      budget,
      (m) => metrics.push(m),
    );
    const sourceFingerprint = await fingerprint(catalogCases);
    const report = (complete = false) => ({
      fingerprint: sourceFingerprint,
      profile,
      run,
      baseline,
      budget: budget.ledger,
      metrics,
      rows,
      complete,
      scope:
        "paged_retrieval_and_repeat_interpretation_not_large_catalog_mutation",
    });
    await saveReport(name, report());
    for (const size of [100, 1000, 10000]) {
      const catalog = new LargeCatalog(size),
        started = performance.now();
      const index = await SearchIndex.load(catalog, catalog.owner),
        buildMilliseconds = performance.now() - started;
      for (let i = 0; i < catalogCases.length; i++) {
        const fixture = catalogCases[i]!,
          at = performance.now();
        let error: string | null = null,
          answerCorrect = false,
          recall = false,
          repeatCorrect = false,
          candidates = 0;
        try {
          const input = {
            actor: catalog.owner,
            text: fixture.question,
            at: "2026-07-14T12:00:00Z",
            zone: "Europe/Madrid",
          };
          const result = await queryCatalog(model, catalog, index, input);
          candidates = result.retrieval.refs.length;
          recall = result.retrieval.refs.some(
            (r) => r.id === syntheticId(i + 1),
          );
          answerCorrect =
            result.status === "answered" &&
            result.ids.length === 1 &&
            result.ids[0] === syntheticId(i + 1) &&
            fixture.terms.every((t) => matches(result.text, t));
          const found = await retrieve(model, catalog, index, {
            ...input,
            text: fixture.repeat,
          });
          const units = (
            await catalog.evidence(catalog.owner, found.epoch, found.refs)
          ).map((item) => item.unit);
          const repeat = await new Interpreter(model).interpret(
            {
              text: fixture.repeat,
              at: input.at,
              zone: input.zone,
              mode: "capture",
            },
            units,
          );
          repeatCorrect =
            repeat.proposal.status === "ready" &&
            repeat.draft?.units.length === 1 &&
            repeat.draft.units[0]!.existing?.id === syntheticId(i + 1);
        } catch (e) {
          error =
            e instanceof InterpretationError
              ? e.code
              : e instanceof CoreError
                ? e.message
                : "SCALE_INTERNAL";
        }
        rows.push({
          size,
          id: `s${i + 1}`,
          buildMilliseconds,
          pages: index.pages,
          milliseconds: performance.now() - at,
          recall,
          answerCorrect,
          repeatCorrect,
          candidates,
          error,
        });
        await saveReport(name, report());
        console.log(
          JSON.stringify({
            size,
            id: `s${i + 1}`,
            recall,
            answerCorrect,
            repeatCorrect,
            error,
          }),
        );
        if (error && /^(BUDGET_|HTTP_(401|403|429)|LOCAL_WRITE_)/u.test(error))
          throw new InterpretationError("RUN_HALTED");
      }
    }
    await saveReport(name, report(true));
    console.log(
      JSON.stringify({
        rows: rows.length,
        spentUsd: budget.ledger.spentUsd - baseline.spentUsd,
        calls: metrics.length,
      }),
    );
  } finally {
    await finish();
  }
}
main().catch((error) => {
  console.error(
    error instanceof InterpretationError ? error.code : "SCALE_INTERNAL",
  );
  process.exitCode = 1;
});
