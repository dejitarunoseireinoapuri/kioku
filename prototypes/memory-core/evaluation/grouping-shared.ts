import { ask, scenario, unit, unknown } from "./case.ts";

export const groupingShared = [
  scenario(
    "g07",
    "shared",
    "He colocado siete tazas en la vitrina y dos cuencos en la alacena.",
    [
      unit("cups", ["colocado", "tazas", "vitrina", "siete|7"], "fact"),
      unit("bowls", ["colocado", "cuencos", "alacena", "\\bdos\\b|2"], "fact"),
    ],
    [
      ask("¿Cuántas tazas coloqué en la vitrina?", ["cups"], ["siete|7"]),
      ask(
        "¿Cuántos cuencos coloqué en la alacena?",
        ["bowls"],
        ["\\bdos\\b|2"],
      ),
    ],
  ),
  scenario(
    "g08",
    "shared",
    "En el taller de cerámica esmalté una jarra y pulí un plato.",
    [
      unit("jug", ["taller", "ceramica", "esmalt", "jarra"], "fact"),
      unit("plate", ["taller", "ceramica", "pul", "plato"], "fact"),
    ],
    [
      ask("¿Qué hice con la jarra en el taller?", ["jug"], ["esmalt"]),
      ask("¿Dónde pulí el plato?", ["plate"], ["taller", "ceramica"]),
    ],
  ),
  scenario(
    "g09",
    "shared",
    "He regalado a mi sobrina una lupa y a mi vecino una brújula de latón.",
    [
      unit("lens", ["regal", "sobrina", "lupa"], "fact"),
      unit("compass", ["regal", "vecino", "brujula", "laton"], "fact"),
    ],
    [
      ask("¿Qué regalé a mi sobrina?", ["lens"], ["lupa"]),
      ask("¿Qué regalé a mi vecino?", ["compass"], ["brujula", "laton"]),
    ],
  ),
  scenario(
    "g10",
    "shared",
    "En la biblioteca del barrio quiero donar mapas y consultar el archivo de periódicos.",
    [
      unit("maps", ["biblioteca", "barrio", "donar", "mapas"]),
      unit("papers", ["biblioteca", "barrio", "consultar", "periodicos"]),
    ],
    [
      ask(
        "¿Qué quiero donar en la biblioteca del barrio?",
        ["maps"],
        ["mapas"],
      ),
      ask(
        "¿Qué quiero consultar en esa biblioteca?",
        ["papers"],
        ["periodicos"],
      ),
    ],
  ),
  scenario(
    "g11",
    "shared",
    "El olor del mango me gusta, pero todavía no lo he probado.",
    [
      unit("smell", ["olor", "mango", "gusta"], "opinion"),
      unit("taste", ["mango", "probado"], "fact", unknown, {
        polarity: "negative",
      }),
    ],
    [
      ask("¿Me gusta el olor del mango?", ["smell"], ["gusta"]),
      ask("¿He probado el mango?", ["taste"], ["no", "probado"]),
    ],
  ),
  scenario(
    "g12",
    "shared",
    "Guardé cinco tornillos de cobre y ocho de acero en cajas separadas.",
    [
      unit(
        "copper",
        ["guard", "tornillos", "cobre", "cinco|5", "cajas"],
        "fact",
      ),
      unit("steel", ["guard", "tornillos", "acero", "ocho|8", "cajas"], "fact"),
    ],
    [
      ask("¿Cuántos tornillos de cobre guardé?", ["copper"], ["cinco|5"]),
      ask("¿Cuántos tornillos de acero guardé?", ["steel"], ["ocho|8"]),
    ],
  ),
];
