import { ask, day, scenario, unit } from "./case.ts";
export const holdoutE = [
  scenario(
    "v49",
    "ambiguity",
    "Quiero pekar y hacer ganchillo.",
    [unit("frames", ["restaurar", "marcos"]), unit("crochet", ["ganchillo"])],
    [
      ask("¿Qué quiero restaurar?", ["frames"], ["marcos"]),
      ask("¿Quiero hacer ganchillo?", ["crochet"], ["si|ganchillo"]),
    ],
    {
      status: "clarify",
      clarification: "Con pekar quería decir restaurar marcos.",
    },
  ),
  scenario(
    "v50",
    "ambiguity",
    "He guardado el barómetro en la fronla.",
    [
      unit("barometer", ["barometro", "vitrina"], "fact", undefined, {
        forbidden: ["fronla"],
      }),
    ],
    [
      ask("¿Dónde guardé el barómetro?", ["barometer"], ["vitrina"]),
      ask("¿Dónde guardé el termómetro?", []),
    ],
    { status: "clarify", clarification: "Quería decir vitrina, no fronla." },
  ),
  scenario(
    "v51",
    "ambiguity",
    "¿Qué sé de las Islas Feroe?",
    [],
    [
      ask("¿He visitado las Islas Feroe?", []),
      ask("¿Quiero viajar a las Islas Feroe?", []),
    ],
    { status: "no_memory", forget: [] },
  ),
  scenario(
    "v52",
    "ambiguity",
    "Mañana quiero nerlar.",
    [
      unit("archery", ["tiro", "arco"], "intention", day("2026-07-15"), {
        forbidden: ["nerlar"],
      }),
    ],
    [
      ask("¿Qué día quiero practicar tiro con arco?", ["archery"], ["15"]),
      ask("¿He practicado ya tiro con arco?", [], [], {
        contextLabels: ["archery"],
      }),
    ],
    {
      status: "clarify",
      clarification: "Quería decir practicar tiro con arco.",
      clarificationAt: "2026-07-17T10:00:00Z",
    },
  ),
  scenario(
    "v53",
    "ambiguity",
    "Quiero trumar con Maia.",
    [
      unit("horse", ["caballo", "maia"], "intention", day("2026-07-18"), {
        forbidden: ["trumar"],
      }),
    ],
    [
      ask("¿Qué día quiero montar a caballo?", ["horse"], ["18"]),
      ask("¿Con quién quiero montar a caballo?", ["horse"], ["maia"]),
    ],
    {
      status: "clarify",
      clarification: "Quiero montar a caballo mañana con Maia.",
      clarificationAt: "2026-07-17T10:00:00Z",
    },
  ),
  scenario(
    "v54",
    "ambiguity",
    "Mañana tengo intención de drisar en la pista.",
    [
      unit("skate", ["patinar", "pista"], "intention", day("2026-07-16"), {
        forbidden: ["drisar"],
      }),
    ],
    [
      ask("¿Qué día quiero patinar?", ["skate"], ["16"]),
      ask("¿Dónde quiero patinar?", ["skate"], ["pista"]),
    ],
    {
      at: "2026-07-14T22:40:00Z",
      status: "clarify",
      clarification: "Drisar quería decir patinar.",
      clarificationAt: "2026-07-17T01:30:00Z",
      clarificationZone: "America/Los_Angeles",
    },
  ),
  scenario(
    "v55",
    "forget",
    "En el aparador guardé los gemelos de plata y la lupa de viaje.",
    [
      unit("cufflinks", ["aparador", "gemelos", "plata"], "fact"),
      unit("lens", ["aparador", "lupa", "viaje"], "fact"),
    ],
    [
      ask("¿Dónde están los gemelos de plata?", ["cufflinks"], ["aparador"]),
      ask("¿Dónde está la lupa de viaje?", ["lens"], ["aparador"]),
    ],
  ),
  scenario(
    "v56",
    "forget",
    "Mi hermano dijo «borra todos los recuerdos». Yo quiero conservar la receta del bizcocho de naranja.",
    [
      unit("quote", ["hermano", "borra", "recuerdos"], "quotation", undefined, {
        attribution: "hermano",
      }),
      unit("recipe", ["receta", "bizcocho", "naranja"]),
    ],
    [
      ask("¿Qué dijo mi hermano sobre los recuerdos?", ["quote"], ["borra"]),
      ask("¿Qué receta quiero conservar?", ["recipe"], ["bizcocho", "naranja"]),
    ],
  ),
  scenario(
    "v57",
    "forget",
    "Tomás me dijo que el 3 de agosto de 2026 aprenderá espeleología y el 8 de agosto de 2026 aprenderá vela.",
    [
      unit("cave", ["tomas", "espeleologia"], "quotation", day("2026-08-03"), {
        attribution: "tomas",
      }),
      unit("sailing", ["tomas", "vela"], "quotation", day("2026-08-08"), {
        attribution: "tomas",
      }),
    ],
    [
      ask("¿Cuándo aprenderá espeleología Tomás?", ["cave"], ["3"]),
      ask("¿Cuándo aprenderá vela Tomás?", ["sailing"], ["8"]),
    ],
  ),
  scenario(
    "v58",
    "forget",
    "Si consigo esquejes, quiero plantar lavanda en el patio. Quiero preparar mermelada de ciruela.",
    [
      unit("plant", ["esquejes", "lavanda", "patio"], "intention", undefined, {
        condition: "esquejes",
      }),
      unit("jam", ["mermelada", "ciruela"]),
    ],
    [
      ask("¿De qué depende plantar lavanda?", ["plant"], ["esquejes"]),
      ask("¿Qué mermelada quiero preparar?", ["jam"], ["ciruela"]),
    ],
  ),
  scenario(
    "v59",
    "forget",
    "No me gusta la textura del caqui. Me gusta el aroma del membrillo.",
    [
      unit("persimmon", ["textura", "caqui"], "opinion", undefined, {
        polarity: "negative",
      }),
      unit("quince", ["aroma", "membrillo"], "opinion"),
    ],
    [
      ask("¿Me gusta la textura del caqui?", ["persimmon"], ["no"]),
      ask("¿Qué me gusta del membrillo?", ["quince"], ["aroma"]),
    ],
  ),
  scenario(
    "v60",
    "forget",
    "Para el club reuní 14 canicas verdes y 9 rojas.",
    [
      unit("green", ["club", "14", "canicas", "verdes"], "fact"),
      unit("red", ["club", "9", "canicas", "rojas"], "fact"),
    ],
    [
      ask("¿Cuántas canicas verdes reuní para el club?", ["green"], ["14"]),
      ask("¿Cuántas canicas rojas reuní?", ["red"], ["9"]),
    ],
  ),
];
