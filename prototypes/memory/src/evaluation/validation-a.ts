import * as fixture from "./fixture.ts";
import type { Scenario } from "./fixture.ts";
export const scenarios: Scenario[] = [
  fixture.scenario(
    "v01",
    "context",
    "Cuando Gemma se vaya de viaje quiero ver la película Dune. A ella no le apetece verla.",
    [fixture.item(["Gemma", "Dune"], "intention")],
    [
      fixture.yes(
        "¿Qué película dije que me apetecía ver cuando Gemma se fuera?",
        "v01",
        [["dune"]],
      ),
      fixture.yes(
        "¿Ya vi la película que reservaba para el viaje de Gemma?",
        "v01",
        [["dune"], ["no consta", "no tengo", "no hay"]],
        true,
        true,
      ),
    ],
  ),
  fixture.scenario(
    "v02",
    "intention",
    "Mañana intentaré llamar a mi padre para hablar de su huerto.",
    [fixture.item(["padre", "huerto"], "intention", "2026-11-12")],
    [
      fixture.yes(
        "¿Llamé a mi padre la semana pasada?",
        "v02",
        [
          ["intent", "plan", "intencion"],
          ["no consta", "no tengo", "no hay"],
        ],
        true,
        true,
      ),
      fixture.yes("¿De qué quería hablar con mi padre por teléfono?", "v02", [
        ["huerto"],
      ]),
    ],
  ),
  fixture.scenario(
    "v03",
    "basic",
    "No me gustan las almendras tostadas, pero sí las avellanas.",
    [
      fixture.item(["almendras", "no"], "opinion"),
      fixture.item(["avellanas"], "opinion"),
    ],
    [
      fixture.yes(
        "¿Dije si me gustaban las almendras tostadas?",
        "v03",
        [["no"], ["almendras"]],
        true,
      ),
      fixture.yes("¿Qué fruto seco sí me gusta?", "v03", [["avellanas"]]),
    ],
  ),
  fixture.scenario(
    "v04",
    "time",
    "El examen de japonés será el 20 de noviembre de 2026 a las 18:30 en el aula 4.",
    [fixture.item(["examen", "18:30", "4"], "fact", "2026-11-20")],
    [
      fixture.yes("¿Cuándo es el examen de japonés?", "v04", [
        ["20 de noviembre", "2026-11-20"],
        ["18:30"],
      ]),
      fixture.yes("¿En qué aula me examino de japonés?", "v04", [
        ["aula 4", "aula numero 4"],
      ]),
    ],
  ),
  fixture.scenario(
    "v05",
    "time",
    "Para el lunes 16 de noviembre de 2026 tengo que hacer los ejercicios 3 y 5 de la página 42 del libro de japonés.",
    [fixture.item(["3", "5", "42", "japones"], "intention", "2026-11-16")],
    [
      fixture.yes("¿Qué deberes de japonés tengo para el lunes?", "v05", [
        ["3"],
        ["5"],
        ["42"],
      ]),
      fixture.yes(
        "¿Qué página tenía los ejercicios para el 16 de noviembre?",
        "v05",
        [["42"]],
      ),
    ],
  ),
  fixture.scenario(
    "v06",
    "context",
    "Gemma viajará a Roma el 21 de noviembre de 2026.",
    [fixture.item(["Gemma", "Roma"], "fact", "2026-11-21")],
    [
      {
        ...fixture.yes(
          "¿Qué quería ver aprovechando el viaje de Gemma a Roma?",
          "v01",
          [["dune"]],
        ),
        sources: ["v01", "v06"],
      },
      fixture.yes("¿A dónde viajará Gemma el día 21?", "v06", [["roma"]]),
    ],
  ),
  fixture.scenario(
    "v07",
    "context",
    "El lunes 9 de noviembre de 2026 quedé con Pablo, mi amigo del colegio, y me contó que había comido frijoles con arroz.",
    [fixture.item(["Pablo", "frijoles", "arroz"], "fact", "2026-11-09")],
    [
      fixture.yes(
        "¿De qué comida me habló mi amigo del colegio cuando quedamos?",
        "v07",
        [["frijoles"], ["arroz"]],
      ),
      fixture.yes("¿Qué hablamos Pablo y yo el lunes 9?", "v07", [
        ["frijoles"],
      ]),
    ],
  ),
  fixture.scenario(
    "v08",
    "ambiguity",
    "Pablo, mi compañero de trabajo, cumple años el 4 de marzo.",
    [fixture.item(["Pablo", "trabajo", "4", "marzo"])],
    [
      fixture.yes("¿Cuándo cumple años Pablo el del trabajo?", "v08", [
        ["4 de marzo"],
      ]),
      fixture.unclear("¿Cuándo cumple años Pablo?"),
    ],
  ),
  fixture.scenario(
    "v09",
    "ambiguity",
    "Pablo, mi hermano, cumple años el 8 de julio.",
    [fixture.item(["Pablo", "hermano", "8", "julio"])],
    [
      fixture.yes("¿Qué día cumple años mi hermano Pablo?", "v09", [
        ["8 de julio"],
      ]),
      fixture.unclear("¿Qué fecha tengo para el cumpleaños de Pablo?"),
    ],
  ),
  fixture.scenario(
    "v10",
    "ambiguity",
    "Él me dijo que el taller sería el viernes.",
    [fixture.item(["Takeshi", "taller"], "fact", "2026-11-13")],
    [
      fixture.yes("¿Quién me dijo la fecha del taller?", "v10", [["takeshi"]]),
      fixture.yes("¿Cuándo será el taller del que habló Takeshi?", "v10", [
        ["13 de noviembre", "2026-11-13"],
      ]),
    ],
    {
      status: "needs_clarification",
      clarification:
        "Takeshi, el profesor de cerámica. Se refería al viernes 13 de noviembre de 2026.",
    },
  ),
  fixture.scenario(
    "v11",
    "mixed",
    "Ayer compré una mochila amarilla en Nube, por 37 euros. Se me ocurrió escribir un cuento sobre un faro submarino.",
    [
      fixture.item(["mochila", "amarilla", "Nube", "37"], "fact", "2026-11-10"),
      fixture.item(["cuento", "faro", "submarino"], "thought"),
    ],
    [
      fixture.yes("¿Cuánto pagué por la mochila y en qué tienda?", "v11", [
        ["37"],
        ["nube"],
      ]),
      fixture.yes("¿Sobre qué era la idea de cuento que tuve?", "v11", [
        ["faro"],
        ["submarino"],
      ]),
    ],
  ),
  fixture.scenario(
    "v12",
    "mixed",
    "Me encantó el ramen de sésamo de Kumo. Hoy terminé de leer El jardín de las mareas.",
    [
      fixture.item(["ramen", "sesamo", "Kumo"], "opinion"),
      fixture.item(["jardin", "mareas"], "fact", "2026-11-11"),
    ],
    [
      fixture.yes("¿Qué plato me gustó en Kumo?", "v12", [
        ["ramen"],
        ["sesamo"],
      ]),
      fixture.yes("¿Qué libro terminé el 11 de noviembre?", "v12", [
        ["jardin"],
        ["mareas"],
      ]),
    ],
  ),
  fixture.scenario(
    "v13",
    "intention",
    "Estoy pensando en apuntarme a natación, aunque todavía no me he inscrito.",
    [fixture.item(["natacion", "no"], "intention")],
    [
      fixture.yes(
        "¿Ya me he apuntado a natación?",
        "v13",
        [["no"], ["inscrit", "apunt"]],
        true,
      ),
      fixture.yes("¿Qué deporte estaba pensando empezar?", "v13", [
        ["natacion"],
      ]),
    ],
  ),
  fixture.scenario(
    "v14",
    "intention",
    "Quiero regalar a Lucía una planta de jazmín en su cumpleaños, pero no sé cuándo es.",
    [fixture.item(["Lucia", "jazmin"], "intention")],
    [
      fixture.yes("¿Qué regalo tenía pensado para Lucía?", "v14", [["jazmin"]]),
      fixture.no("¿En qué fecha cumple años Lucía?"),
    ],
  ),
  fixture.scenario(
    "v15",
    "change",
    "Hasta octubre prefería el té verde; desde noviembre de 2026 prefiero el té negro.",
    [
      fixture.item(["te", "verde", "octubre"], "opinion"),
      fixture.item(["te", "negro", "noviembre"], "opinion"),
    ],
    [
      fixture.yes("¿Qué té prefiero ahora?", "v15", [["negro"]]),
      fixture.yes("¿Qué té prefería antes de noviembre?", "v15", [["verde"]]),
    ],
  ),
  fixture.scenario(
    "v16",
    "change",
    "Pensaba visitar el museo de vidrio el sábado, pero cambié de plan: iré al jardín botánico ese sábado 14 de noviembre de 2026.",
    [
      fixture.item(["museo", "vidrio", "plan"], "intention"),
      fixture.item(["jardin", "botanico"], "intention", "2026-11-14"),
    ],
    [
      fixture.yes(
        "¿Qué plan tengo finalmente para el sábado 14?",
        "v16",
        [["jardin"], ["botanico"]],
        true,
      ),
      fixture.yes("¿Qué visita descarté para ese sábado?", "v16", [
        ["museo"],
        ["vidrio"],
      ]),
    ],
  ),
];
