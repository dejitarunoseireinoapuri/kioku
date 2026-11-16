import { ask, day, scenario, unit } from "./case.ts";
export const freshD = [
  scenario(
    "n37",
    "similar",
    "El 3 de julio de 2026 fui al faro de Arista. El 3 de agosto de 2026 quiero volver al faro de Arista.",
    [
      unit("past", ["faro", "arista"], "fact", day("2026-07-03")),
      unit("future", ["faro", "arista"], "intention", day("2026-08-03")),
    ],
    [
      ask("¿Cuándo fui al faro de Arista?", ["past"], ["3", "julio"]),
      ask(
        "¿Cuándo quiero volver al faro de Arista?",
        ["future"],
        ["3", "agosto"],
      ),
    ],
  ),
  scenario(
    "n38",
    "similar",
    "Mi prima Mar quiere aprender italiano. Mi compañera Mar quiere aprender polaco.",
    [
      unit("cousin", ["prima", "mar", "italiano"]),
      unit("work", ["companera", "mar", "polaco"]),
    ],
    [
      ask(
        "¿Qué idioma quiere aprender mi prima Mar?",
        ["cousin"],
        ["italiano"],
      ),
      ask("¿Y mi compañera Mar?", ["work"], ["polaco"], {
        previous: "¿Qué idioma quiere aprender mi prima Mar?",
      }),
    ],
  ),
  scenario(
    "n39",
    "similar",
    "Me encanta la tarta de pistacho, pero no me gusta la bebida de pistacho.",
    [
      unit("cake", ["tarta", "pistacho"], "opinion"),
      unit("drink", ["bebida", "pistacho"], "opinion", undefined, {
        polarity: "negative",
      }),
    ],
    [
      ask("¿Me gusta la tarta de pistacho?", ["cake"], ["si|encanta|gusta"]),
      ask("¿Y la bebida de pistacho?", ["drink"], ["no"], {
        previous: "¿Me gusta la tarta de pistacho?",
      }),
    ],
  ),
  scenario(
    "n40",
    "similar",
    "Hoy quiero visitar el archivo de mapas de Clarabosque. Mañana quiero visitar el archivo de mapas de Pedralta.",
    [
      unit("today", ["mapas", "clarabosque"], "intention", day("2026-07-14")),
      unit("tomorrow", ["mapas", "pedralta"], "intention", day("2026-07-15")),
    ],
    [
      ask("¿Dónde quiero ver mapas hoy?", ["today"], ["clarabosque"]),
      ask("¿Y mañana?", ["tomorrow"], ["pedralta"], {
        previous: "¿Dónde quiero ver mapas hoy?",
      }),
    ],
  ),
  scenario(
    "n41",
    "similar",
    "El adaptador del microscopio está en el estuche rojo. El adaptador del trípode está en la cesta negra.",
    [
      unit(
        "microscope",
        ["adaptador", "microscopio", "estuche", "rojo"],
        "fact",
      ),
      unit("tripod", ["adaptador", "tripode", "cesta", "negra"], "fact"),
    ],
    [
      ask(
        "¿Dónde está el adaptador del microscopio?",
        ["microscope"],
        ["estuche", "rojo"],
      ),
      ask("¿Y el del trípode?", ["tripod"], ["cesta", "negra"], {
        previous: "¿Dónde está el adaptador del microscopio?",
      }),
    ],
  ),
  scenario(
    "n42",
    "similar",
    "El 11 de julio de 2026 preparé fideos con tofu. El 18 de julio de 2026 quiero preparar fideos con berenjena.",
    [
      unit("tofu", ["fideos", "tofu"], "fact", day("2026-07-11")),
      unit("eggplant", ["fideos", "berenjena"], "intention", day("2026-07-18")),
    ],
    [
      ask("¿Con qué preparé fideos el 11?", ["tofu"], ["tofu"]),
      ask("¿Con qué quiero prepararlos el 18?", ["eggplant"], ["berenjena"], {
        previous: "¿Con qué preparé fideos el 11?",
      }),
    ],
  ),
  scenario(
    "n43",
    "correction",
    "Guardé nueve tornillos de latón en el cajón azul.",
    [unit("screws", ["nueve|9", "tornillos", "laton", "azul"], "fact")],
    [
      ask("¿Cuántos tornillos de latón guardé?", ["screws"], ["nueve|9"]),
      ask("¿Dónde los guardé?", ["screws"], ["azul"], {
        previous: "¿Cuántos tornillos de latón guardé?",
      }),
    ],
    {
      correction: {
        label: "screws",
        text: "Eran ocho tornillos, no nueve.",
        expected: unit(
          "screws",
          ["ocho|8", "tornillos", "laton", "azul"],
          "fact",
          undefined,
          { forbidden: ["nueve|9"] },
        ),
        query: ask(
          "¿Cuántos tornillos guardé, de qué material y dónde?",
          ["screws"],
          ["ocho|8", "laton", "azul"],
          { forbidden: ["nueve|9"] },
        ),
      },
    },
  ),
  scenario(
    "n44",
    "correction",
    "El 8 de agosto de 2026 quiero merendar en Brezo con mi sobrino.",
    [unit("snack", ["brezo", "sobrino"], "intention", day("2026-08-08"))],
    [
      ask("¿Dónde quiero merendar?", ["snack"], ["brezo"]),
      ask("¿Con quién quiero merendar?", ["snack"], ["sobrino"]),
    ],
    {
      correction: {
        label: "snack",
        text: "La persona es mi abuelo, no mi sobrino.",
        expected: unit(
          "snack",
          ["brezo", "abuelo"],
          "intention",
          day("2026-08-08"),
          { forbidden: ["sobrino"] },
        ),
        query: ask(
          "¿Con quién quiero merendar, dónde y qué día?",
          ["snack"],
          ["abuelo", "brezo", "8"],
          { forbidden: ["sobrino"] },
        ),
      },
    },
  ),
  scenario(
    "n45",
    "correction",
    "El 20 de julio de 2026 tengo sesión de fotografía en el estudio Vértice. Quiero comprar un filtro polarizador.",
    [
      unit(
        "session",
        ["fotografia", "vertice"],
        "intention",
        day("2026-07-20"),
      ),
      unit("filter", ["filtro", "polarizador"]),
    ],
    [
      ask("¿Cuándo es la sesión del estudio Vértice?", ["session"], ["20"]),
      ask("¿Qué filtro quiero comprar?", ["filter"], ["polarizador"]),
    ],
    {
      correction: {
        label: "session",
        text: "Me equivoqué con el día: es el 22 de julio de 2026.",
        expected: unit(
          "session",
          ["fotografia", "vertice"],
          "intention",
          day("2026-07-22"),
        ),
        query: ask(
          "¿Dónde y cuándo tengo la sesión de fotografía?",
          ["session"],
          ["vertice", "22"],
          { forbidden: ["20"] },
        ),
      },
    },
  ),
  scenario(
    "n46",
    "correction",
    "No me gusta el batido de dátil porque es demasiado espeso.",
    [
      unit("shake", ["datil", "espeso"], "opinion", undefined, {
        polarity: "negative",
      }),
    ],
    [
      ask("¿Me gusta el batido de dátil?", ["shake"], ["no"]),
      ask("¿Por qué no me gusta?", ["shake"], ["espeso"], {
        previous: "¿Me gusta el batido de dátil?",
      }),
    ],
    {
      correction: {
        label: "shake",
        text: "Me equivoqué con la fruta: era batido de papaya, no de dátil.",
        expected: unit("shake", ["papaya", "espeso"], "opinion", undefined, {
          polarity: "negative",
          forbidden: ["datil"],
        }),
        query: ask(
          "¿Qué batido no me gusta y por qué?",
          ["shake"],
          ["papaya", "espeso"],
          { forbidden: ["datil"] },
        ),
      },
    },
  ),
  scenario(
    "n47",
    "correction",
    "En 2023 prefería patinar sobre hielo. Desde 2025 prefiero patinar sobre ruedas.",
    [
      unit("old", ["patinar", "hielo"], "opinion", {
        precision: "year",
        value: "2023",
        end: null,
      }),
      unit("new", ["patinar", "ruedas"], "opinion", {
        precision: "year",
        value: "2025",
        end: null,
      }),
    ],
    [
      ask("¿Cómo prefería patinar en 2023?", ["old"], ["hielo"]),
      ask("¿Cómo prefiero patinar desde 2025?", ["new"], ["ruedas"]),
    ],
  ),
  scenario(
    "n48",
    "correction",
    "La profesora Ada me dijo que el taller dura 45 minutos.",
    [
      unit("duration", ["ada", "45", "minutos"], "quotation", undefined, {
        attribution: "ada",
      }),
    ],
    [
      ask("¿Cuánto dura el taller según Ada?", ["duration"], ["45"]),
      ask("¿Quién me dijo la duración del taller?", ["duration"], ["ada"]),
    ],
    {
      correction: {
        label: "duration",
        text: "Me equivoqué al escribir la duración: son 50 minutos, no 45.",
        expected: unit(
          "duration",
          ["ada", "50", "minutos"],
          "quotation",
          undefined,
          { attribution: "ada", forbidden: ["45"] },
        ),
        query: ask(
          "¿Cuánto dura el taller y quién lo dijo?",
          ["duration"],
          ["50", "ada"],
          { forbidden: ["45"] },
        ),
      },
    },
  ),
];
