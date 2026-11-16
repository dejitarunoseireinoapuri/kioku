import { runReserve } from "./reserve-run.ts";
import { scopeReserve } from "./scope.ts";
import { InterpretationError } from "../ai/contracts.ts";

runReserve({
  corpus: "scope-v7",
  name: (round) => `reserve-scope-independent-${round}.json`,
  cases: scopeReserve,
}).catch((error) => {
  console.error(
    error instanceof InterpretationError ? error.code : "R2_INTERNAL_ERROR",
  );
  process.exitCode = 1;
});
