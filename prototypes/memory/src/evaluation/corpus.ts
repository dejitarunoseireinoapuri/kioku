import { scenarios as tuning } from "./tuning.ts";
import { scenarios as validationA } from "./validation-a.ts";
import { scenarios as validationB } from "./validation-b.ts";
export type { ExpectedItem, QuerySpec, Scenario } from "./fixture.ts";
export const corpus = [...tuning, ...validationA, ...validationB];
export const evaluationAt = "2026-11-20T12:00:00+01:00";
