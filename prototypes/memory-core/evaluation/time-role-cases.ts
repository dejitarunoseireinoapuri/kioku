import { scenario as s, unit as u, ask as q, day, unknown } from "./case.ts";
import { boundedReserve } from "./bounded.ts";
import { highRegression } from "./high-regression.ts";
const j = boundedReserve.find((c) => c.id === "j39")!;
const i = highRegression.find((c) => c.id === "i39")!;
const bought = (date: string) =>
  u("ticket", ["compr", "entrada", "teatro", "sauce"], "fact", day(date), {
    evidenceTerms: ["6 de agosto"],
  });
const neighbor = u("map", ["mapa", "cajon"], "fact", unknown);
const mapQuery = q("¿Dónde guardé el mapa?", ["map"], ["cajon"]);
const targetQuery = q(
  "¿Para qué día es mi entrada del teatro Sauce?",
  ["ticket"],
  ["6", "agosto"],
);
export const timeRoleCases = [
  s("td01", "time", j.text, structuredClone(j.units), [
    ...structuredClone(j.queries),
    q("¿Qué día realicé la compra de la entrada del cine Arce?", [], [], {
      status: "not_found",
    }),
    q(
      "¿Qué día tengo previsto realizar la compra de la segunda entrada, no la fecha de la función?",
      [],
      [],
      { status: "not_found" },
    ),
  ]),
  s("td02", "time", i.text, structuredClone(i.units), [
    ...structuredClone(i.queries),
    q("¿En qué fecha hice la gestión de reservar la primera mesa?", [], [], {
      status: "not_found",
    }),
  ]),
  s(
    "td03",
    "time",
    "El 3 de junio de 2026 compré una entrada para el teatro Sauce para el 6 de agosto de 2026. Guardé el mapa en el cajón.",
    [bought("2026-06-03"), neighbor],
    [
      q(
        "¿Qué día compré la entrada del teatro Sauce?",
        ["ticket"],
        ["3", "junio"],
      ),
      targetQuery,
      mapQuery,
    ],
  ),
  s(
    "td04",
    "time",
    "Ayer compré una entrada para el teatro Sauce para el 6 de agosto de 2026. Guardé el mapa en el cajón.",
    [bought("2026-07-13"), neighbor],
    [
      q(
        "¿Qué día compré la entrada del teatro Sauce?",
        ["ticket"],
        ["ayer|13", "julio|ayer"],
      ),
      targetQuery,
      mapQuery,
    ],
  ),
  s(
    "td05",
    "time",
    "Mañana quiero comprar una entrada para el teatro Sauce para el 6 de agosto de 2026. Guardé el mapa en el cajón.",
    [{ ...bought("2026-07-15"), kind: "intention" as const }, neighbor],
    [
      q(
        "¿Qué día quiero realizar la compra de la entrada del teatro Sauce?",
        ["ticket"],
        ["manana|15", "julio|manana"],
      ),
      q(
        "¿Para qué día de función quiero la entrada del teatro Sauce?",
        ["ticket"],
        ["6", "agosto"],
      ),
      q("¿Ya he comprado esa entrada?", [], [], { status: "not_found" }),
      mapQuery,
    ],
  ),
  s(
    "td06",
    "time",
    "Ayer fui al cine Castaño. He comprado una entrada para el cine Castaño para el 20 de agosto de 2026.",
    [
      u(
        "visit",
        ["fui|ido|visita", "cine", "castano"],
        "fact",
        day("2026-07-13"),
      ),
      u(
        "ticket",
        ["compr", "entrada", "cine", "castano"],
        "fact",
        day("2026-08-20"),
        { evidenceTerms: ["20 de agosto"] },
      ),
    ],
    [
      q("¿Qué día fui al cine Castaño?", ["visit"], ["ayer|13"]),
      q(
        "¿Para qué fecha es mi entrada del cine Castaño?",
        ["ticket"],
        ["20", "agosto"],
      ),
      q(
        "¿Qué día realicé la compra de la entrada para el 20 de agosto?",
        [],
        [],
        { status: "not_found" },
      ),
    ],
  ),
  s(
    "td07",
    "correction",
    "Compré una entrada para el teatro Roble para el 10 de agosto de 2026. Guardé el mapa en el cajón.",
    [
      u(
        "ticket",
        ["compr", "entrada", "teatro", "roble"],
        "fact",
        day("2026-08-10"),
      ),
      neighbor,
    ],
    [
      q(
        "¿Para qué día es la entrada del teatro Roble?",
        ["ticket"],
        ["10", "agosto"],
      ),
      q("¿Qué día compré la entrada del teatro Roble?", [], [], {
        status: "not_found",
      }),
      mapQuery,
    ],
    {
      correction: {
        label: "ticket",
        text: "La entrada es para el 12 de agosto de 2026, no para el 10 de agosto de 2026.",
        expected: u(
          "ticket",
          ["compr", "entrada", "teatro", "roble"],
          "fact",
          day("2026-08-12"),
          { forbidden: ["(?<!\\d)10 de agosto|2026-08-10"] },
        ),
        query: q(
          "¿Para qué fecha es ahora la entrada del teatro Roble?",
          ["ticket"],
          ["12", "agosto"],
          { forbidden: ["(?<!\\d)10"] },
        ),
      },
    },
  ),
  s(
    "td08",
    "duplicate",
    "El 3 de junio de 2026 compré una entrada para el teatro Sauce para el 6 de agosto de 2026. Guardé el mapa en el cajón.",
    [bought("2026-06-03"), neighbor],
    [
      q(
        "¿Qué día compré mi entrada del teatro Sauce?",
        ["ticket"],
        ["3", "junio"],
      ),
      targetQuery,
      mapQuery,
    ],
    {
      repeat: {
        text: "Mi entrada del teatro Sauce, que compré el 3 de junio de 2026, es para el 6 de agosto de 2026.",
        count: 2,
      },
    },
  ),
].map((c) => ({ expectedRelations: [], ...c }));
