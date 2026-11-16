import { scopeReserve } from "./scope.ts";
import { ask } from "./case.ts";

// Exposed adaptations only. Never modify/regrade the historical reserve.
export const scopeRegression = structuredClone(scopeReserve);
const visit = scopeRegression.find((c) => c.id === "h30")!;
visit.expectedRelations = [{ kind: "requires", from: "helmet", to: "quarry" }];
visit.forgetClosure = ["helmet"];
visit.after = visit.after.map((q) => ({
  ...q,
  labels: [],
  terms: [],
  status: "not_found",
}));

const repair = scopeRegression.find((c) => c.id === "h49")!;
// Broad wording permits the gluing plan; only the explicit inclusive question requires it.
repair.queries[1] = ask("¿Qué quiero arreglar?", ["lock"], ["cerrojo"], {
  contextLabels: ["flowers"],
});
repair.queries.push(
  ask(
    "¿Qué planes de reparación tengo, incluido lo que quiero pegar?",
    ["flowers", "lock"],
    ["florero", "cerrojo"],
  ),
);
repair.queries.push(
  ask("¿Qué quiero arreglar del cerrojo?", ["lock"], ["cerrojo"], {
    forbidden: ["florero"],
  }),
);
repair.after[1] = ask("¿Qué quiero arreglar?", ["lock"], ["cerrojo"], {
  forbidden: ["florero"],
});
repair.after.push(
  ask("¿Qué quiero arreglar del cerrojo?", ["lock"], ["cerrojo"], {
    forbidden: ["florero"],
  }),
);
repair.after.push(
  ask(
    "¿Qué planes de reparación tengo, incluido lo que quiero pegar?",
    ["lock"],
    ["cerrojo"],
    { forbidden: ["florero"] },
  ),
);

const port = scopeRegression.find((c) => c.id === "h53")!;
port.units[1]!.forbidden = ["buscar", "hermano"];
port.after[0]!.forbidden = ["buscar", "hermano"];
