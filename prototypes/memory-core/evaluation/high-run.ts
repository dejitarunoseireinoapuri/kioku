import { runReserve } from "./reserve-run.ts";
import { highReserve } from "./high.ts";
import { InterpretationError } from "../ai/contracts.ts";

runReserve({
  corpus: "high-v8",
  name: (round) => `reserve-high-independent-${round}.json`,
  cases: highReserve,
  reasoning: "high",
}).catch((error) => {
  console.error(
    error instanceof InterpretationError ? error.code : "R2_INTERNAL_ERROR",
  );
  process.exitCode = 1;
});
