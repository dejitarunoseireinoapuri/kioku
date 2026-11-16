import { readFile } from "node:fs/promises";
import { z } from "zod";
import { InterpretationError } from "../ai/contracts.ts";

const windowSchema = z.strictObject({
  id: z.string().regex(/^[a-z0-9-]{1,40}$/u),
  baselineSpentUsd: z.number().finite().nonnegative(),
  baselineReservedUsd: z.number().finite().nonnegative(),
  additionalUsd: z.number().finite().positive().max(15),
});
export function parseBudgetWindow(raw: unknown) {
  const window = windowSchema.parse(raw);
  return {
    ...window,
    ceiling:
      window.baselineSpentUsd +
      window.baselineReservedUsd +
      window.additionalUsd,
  };
}
export async function activeBudgetWindow() {
  try {
    return parseBudgetWindow(
      JSON.parse(
        await readFile("local-data/r2/authorized-budget.json", "utf8"),
      ),
    );
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT")
      return null;
    throw new InterpretationError("BUDGET_WINDOW_READ");
  }
}
