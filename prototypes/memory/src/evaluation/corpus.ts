import { scenarios as tuning } from "./tuning.ts";
import { scenarios as validationA } from "./validation-a.ts";
import { scenarios as validationB } from "./validation-b.ts";
import { scenarios as reservedA } from "./reserved-a.ts";
import { scenarios as reservedB } from "./reserved-b.ts";
export type { ExpectedItem, QuerySpec, Scenario } from "./fixture.ts";
export const corpus = [
  ...tuning,
  ...[...validationA, ...validationB].map((entry) => ({
    ...entry,
    partition: "regression" as const,
  })),
  ...reservedA,
  ...reservedB,
];
export const evaluationAt = "2026-11-20T12:00:00+01:00";
