import { ask, scenario, unit, unknown } from "./case.ts";

export const groupingIndependent = [
  scenario(
    "g01",
    "independent",
    "El puré de chirivía me parece demasiado salado y no me gusta. He regado el helecho del recibidor.",
    [
      unit("puree", ["pure", "chirivia", "salado"], "opinion", unknown, {
        polarity: "negative",
      }),
      unit("fern", ["regado", "helecho", "recibidor"], "fact"),
    ],
    [
      ask("¿Qué me desagradó del puré de chirivía?", ["puree"], ["salado"]),
      ask("¿Qué planta he regado?", ["fern"], ["helecho", "recibidor"]),
    ],
  ),
  scenario(
    "g02",
    "independent",
    "La bufanda de lino me pica en el cuello y por eso no me gusta. He dejado el trípode en el desván.",
    [
      unit("scarf", ["bufanda", "lino", "pica", "cuello"], "opinion", unknown, {
        polarity: "negative",
      }),
      unit("tripod", ["tripode", "desvan"], "fact"),
    ],
    [
      ask(
        "¿Por qué no me gusta la bufanda de lino?",
        ["scarf"],
        ["pica", "cuello"],
      ),
      ask("¿Dónde dejé el trípode?", ["tripod"], ["desvan"]),
    ],
  ),
  scenario(
    "g03",
    "independent",
    "El sillón de ratán me resulta cómodo y me encanta para leer. Tengo pendiente revelar el carrete de la excursión.",
    [
      unit("chair", ["sillon", "ratan", "comodo", "leer"], "opinion"),
      unit("film", ["revelar", "carrete", "excursion"]),
    ],
    [
      ask("¿Qué me gusta del sillón de ratán?", ["chair"], ["comodo", "leer"]),
      ask(
        "¿Qué tengo pendiente relacionado con fotografías?",
        ["film"],
        ["revelar", "carrete"],
      ),
    ],
  ),
  scenario(
    "g04",
    "independent",
    "La mermelada de higos me gusta; la de naranja amarga no me gusta.",
    [
      unit("fig", ["mermelada", "higos", "gusta"], "opinion"),
      unit("orange", ["mermelada", "naranja", "amarga"], "opinion", unknown, {
        polarity: "negative",
      }),
    ],
    [
      ask("¿Me gusta la mermelada de higos?", ["fig"], ["gusta"]),
      ask(
        "¿Me gusta la mermelada de naranja amarga?",
        ["orange"],
        ["no", "gusta"],
      ),
    ],
  ),
  scenario(
    "g05",
    "independent",
    "El radiador del estudio hace ruido. He pedido una revisión del radiador al técnico.",
    [
      unit("noise", ["radiador", "estudio", "ruido"], "fact"),
      unit("request", ["pedido", "revision", "radiador", "tecnico"], "fact"),
    ],
    [
      ask("¿Qué problema tiene el radiador del estudio?", ["noise"], ["ruido"]),
      ask("¿He pedido que revisen el radiador?", ["request"], ["revision"]),
    ],
  ),
  scenario(
    "g06",
    "independent",
    "Me gusta el olor del jabón de cedro, pero no me gusta su textura pegajosa.",
    [
      unit("smell", ["jabon", "cedro", "olor", "gusta"], "opinion"),
      unit(
        "texture",
        ["jabon", "cedro", "textura", "pegajosa"],
        "opinion",
        unknown,
        { polarity: "negative" },
      ),
    ],
    [
      ask("¿Qué dije del olor del jabón de cedro?", ["smell"], ["gusta"]),
      ask(
        "¿Qué dije de la textura del jabón de cedro?",
        ["texture"],
        ["pegajosa"],
      ),
    ],
  ),
];
