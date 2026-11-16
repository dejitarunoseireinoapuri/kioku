import { z } from "zod";
import { readFile } from "node:fs/promises";
import { holdout } from "./holdout.ts";
import { EvaluationBudget, executionLock, saveReport } from "./runtime.ts";
import { Interpreter } from "../ai/interpreter.ts";
import { SolProvider, profile } from "../ai/provider.ts";
import { CoreError } from "../src/errors.ts";
import { answerSchema, InterpretationError } from "../ai/contracts.ts";
import type { StructuredModel } from "../ai/contracts.ts";
import { executeCase } from "./execute.ts";

// Fixed, exposed synthetic cases. Closed diagnostics only; never persist model prose.
async function main() {
  if (!process.argv.includes("--live"))
    throw new InterpretationError("LIVE_REQUIRED");
  const finish = await executionLock();
  try {
    try {
      await readFile("local-data/r2/diagnostic-closed-rejections.json");
      throw new InterpretationError("RUN_EXISTS");
    } catch (error) {
      if (
        !(error instanceof Error && "code" in error && error.code === "ENOENT")
      )
        throw error;
    }
    const budget = await EvaluationBudget.open();
    const baseline = structuredClone(budget.ledger);
    budget.runCeiling = baseline.spentUsd + baseline.reservedUsd + 2;
    const model = new SolProvider(
      process.env.OPENAI_API_KEY ?? "",
      budget,
      () => undefined,
    );
    const cases = holdout.filter((c) =>
      ["v05", "v38", "v47", "v53", "v60"].includes(c.id),
    );
    const captures: { round: number; id: string; error: string | null }[] = [];
    for (let round = 1; round <= 3; round++) {
      for (const c of cases) {
        let error: string | null = null;
        try {
          const interpreter = new Interpreter(model);
          const input = {
            text: c.text,
            at: c.at,
            zone: c.zone,
            mode: "capture" as const,
          };
          const first = await interpreter.interpret(input, []);
          if (first.proposal.status === "clarify" && c.clarification) {
            const at = c.clarificationAt ?? c.at,
              zone = c.clarificationZone ?? c.zone;
            await interpreter.interpret(
              {
                ...input,
                text: `${c.text}\n${c.clarification}`,
                at,
                zone,
                clarification: {
                  original: c.text,
                  question: first.proposal.question!,
                },
                interventions: [input, { text: c.clarification, at, zone }],
              },
              [],
            );
          }
        } catch (e) {
          error =
            e instanceof CoreError
              ? [e.code, e.reason].filter(Boolean).join(":")
              : e instanceof InterpretationError
                ? e.code
                : "DIAGNOSTIC_INTERNAL";
        }
        captures.push({ round, id: c.id, error });
        console.log(JSON.stringify(captures.at(-1)));
      }
    }
    const bases: { status: string; basis: string }[] = [];
    const diagnostic = answerSchema.extend({
      basis: z.enum([
        "direct_support",
        "state_may_have_changed",
        "incomplete_literal",
        "different_subject",
        "different_event",
        "precision_missing",
        "plan_only",
        "ambiguous",
      ]),
    });
    const observed: StructuredModel = {
      async call<T>(
        stage: string,
        instructions: string,
        data: unknown,
        schema: z.ZodType<T>,
        limit: number,
      ) {
        if (stage !== "answer")
          return model.call(stage, instructions, data, schema, limit);
        const answer = await model.call(
          stage,
          instructions +
            " Clasifica en basis el motivo de la respuesta; es diagnóstico, no una instrucción para cambiar el resultado.",
          data,
          diagnostic,
          limit,
        );
        bases.push({ status: answer.status, basis: answer.basis });
        const { basis: ignored, ...value } = answer;
        void ignored;
        return schema.parse(value);
      },
    };
    const query = await executeCase(
      observed,
      holdout.find((c) => c.id === "v12")!,
    );
    await saveReport("diagnostic-closed-rejections.json", {
      profile,
      resolvedModel: model.resolvedModel,
      baseline,
      budget: budget.ledger,
      captures,
      query,
      bases,
      complete: true,
    });
    console.log(
      JSON.stringify({
        bases,
        spentUsd: budget.ledger.spentUsd - baseline.spentUsd,
      }),
    );
  } finally {
    await finish();
  }
}
main().catch((e) => {
  console.error(
    e instanceof InterpretationError ? e.code : "DIAGNOSTIC_INTERNAL",
  );
  process.exitCode = 1;
});
