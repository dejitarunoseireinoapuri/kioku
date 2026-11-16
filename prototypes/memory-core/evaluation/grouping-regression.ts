import { groupingReserve } from "./grouping.ts";

// Exposed regression expectations. Historical corpus and reports remain unchanged.
export const groupingRegression = structuredClone(groupingReserve);
const quoted = groupingRegression.find((c) => c.id === "g24")!;
for (const query of [quoted.queries[1]!, quoted.after[1]!]) {
  query.quotations = [
    {
      label: "notebook",
      literal: "Quiero perder el miedo y ganar paciencia",
      introduction: "(?:tu|la) vecina (?:escribio|anoto)(?: en su cuaderno)?",
      attribution: "vecina|cuaderno",
    },
  ];
}
const taste = groupingRegression.find((c) => c.id === "g33")!;
taste.queries[0]!.terms = [
  "(?:no te gusta|te desagrada|te disgusta|no es de tu agrado)",
];
taste.queries[0]!.forbidden = [
  "\\b(?:no te (?:desagrada|disgusta)|(?<!no )te gusta|te encanta)\\b",
];
const people = groupingRegression.find((c) => c.id === "g38")!;
people.units[0]!.subject = "^(?:yo|owner|propietari[oa]|usuari[oa])$";
people.units[1]!.subject = "hermano";
