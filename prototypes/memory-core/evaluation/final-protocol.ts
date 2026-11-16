import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { z } from "zod";
import { InterpretationError } from "../ai/contracts.ts";
import { profile } from "../ai/provider.ts";
import type { Scenario } from "./case.ts";

export const finalCorpus = "independent-v5";
export function finalRound(args: string[]): number {
  if (!args.includes("--live")) throw new InterpretationError("LIVE_REQUIRED");
  if (
    args.length !== 3 ||
    args[0] !== "--live" ||
    args[1] !== "--round" ||
    !/^[123]$/u.test(args[2]!)
  )
    throw new InterpretationError("FINAL_ROUND_REQUIRED");
  return Number(args[2]);
}
export const finalName = (round: number) =>
  `reserve-final-independent-${round}.json`;

export async function finalFingerprint(cases: Scenario[]) {
  const hash = createHash("sha256").update(JSON.stringify(cases));
  for (const folder of ["ai", "src", "evaluation", "fixtures"]) {
    for (const file of (await readdir(`prototypes/memory-core/${folder}`))
      .filter((f) => f.endsWith(".ts"))
      .sort())
      hash
        .update(`${folder}/${file}`)
        .update(await readFile(`prototypes/memory-core/${folder}/${file}`));
  }
  return hash.digest("hex");
}

const previousSchema = z.object({
  round: z.number().int(),
  complete: z.literal(true),
  corpus: z.literal(finalCorpus),
  fingerprint: z.string().regex(/^[a-f0-9]{64}$/u),
  profile: z.object({
    model: z.literal(profile.model),
    reasoning: z.literal(profile.reasoning),
    inputRate: z.literal(profile.inputRate),
    outputRate: z.literal(profile.outputRate),
  }),
  resolvedModel: z.string().min(1),
  results: z.array(z.object({ id: z.string() })).length(60),
});
export function validatePrevious(
  raw: unknown,
  round: number,
  fingerprint: string,
  ids: string[],
) {
  const parsed = previousSchema.safeParse(raw);
  if (!parsed.success || parsed.data.round !== round - 1)
    throw new InterpretationError("PREVIOUS_ROUND_REQUIRED");
  const previous = parsed.data;
  if (previous.fingerprint !== fingerprint)
    throw new InterpretationError("FROZEN_VERSION_CHANGED");
  if (
    JSON.stringify(previous.results.map((r) => r.id).sort()) !==
    JSON.stringify([...ids].sort())
  )
    throw new InterpretationError("PREVIOUS_CORPUS_CHANGED");
  return previous.resolvedModel;
}
