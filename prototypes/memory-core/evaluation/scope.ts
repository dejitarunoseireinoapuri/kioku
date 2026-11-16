import type { Scenario } from "./case.ts";
import { scopeA } from "./scope-a.ts";
import { scopeB } from "./scope-b.ts";
import { scopeC } from "./scope-c.ts";
import { scopeD } from "./scope-d.ts";
import { scopeE } from "./scope-e.ts";

// Expectations fixed before execution; no answers or expected labels reach the provider.
export const scopeReserve: Scenario[] = [
  ...scopeA,
  ...scopeB,
  ...scopeC,
  ...scopeD,
  ...scopeE,
].map((c) => ({ ...c, expectedRelations: c.expectedRelations ?? [] }));
