import { runReserve } from "./reserve-run.ts";
import { groupingReserve } from "./grouping.ts";
import { InterpretationError } from "../ai/contracts.ts";

runReserve({
  corpus: "grouping-v6",
  name: (round) => `reserve-grouping-independent-${round}.json`,
  cases: groupingReserve,
}).catch((error) => {
  console.error(
    error instanceof InterpretationError ? error.code : "R2_INTERNAL_ERROR",
  );
  process.exitCode = 1;
});
