import { holdoutA } from "./holdout-a.ts";
import { holdoutB } from "./holdout-b.ts";
import { holdoutC } from "./holdout-c.ts";
import { holdoutD } from "./holdout-d.ts";
import { holdoutE } from "./holdout-e.ts";

/** Third independently specified corpus. Freeze before its first live call; never tune against it while reporting it as reserved. */
export const holdout = [
  ...holdoutA,
  ...holdoutB,
  ...holdoutC,
  ...holdoutD,
  ...holdoutE,
];
