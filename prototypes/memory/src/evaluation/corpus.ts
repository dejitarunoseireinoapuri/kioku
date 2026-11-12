import { scenarios as tuning } from "./tuning.ts";
import { scenarios as validationA } from "./validation-a.ts";
import { scenarios as validationB } from "./validation-b.ts";
import { scenarios as reservedA } from "./reserved-a.ts";
import { scenarios as reservedB } from "./reserved-b.ts";
import { scenarios as freshA } from "./fresh-a.ts";
import { scenarios as freshB } from "./fresh-b.ts";
import { scenarios as freshC } from "./fresh-c.ts";
import { scenarios as freshD } from "./fresh-d.ts";
import { scenarios as reserve4A } from "./reserve4-a.ts";
import { scenarios as reserve4B } from "./reserve4-b.ts";
import { scenarios as reserve4C } from "./reserve4-c.ts";
import { scenarios as reserve4D } from "./reserve4-d.ts";
export type { ExpectedItem, QuerySpec, Scenario } from "./fixture.ts";
export const corpus = [
  ...tuning,
  ...[...validationA, ...validationB].map((entry) => ({
    ...entry,
    partition: "regression" as const,
  })),
  ...[...reservedA, ...reservedB].map((entry) => ({
    ...entry,
    partition: "regression-v2" as const,
  })),
  ...[...freshA, ...freshB, ...freshC, ...freshD].map((entry) => ({
    ...entry,
    partition: "regression-v3" as const,
  })),
  ...reserve4A,
  ...reserve4B,
  ...reserve4C,
  ...reserve4D,
];
export const evaluationAt = "2026-11-20T12:00:00+01:00";
