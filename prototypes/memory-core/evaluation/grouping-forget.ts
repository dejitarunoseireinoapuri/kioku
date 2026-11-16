import { ask, day, scenario, unit, unknown } from "./case.ts";

export const groupingForget = [
  scenario(
    "g55",
    "forget",
    "El ambientador de vainilla me resulta empalagoso y no me gusta. He guardado las servilletas en el aparador.",
    [
      unit(
        "scent",
        ["ambientador", "vainilla", "empalagoso"],
        "opinion",
        unknown,
        { polarity: "negative" },
      ),
      unit("napkins", ["servilletas", "aparador"], "fact"),
    ],
    [
      ask(
        "¿Qué me parece el ambientador de vainilla?",
        ["scent"],
        ["empalagoso"],
      ),
      ask("¿Dónde están las servilletas?", ["napkins"], ["aparador"]),
    ],
  ),
  scenario(
    "g56",
    "forget",
    "Hay nueve sobres acolchados en el estante y tres en el armario.",
    [
      unit("shelf", ["sobres", "acolchados", "nueve|9", "estante"], "fact"),
      unit("cabinet", ["sobres", "acolchados", "tres|3", "armario"], "fact"),
    ],
    [
      ask(
        "¿Cuántos sobres acolchados hay en el estante?",
        ["shelf"],
        ["nueve|9"],
      ),
      ask(
        "¿Cuántos sobres acolchados hay en el armario?",
        ["cabinet"],
        ["tres|3"],
      ),
    ],
  ),
  scenario(
    "g57",
    "forget",
    "Quiero visitar el molino de agua, reparar el cierre del collar y aprender a hacer cianotipias.",
    [
      unit("mill", ["visitar", "molino", "agua"]),
      unit("clasp", ["reparar", "cierre", "collar"]),
      unit("prints", ["aprender", "cianotipias"]),
    ],
    [
      ask("¿Qué molino quiero visitar?", ["mill"], ["agua"]),
      ask("¿Qué quiero reparar del collar?", ["clasp"], ["cierre"]),
      ask("¿Qué técnica quiero aprender?", ["prints"], ["cianotipias"]),
    ],
    {
      forget: ["clasp"],
      after: [
        ask("¿Qué quiero reparar del collar?", [], [], { status: "not_found" }),
        ask("¿Qué molino quiero visitar?", ["mill"], ["agua"]),
        ask("¿Qué técnica quiero aprender?", ["prints"], ["cianotipias"]),
      ],
    },
  ),
  scenario(
    "g58",
    "forget",
    "El lema de la exposición es «Rompe el molde y cambia el rumbo». Tengo la entrada de la exposición en mi cartera.",
    [
      unit(
        "motto",
        ["lema", "exposicion", "rompe", "molde", "cambia", "rumbo"],
        "quotation",
        unknown,
        { attribution: "exposicion|lema" },
      ),
      unit("ticket", ["entrada", "exposicion", "cartera"], "fact"),
    ],
    [
      ask("¿Cuál es el lema de la exposición?", ["motto"], ["molde", "rumbo"]),
      ask("¿Dónde tengo la entrada de la exposición?", ["ticket"], ["cartera"]),
    ],
  ),
  scenario(
    "g59",
    "forget",
    "Hoy quiero practicar malabares. Mañana quiero aprender un truco de cartas.",
    [
      unit(
        "juggle",
        ["practicar", "malabares"],
        "intention",
        day("2026-07-14"),
      ),
      unit(
        "cards",
        ["aprender", "truco", "cartas"],
        "intention",
        day("2026-07-15"),
      ),
    ],
    [
      ask("¿Qué quiero practicar hoy?", ["juggle"], ["malabares"]),
      ask("¿Y mañana?", ["cards"], ["truco", "cartas"], {
        previous: "¿Qué quiero practicar hoy?",
      }),
    ],
  ),
  scenario(
    "g60",
    "forget",
    "He comprado un pincel de abanico. Quiero pintar una acuarela del acantilado.",
    [
      unit("brush", ["comprado", "pincel", "abanico"], "fact"),
      unit("painting", ["pintar", "acuarela", "acantilado"]),
    ],
    [
      ask("¿Qué pincel he comprado?", ["brush"], ["abanico"]),
      ask("¿Qué quiero pintar con acuarela?", ["painting"], ["acantilado"]),
    ],
    {
      forget: ["brush", "painting"],
      after: [
        ask("¿Qué pincel he comprado?", [], [], { status: "not_found" }),
        ask("¿Qué quiero pintar con acuarela?", [], [], {
          status: "not_found",
        }),
      ],
    },
  ),
];
