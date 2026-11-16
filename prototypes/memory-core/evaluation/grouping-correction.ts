import { ask, day, scenario, unit, unknown } from "./case.ts";

export const groupingCorrection = [
  scenario(
    "g43",
    "correction",
    "El marco de la lámina del recibidor mide 63 centímetros de alto. Quiero limpiar el cristal del escritorio.",
    [
      unit("frame", ["marco", "lamina", "recibidor", "63", "alto"], "fact"),
      unit("glass", ["limpiar", "cristal", "escritorio"]),
    ],
    [
      ask("¿Cuánto mide de alto el marco del recibidor?", ["frame"], ["63"]),
      ask("¿Qué cristal quiero limpiar?", ["glass"], ["escritorio"]),
    ],
    {
      correction: {
        label: "frame",
        text: "Me equivoqué al medir el marco: son 67 centímetros de alto, no 63.",
        expected: unit(
          "frame",
          ["marco", "lamina", "recibidor", "67", "alto"],
          "fact",
          unknown,
          { forbidden: ["63"] },
        ),
        query: ask(
          "¿Cuánto mide de alto el marco y dónde está la lámina?",
          ["frame"],
          ["67", "recibidor"],
          { forbidden: ["63"] },
        ),
      },
    },
  ),
  scenario(
    "g44",
    "correction",
    "La entrada al simposio de micología cuesta 46 euros. Quiero comprar una guía de líquenes.",
    [
      unit(
        "ticket",
        ["entrada", "simposio", "micologia", "46", "euros"],
        "fact",
      ),
      unit("guide", ["comprar", "guia", "liquenes"]),
    ],
    [
      ask(
        "¿Cuánto cuesta la entrada al simposio de micología?",
        ["ticket"],
        ["46"],
      ),
      ask("¿Sobre qué quiero comprar una guía?", ["guide"], ["liquenes"]),
    ],
    {
      correction: {
        label: "ticket",
        text: "Anoté mal el precio de la entrada: cuesta 49 euros, no 46.",
        expected: unit(
          "ticket",
          ["entrada", "simposio", "micologia", "49", "euros"],
          "fact",
          unknown,
          { forbidden: ["46"] },
        ),
        query: ask(
          "¿Cuál es el precio de entrada al simposio de micología?",
          ["ticket"],
          ["49"],
          { forbidden: ["46"] },
        ),
      },
    },
  ),
  scenario(
    "g45",
    "correction",
    "El 7 de octubre de 2026 tengo una ruta guiada por las marismas. Quiero llevar prismáticos.",
    [
      unit(
        "walk",
        ["ruta", "guiada", "marismas"],
        "intention",
        day("2026-10-07"),
      ),
      unit("binoculars", ["llevar", "prismaticos"]),
    ],
    [
      ask(
        "¿Cuándo tengo la ruta por las marismas?",
        ["walk"],
        ["7", "octubre"],
      ),
      ask("¿Qué instrumento quiero llevar?", ["binoculars"], ["prismaticos"]),
    ],
    {
      correction: {
        label: "walk",
        text: "La fecha que apunté de la ruta era incorrecta: es el 9 de octubre de 2026, no el 7.",
        expected: unit(
          "walk",
          ["ruta", "guiada", "marismas"],
          "intention",
          day("2026-10-09"),
          { forbidden: ["\\b7\\b"] },
        ),
        query: ask(
          "¿Qué día es la ruta guiada por las marismas?",
          ["walk"],
          ["9", "octubre"],
          { forbidden: ["\\b7\\b"] },
        ),
      },
    },
  ),
  scenario(
    "g46",
    "correction",
    "He acordado con Amalia revisar las fotos del faro en mi estudio. Quiero catalogar las postales.",
    [
      unit(
        "agreement",
        ["amalia", "revisar", "fotos", "faro", "estudio"],
        "fact",
      ),
      unit("postcards", ["catalogar", "postales"]),
    ],
    [
      ask(
        "¿Con quién acordé revisar las fotos del faro?",
        ["agreement"],
        ["amalia"],
      ),
      ask("¿Qué quiero catalogar?", ["postcards"], ["postales"]),
    ],
    {
      correction: {
        label: "agreement",
        text: "El nombre estaba mal: acordé revisarlas con Adela, no con Amalia.",
        expected: unit(
          "agreement",
          ["adela", "revisar", "fotos", "faro", "estudio"],
          "fact",
          unknown,
          { forbidden: ["amalia"] },
        ),
        query: ask(
          "¿Con quién y dónde acordé revisar las fotos del faro?",
          ["agreement"],
          ["adela", "estudio"],
          { forbidden: ["amalia"] },
        ),
      },
    },
  ),
  scenario(
    "g47",
    "correction",
    "Mañana quiero comprar una mochila verde para el curso de escalada. Quiero coser una funda de almohada.",
    [
      unit(
        "bag",
        ["comprar", "mochila", "verde", "curso", "escalada"],
        "intention",
        day("2026-07-15"),
      ),
      unit("cover", ["coser", "funda", "almohada"]),
    ],
    [
      ask(
        "¿Qué color de mochila quiero comprar para escalada?",
        ["bag"],
        ["verde"],
      ),
      ask("¿Qué funda quiero coser?", ["cover"], ["almohada"]),
    ],
    {
      correction: {
        label: "bag",
        text: "Me confundí con el color: la mochila que quiero comprar es violeta, no verde.",
        expected: unit(
          "bag",
          ["comprar", "mochila", "violeta", "curso", "escalada"],
          "intention",
          day("2026-07-15"),
          { forbidden: ["verde"] },
        ),
        query: ask(
          "¿De qué color, para qué curso y qué día quiero comprar la mochila?",
          ["bag"],
          ["violeta", "escalada", "15"],
          { forbidden: ["verde"] },
        ),
      },
    },
  ),
  scenario(
    "g48",
    "correction",
    "Antes prefería desayunar gachas; ahora prefiero desayunar tostadas de espelta.",
    [
      unit("before", ["antes", "prefer", "gachas"], "opinion"),
      unit(
        "now",
        ["ahora", "prefier|prefer", "tostadas", "espelta"],
        "opinion",
      ),
    ],
    [
      ask("¿Qué prefería desayunar antes?", ["before"], ["gachas"]),
      ask("¿Qué prefiero desayunar ahora?", ["now"], ["tostadas", "espelta"]),
    ],
    { expectedRelations: [{ kind: "evolvesFrom", from: "now", to: "before" }] },
  ),
];
