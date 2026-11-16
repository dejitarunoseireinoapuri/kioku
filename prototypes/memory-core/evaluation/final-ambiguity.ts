import { ask, day, scenario, unit } from "./case.ts";
export const finalAmbiguity = [
  scenario(
    "f49",
    "ambiguity",
    "Quiero hacer eso mañana. Además, quiero comprar una brújula.",
    [
      unit("cake", ["hornear", "bizcocho"], "intention", day("2026-07-15")),
      unit("compass", ["comprar", "brujula"]),
    ],
    [
      ask("¿Qué día quiero hornear el bizcocho?", ["cake"], ["15"]),
      ask("¿Qué instrumento quiero comprar?", ["compass"], ["brujula"]),
    ],
    {
      status: "clarify",
      clarification: "Con eso me refería a hornear un bizcocho.",
      clarificationAt: "2026-07-18T10:00:00Z",
    },
  ),
  scenario(
    "f50",
    "ambiguity",
    "Quiero zarpel mañana con Cósima.",
    [
      unit(
        "rowing",
        ["practicar", "remo", "cosima"],
        "intention",
        day("2026-07-15"),
        { forbidden: ["zarpel"] },
      ),
    ],
    [
      ask("¿Qué quería hacer con Cósima?", ["rowing"], ["remo"]),
      ask("¿Qué día quería practicar remo con Cósima?", ["rowing"], ["15"]),
    ],
    {
      status: "clarify",
      clarification: "Con zarpel quería decir practicar remo.",
      clarificationAt: "2026-07-17T09:00:00Z",
    },
  ),
  scenario(
    "f51",
    "ambiguity",
    "Mi turno de voluntariado es el 31 de abril de 2027.",
    [
      unit("shift", ["turno", "voluntariado"], "intention", day("2027-04-30"), {
        forbidden: ["31"],
      }),
    ],
    [
      ask(
        "¿Qué día tengo el turno de voluntariado?",
        ["shift"],
        ["30", "abril"],
      ),
      ask("¿En qué año es ese turno?", ["shift"], ["2027"]),
    ],
    { status: "clarify", clarification: "Quise decir el 30 de abril de 2027." },
  ),
  scenario(
    "f52",
    "ambiguity",
    "¿He llevado alguna vez los patines a San Telmo?",
    [],
    [
      ask("¿He llevado los patines a San Telmo?", [], [], {
        status: "not_found",
      }),
      ask("¿Dónde he guardado los patines?", [], [], { status: "not_found" }),
    ],
    { status: "no_memory" },
  ),
  scenario(
    "f53",
    "ambiguity",
    "Hecomprado un racimo de uvas. He dejado el termo junto al fregadero.",
    [
      unit("grapes", ["racimo", "uvas"], "fact"),
      unit("thermos", ["termo", "fregadero"], "fact"),
    ],
    [
      ask("¿Qué fruta he comprado?", ["grapes"], ["uvas"]),
      ask("¿Dónde dejé el termo?", ["thermos"], ["fregadero"]),
    ],
  ),
  scenario(
    "f54",
    "ambiguity",
    "Creo que conté 58 fichas de dominó, pero no estoy seguro. Guardé el tablero de parchís en el armario.",
    [
      unit("tiles", ["58", "fichas", "domino", "creo|duda|no.*segur"], "fact"),
      unit("board", ["tablero", "parchis", "armario"], "fact"),
    ],
    [
      ask(
        "¿Cuántas fichas de dominó creía haber contado y estaba seguro?",
        ["tiles"],
        ["58", "no.*segur|duda|creias"],
      ),
      ask("¿Dónde guardé el tablero de parchís?", ["board"], ["armario"]),
    ],
  ),
];
