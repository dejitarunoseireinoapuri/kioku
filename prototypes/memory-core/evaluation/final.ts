import type { Scenario } from "./case.ts";
import { finalIndependent } from "./final-independent.ts";
import { finalShared } from "./final-shared.ts";
import { finalCondition } from "./final-condition.ts";
import { finalAttribution } from "./final-attribution.ts";
import { finalTime } from "./final-time.ts";
import { finalDuplicate } from "./final-duplicate.ts";
import { finalSimilar } from "./final-similar.ts";
import { finalCorrection } from "./final-correction.ts";
import { finalAmbiguity } from "./final-ambiguity.ts";
import { finalForget } from "./final-forget.ts";

// Gold expectations are not sent to the provider. Freeze all files before round one.
export const finalReserve: Scenario[] = [
  ...finalIndependent,
  ...finalShared,
  ...finalCondition,
  ...finalAttribution,
  ...finalTime,
  ...finalDuplicate,
  ...finalSimilar,
  ...finalCorrection,
  ...finalAmbiguity,
  ...finalForget,
].map((c) => ({ ...c, expectedRelations: c.expectedRelations ?? [] }));
