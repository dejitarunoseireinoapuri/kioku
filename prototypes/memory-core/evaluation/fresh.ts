import { freshA } from "./fresh-a.ts";
import { freshB } from "./fresh-b.ts";
import { freshC } from "./fresh-c.ts";
import { freshD } from "./fresh-d.ts";
import { freshE } from "./fresh-e.ts";
// Frozen experiment at 6d4813e; now exposed regression cases with documented oracle corrections.
export const fresh = [...freshA, ...freshB, ...freshC, ...freshD, ...freshE];
