import { runReserve } from "./reserve-run.ts";
import { finalReserve } from "./final.ts";
import { finalCorpus, finalName } from "./final-protocol.ts";
import { InterpretationError } from "../ai/contracts.ts";

runReserve({ corpus: finalCorpus, name: finalName, cases: finalReserve }).catch(
  (error) => {
    console.error(
      error instanceof InterpretationError ? error.code : "R2_INTERNAL_ERROR",
    );
    process.exitCode = 1;
  },
);
