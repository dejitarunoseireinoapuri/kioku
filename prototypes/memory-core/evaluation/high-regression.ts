import { highReserve } from "./high.ts";
import { ask, scenario, unit, unknown } from "./case.ts";

// Exposed adaptations after all three frozen rounds. Historical expectations stay intact.
export const highRegression = structuredClone(highReserve);
const study = highRegression.find((c) => c.id === "i08")!;
study.queries[0] = ask(
  "¿Qué me contó Malena sobre estudiar oceanografía?",
  ["study"],
  ["oceanografia"],
  { forbidden: ["telar"] },
);
study.after[0] = ask(
  "¿Qué me contó Malena sobre estudiar oceanografía?",
  [],
  [],
  {
    forbidden: ["telar"],
  },
);
study.queries.push(
  ask(
    "¿Qué quiere estudiar Malena según me contó?",
    ["study"],
    ["oceanografia"],
    {
      contextLabels: ["loom"],
    },
  ),
  ask(
    "¿Qué quiere estudiar o aprender Malena, incluidas las actividades manuales?",
    ["study", "loom"],
    ["oceanografia", "telar"],
  ),
);
study.after.push(
  ask(
    "¿Qué quiere estudiar o aprender Malena, incluidas las actividades manuales?",
    ["loom"],
    ["telar"],
    { forbidden: ["oceanografia"] },
  ),
);

const cover = highRegression.find((c) => c.id === "i13")!.units[0]!;
cover.condition =
  "^(?!.*\\bno\\s+(?:encuentr|encontr))(?=.*(?:encuentr|encontr))(?=.*\\blino\\b)(?=.*(?:\\bsin tenir\\b|\\bno tenid[oa]\\b))";

const reservation = highRegression.find((c) => c.id === "i39")!;
for (const [i, u] of reservation.units.entries()) {
  u.terms = ["reserv", "alondra"];
  u.evidenceTerms = [i ? "10 de agosto" : "3 de agosto"];
  u.forbidden = [
    i ? "(?<!\\d)3 de agosto|2026-08-03" : "10 de agosto|2026-08-10",
  ];
}

const quantity = highRegression.find((c) => c.id === "i43")!.correction!;
quantity.expected.forbidden!.push("\\bno\\b");

// Directed controls added after the sixty-case pass; never an independent reserve.
const reversedContrast = structuredClone(
  highRegression.find((c) => c.id === "i43")!,
);
reversedContrast.id = "i61";
reversedContrast.correction!.text = "No eran 18 tuercas, eran 23.";
highRegression.push(reversedContrast);
highRegression.push(
  scenario(
    "i62",
    "correction",
    "No presté mi brújula de latón. El trípode está en el altillo.",
    [
      unit("loan", ["prest", "brujula", "laton"], "fact", unknown, {
        polarity: "negative",
      }),
      unit("tripod", ["tripode", "altillo"], "fact"),
    ],
    [
      ask("¿Presté mi brújula de latón?", ["loan"], ["no"]),
      ask("¿Dónde está el trípode?", ["tripod"], ["altillo"]),
    ],
    {
      correction: {
        label: "loan",
        text: "Era mi brújula de cobre, no de latón.",
        expected: unit("loan", ["prest", "brujula", "cobre"], "fact", unknown, {
          polarity: "negative",
          forbidden: ["laton"],
          evidenceTerms: ["\\bno\\b"],
        }),
        query: ask("¿Presté mi brújula de cobre?", ["loan"], ["no"], {
          forbidden: ["laton"],
        }),
      },
      expectedRelations: [],
    },
  ),
);
