import { ask, day, scenario, unit, unknown } from "./case.ts";

export const groupingSimilar = [
  scenario(
    "g37",
    "similar",
    "Mi dentista Vera quiere aprender grabado. Mi compañera Vera quiere aprender tapicería.",
    [
      unit("dentist", ["dentista", "vera", "grabado"]),
      unit("colleague", ["companera", "vera", "tapiceria"]),
    ],
    [
      ask("¿Qué quiere aprender mi dentista Vera?", ["dentist"], ["grabado"]),
      ask(
        "¿Qué quiere aprender mi compañera Vera?",
        ["colleague"],
        ["tapiceria"],
      ),
    ],
  ),
  scenario(
    "g38",
    "similar",
    "No quiero participar en la carrera nocturna. Mi hermano sí quiere participar en la carrera nocturna.",
    [
      unit(
        "self",
        ["participar", "carrera", "nocturna"],
        "intention",
        unknown,
        { polarity: "negative" },
      ),
      unit("brother", ["hermano", "participar", "carrera", "nocturna"]),
    ],
    [
      ask("¿Quiero participar yo en la carrera nocturna?", ["self"], ["no"]),
      ask(
        "¿Quiere mi hermano participar en la carrera nocturna?",
        ["brother"],
        ["quiere"],
      ),
    ],
  ),
  scenario(
    "g39",
    "similar",
    "Mi madre quiere probar el taller de mosaicos. Mi padre me dijo que quiere probar el taller de mosaicos.",
    [
      unit("mother", ["madre", "probar", "taller", "mosaicos"]),
      unit(
        "father",
        ["padre", "probar", "taller", "mosaicos"],
        "quotation",
        unknown,
        { attribution: "padre" },
      ),
    ],
    [
      ask("¿Qué taller quiere probar mi madre?", ["mother"], ["mosaicos"]),
      ask(
        "¿Qué taller me dijo mi padre que quiere probar?",
        ["father"],
        ["mosaicos"],
      ),
    ],
  ),
  scenario(
    "g40",
    "similar",
    "El 19 de agosto de 2026 quiero visitar el castillo de Loarre. El 26 de agosto de 2026 quiero visitar el castillo de Loarre.",
    [
      unit(
        "first",
        ["visitar", "castillo", "loarre"],
        "intention",
        day("2026-08-19"),
      ),
      unit(
        "second",
        ["visitar", "castillo", "loarre"],
        "intention",
        day("2026-08-26"),
      ),
    ],
    [
      ask("¿Qué quiero visitar el 19 de agosto?", ["first"], ["loarre"]),
      ask("¿Qué quiero visitar el 26 de agosto?", ["second"], ["loarre"]),
    ],
  ),
  scenario(
    "g41",
    "similar",
    "Quiero reservar una mesa en El Azafrán. Ya he reservado una mesa en La Albahaca.",
    [
      unit("plan", ["reservar", "mesa", "azafran"]),
      unit("booked", ["reservado", "mesa", "albahaca"], "fact"),
    ],
    [
      ask("¿Dónde quiero reservar una mesa?", ["plan"], ["azafran"]),
      ask("¿Dónde ya he reservado una mesa?", ["booked"], ["albahaca"]),
    ],
  ),
  scenario(
    "g42",
    "similar",
    "Mi ahijado no quiere tocar el violonchelo. Mi sobrino quiere tocar el violonchelo.",
    [
      unit(
        "godson",
        ["ahijado", "tocar", "violonchelo"],
        "intention",
        unknown,
        { polarity: "negative" },
      ),
      unit("nephew", ["sobrino", "tocar", "violonchelo"]),
    ],
    [
      ask("¿Quiere mi ahijado tocar el violonchelo?", ["godson"], ["no"]),
      ask("¿Quiere mi sobrino tocar el violonchelo?", ["nephew"], ["quiere"]),
    ],
  ),
];
