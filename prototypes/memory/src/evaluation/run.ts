import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { corpus, evaluationAt } from "./corpus.ts";
import { scoreExtraction, scoreQuery, summarize } from "./score.ts";
import type { Observation } from "./score.ts";
import { MemoryEngine } from "../engine.ts";
import { JsonMemoryRepository } from "../repository.ts";
import { openRuntime, reportError } from "../runtime.ts";
import { model, embeddingModel } from "../openai.ts";
import { rates } from "../budget.ts";
import { withdrawForEvaluation } from "./withdraw.ts";

async function fingerprint(): Promise<string> {
  const files = [
    "corpus.ts",
    "fixture.ts",
    "tuning.ts",
    "validation-a.ts",
    "validation-b.ts",
    "score.ts",
    "run.ts",
    "withdraw.ts",
  ].map((file) => new URL(file, import.meta.url));
  files.push(
    ...[
      "domain.ts",
      "engine.ts",
      "search.ts",
      "openai.ts",
      "prompts.ts",
      "budget.ts",
      "repository.ts",
    ].map((file) => new URL(`../${file}`, import.meta.url)),
  );
  const hash = createHash("sha256");
  for (const file of files) hash.update(await readFile(file));
  return hash.digest("hex");
}

async function executeRun(
  directory: string,
  partition: string,
  runtime: Awaited<ReturnType<typeof openRuntime>>,
) {
  await mkdir(directory, { recursive: true });
  const selected = corpus.filter(
    (scenario) => scenario.partition === partition,
  );
  const repository = new JsonMemoryRepository(directory);
  const engine = new MemoryEngine(repository, runtime.intelligence);
  const observations: Observation[] = [];
  const detail: unknown[] = [];
  async function checkpoint(complete = false) {
    await writeFile(
      `${directory}/report.json`,
      JSON.stringify(
        {
          complete,
          summary: summarize(observations),
          observations,
          detail,
          ledger: runtime.budget.ledger,
        },
        null,
        2,
      ),
      { mode: 0o600 },
    );
  }
  for (const scenario of selected) {
    const start = performance.now();
    const initial = await engine.tell(scenario.turn);
    const final =
      scenario.clarification && initial.status === "needs_clarification"
        ? await engine.tell(scenario.turn, scenario.clarification)
        : initial;
    const passed = scoreExtraction(scenario, initial, final);
    observations.push({
      id: scenario.turn.id,
      category: scenario.category,
      extraction: passed,
      criticalFailure: scenario.status === "ignored" && !passed,
      latencyMs: performance.now() - start,
    });
    detail.push({
      id: scenario.turn.id,
      expected: scenario.items,
      initial,
      final,
      passed,
    });
    await checkpoint();
    console.log(`Entrada ${scenario.turn.id}: ${passed ? "OK" : "REVISAR"}`);
  }
  for (const scenario of selected.filter((entry) => entry.withdraw)) {
    const result = await withdrawForEvaluation(engine, scenario.turn.id);
    observations.push({
      id: `${scenario.turn.id}-withdraw`,
      category: scenario.category,
      blocked: !result.performed,
      latencyMs: 0,
    });
    detail.push({ id: `${scenario.turn.id}-withdraw`, ...result });
    await checkpoint();
  }
  for (const scenario of selected) {
    for (const [index, expected] of scenario.queries.entries()) {
      const start = performance.now();
      // New engine + disk load, with neither conversation history nor expected answers in the provider input.
      const fresh = new MemoryEngine(
        new JsonMemoryRepository(directory),
        runtime.intelligence,
      );
      const result = await fresh.ask(expected.question, evaluationAt);
      const score = scoreQuery(expected, result.answer, result.candidates);
      const id = `${scenario.turn.id}-q${index + 1}`;
      observations.push({
        id,
        category: scenario.category,
        ...score,
        latencyMs: performance.now() - start,
      });
      detail.push({
        id,
        expected,
        answer: result.answer,
        score,
        candidateSources: result.candidates.map(
          ({ memory }) => memory.sourceId,
        ),
      });
      await checkpoint();
      console.log(`Consulta ${id}: ${score.answer ? "OK" : "REVISAR"}`);
    }
  }
  await checkpoint(true);
  return summarize(observations);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (!args.includes("--live")) {
    console.log(
      "M0: usa --live --partition tuning|validation. Validación: tres ejecuciones, revisión independiente y máximo acumulado 2 USD.",
    );
    return;
  }
  const partition = args[args.indexOf("--partition") + 1];
  if (partition !== "tuning" && partition !== "validation")
    throw new Error("Partition required");
  const runCount = partition === "validation" ? 3 : 1;
  const hash = await fingerprint();
  const directory = `local-data/m0/evaluation/${Date.now()}-${randomUUID().slice(0, 8)}`;
  await mkdir(directory, { recursive: true });
  const manifest = {
    partition,
    runCount,
    hash,
    model,
    embeddingModel,
    rates,
    candidateLimit: 6,
    budgetUsd: 2,
    latencyTargetP95Ms: 15_000,
    threshold: 0.9,
    evaluationAt,
    createdAt: new Date().toISOString(),
    commit: execFileSync("git", ["rev-parse", "HEAD"], {
      encoding: "utf8",
    }).trim(),
    dirty:
      execFileSync("git", ["status", "--porcelain"], {
        encoding: "utf8",
      }).trim().length > 0,
  };
  await writeFile(
    `${directory}/manifest.json`,
    JSON.stringify(manifest, null, 2),
    { mode: 0o600 },
  );
  const runtime = await openRuntime(true);
  const summaries: unknown[] = [];
  try {
    for (let run = 1; run <= runCount; run++) {
      if ((await fingerprint()) !== hash)
        throw new Error("Evaluation configuration changed");
      summaries.push(
        await executeRun(`${directory}/run-${run}`, partition, runtime),
      );
    }
    await writeFile(
      `${directory}/summary.json`,
      JSON.stringify(
        {
          manifest,
          summaries,
          gate: "NOT_VALIDATED_UNTIL_INDEPENDENT_REVIEW",
          ledger: runtime.budget.ledger,
        },
        null,
        2,
      ),
      { mode: 0o600 },
    );
    console.log(`Informe privado: ${directory}/summary.json`);
  } finally {
    await runtime.close();
  }
}

main().catch(reportError);
