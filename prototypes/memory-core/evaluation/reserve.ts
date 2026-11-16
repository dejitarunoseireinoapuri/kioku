import { reserveA } from "./reserve-a.ts";
import { reserveB } from "./reserve-b.ts";
import { reserveC } from "./reserve-c.ts";
import { reserveD } from "./reserve-d.ts";
// Frozen before reserved evaluation. Expectations are never sent to the provider.
export const reserve = [...reserveA, ...reserveB, ...reserveC, ...reserveD];
