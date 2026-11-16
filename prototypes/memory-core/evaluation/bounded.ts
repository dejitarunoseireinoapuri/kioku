import { boundedA } from "./bounded-a.ts";
import { boundedB } from "./bounded-b.ts";
import { boundedC } from "./bounded-c.ts";
import { boundedD } from "./bounded-d.ts";
import { boundedE } from "./bounded-e.ts";
export const boundedReserve = [
  ...boundedA,
  ...boundedB,
  ...boundedC,
  ...boundedD,
  ...boundedE,
].map((c) => ({ expectedRelations: [], ...c }));
