import type { Scenario } from "./case.ts";
import { groupingIndependent } from "./grouping-independent.ts";
import { groupingShared } from "./grouping-shared.ts";
import { groupingCondition } from "./grouping-condition.ts";
import { groupingAttribution } from "./grouping-attribution.ts";
import { groupingTime } from "./grouping-time.ts";
import { groupingDuplicate } from "./grouping-duplicate.ts";
import { groupingSimilar } from "./grouping-similar.ts";
import { groupingCorrection } from "./grouping-correction.ts";
import { groupingAmbiguity } from "./grouping-ambiguity.ts";
import { groupingForget } from "./grouping-forget.ts";

// New synthetic expectations fixed before any provider call on these inputs.
export const groupingReserve: Scenario[] = [
  ...groupingIndependent,
  ...groupingShared,
  ...groupingCondition,
  ...groupingAttribution,
  ...groupingTime,
  ...groupingDuplicate,
  ...groupingSimilar,
  ...groupingCorrection,
  ...groupingAmbiguity,
  ...groupingForget,
].map((c) => ({ ...c, expectedRelations: c.expectedRelations ?? [] }));
