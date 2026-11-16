import { runReserve } from "./reserve-run.ts";
import { boundedReserve } from "./bounded.ts";
import { InterpretationError } from "../ai/contracts.ts";

runReserve({
  corpus: "bounded-v9",
  name: (round) => `reserve-bounded-independent-${round}.json`,
  cases: boundedReserve,
  reasoning: "high",
  budgetWindow: "bounded-v9",
}).catch((error) => {
  console.error(
    error instanceof InterpretationError ? error.code : "R2_INTERNAL_ERROR",
  );
  process.exitCode = 1;
});
