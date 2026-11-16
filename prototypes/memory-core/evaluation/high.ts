import type { Scenario } from "./case.ts";
import { highA } from "./high-a.ts";
import { highB } from "./high-b.ts";
import { highC } from "./high-c.ts";
import { highD } from "./high-d.ts";
import { highE } from "./high-e.ts";

// Fixed synthetic expectations, never sent to the provider.
export const highReserve: Scenario[] = [
  ...highA,
  ...highB,
  ...highC,
  ...highD,
  ...highE,
].map((c) => ({ ...c, expectedRelations: c.expectedRelations ?? [] }));
