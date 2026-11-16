import { freshA } from "./fresh-a.ts";
import { freshB } from "./fresh-b.ts";
import { freshC } from "./fresh-c.ts";
import { freshD } from "./fresh-d.ts";
import { freshE } from "./fresh-e.ts";
// Frozen before first use. Previously exposed r01-r60 are regression only.
export const fresh = [...freshA, ...freshB, ...freshC, ...freshD, ...freshE];
