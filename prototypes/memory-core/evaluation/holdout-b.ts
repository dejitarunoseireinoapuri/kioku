import { ask, day, scenario, unit } from "./case.ts";
export const holdoutB = [
  scenario(
    "v13",
    "condition",
    "Si reabren el sendero, quiero subir a la ermita.",
    [
      unit("walk", ["sendero", "ermita"], "intention", undefined, {
        condition: "reabr|abran|abierto",
      }),
    ],
    [
      ask("¿De qué depende mi subida a la ermita?", ["walk"], ["sendero"]),
      ask("¿Ya he subido a la ermita?", [], [], { contextLabels: ["walk"] }),
    ],
  ),
  scenario(
    "v14",
    "condition",
    "Solo cuando entregue el informe quiero empezar el curso de origami.",
    [
      unit("course", ["informe", "origami"], "intention", undefined, {
        condition: "entreg.*informe",
      }),
    ],
    [
      ask("¿Cuándo quiero empezar origami?", ["course"], ["informe"]),
      ask("¿Qué fecha exacta tiene ese curso?", [], [], {
        previous: "¿Cuándo quiero empezar origami?",
        contextLabels: ["course"],
      }),
    ],
  ),
  scenario(
    "v15",
    "condition",
    "Si el billete cuesta más de 75 euros, no iré a la feria de minerales.",
    [
      unit("fair", ["75", "feria", "minerales"], "intention", undefined, {
        condition: "75",
        polarity: "negative",
      }),
    ],
    [
      ask("¿En qué caso no iré a la feria de minerales?", ["fair"], ["75"]),
      ask("¿Ya he ido a la feria de minerales?", [], [], {
        contextLabels: ["fair"],
      }),
    ],
  ),
  scenario(
    "v16",
    "condition",
    "Si nieva haré fotos desde el balcón; si no nieva, iré al estudio.",
    [
      unit("options", ["niev", "balcon", "estudio"], "intention", undefined, {
        condition: "niev",
      }),
    ],
    [
      ask("¿Qué haré si nieva?", ["options"], ["fotos", "balcon"]),
      ask("¿Qué haré si no nieva?", ["options"], ["estudio"]),
    ],
  ),
  scenario(
    "v17",
    "condition",
    "Cuando Berta termine su examen, quiero regalarle una acuarela.",
    [
      unit("gift", ["berta", "examen", "acuarela"], "intention", undefined, {
        condition: "termine|termin",
      }),
    ],
    [
      ask("¿Cuándo quiero regalar la acuarela?", ["gift"], ["examen"]),
      ask("¿Berta ya terminó el examen?", [], [], { contextLabels: ["gift"] }),
    ],
  ),
  scenario(
    "v18",
    "condition",
    "El 23 de agosto de 2026 quiero hacer paddle surf si el lago está tranquilo.",
    [
      unit(
        "lake",
        ["paddle", "lago", "tranquilo"],
        "intention",
        day("2026-08-23"),
        { condition: "lago.*tranquilo|tranquilo.*lago" },
      ),
    ],
    [
      ask("¿Qué día quiero hacer paddle surf?", ["lake"], ["23"]),
      ask(
        "¿Qué condición puse para hacerlo?",
        ["lake"],
        ["lago", "tranquilo"],
        { previous: "¿Qué día quiero hacer paddle surf?" },
      ),
    ],
  ),
  scenario(
    "v19",
    "attribution",
    "Héctor me dijo que quiere probar escalada en hielo. Yo quiero probar buceo.",
    [
      unit("hector", ["hector", "escalada", "hielo"], "quotation", undefined, {
        attribution: "hector",
      }),
      unit("self", ["buceo"]),
    ],
    [
      ask("¿Qué quiere probar Héctor?", ["hector"], ["escalada", "hielo"]),
      ask("¿Qué quiero probar yo?", ["self"], ["buceo"]),
    ],
  ),
  scenario(
    "v20",
    "attribution",
    "Mi prima me dijo que el zumo de granada es excelente. Yo no he probado ese zumo.",
    [
      unit("cousin", ["prima", "granada"], "quotation", undefined, {
        attribution: "prima",
      }),
      unit("taste", ["no", "probado", "granada"], "fact", undefined, {
        polarity: "negative",
      }),
    ],
    [
      ask(
        "¿Qué opina mi prima del zumo de granada?",
        ["cousin"],
        ["excelente|gusta"],
      ),
      ask("¿He probado el zumo de granada?", ["taste"], ["no"]),
    ],
  ),
  scenario(
    "v21",
    "attribution",
    "El guía dijo que el tramo mide 46 kilómetros. Mi mapa señala 42 kilómetros.",
    [
      unit("guide", ["guia", "46"], "quotation", undefined, {
        attribution: "guia",
      }),
      unit("map", ["mapa", "42"], "quotation", undefined, {
        attribution: "mapa",
      }),
    ],
    [
      ask("¿Cuánto mide el tramo según el guía?", ["guide"], ["46"]),
      ask("¿Qué distancia señala mi mapa?", ["map"], ["42"]),
    ],
  ),
  scenario(
    "v22",
    "attribution",
    "En la novela, la jardinera dice «las nubes coleccionan relojes». Esa frase me inspiró una idea para un mural.",
    [
      unit("quote", ["nubes", "relojes"], "quotation", undefined, {
        attribution: "jardinera",
      }),
      unit("idea", ["idea", "mural"], "fact"),
    ],
    [
      ask(
        "¿Qué coleccionan las nubes según la jardinera de la novela?",
        ["quote"],
        ["relojes"],
      ),
      ask("¿Para qué me inspiró una idea esa frase?", ["idea"], ["mural"]),
    ],
  ),
  scenario(
    "v23",
    "attribution",
    "Mi profesor me recomendó estudiar ritmos africanos. A mí me apetece practicar vals.",
    [
      unit(
        "advice",
        ["profesor", "ritmos", "africanos"],
        "quotation",
        undefined,
        { attribution: "profesor" },
      ),
      unit("waltz", ["vals"]),
    ],
    [
      ask(
        "¿Qué me recomendó estudiar mi profesor?",
        ["advice"],
        ["ritmos", "africanos"],
      ),
      ask("¿Qué me apetece practicar?", ["waltz"], ["vals"]),
    ],
  ),
  scenario(
    "v24",
    "attribution",
    "Rita me dijo que le molesta el olor del jazmín. A mí sí me gusta ese olor.",
    [
      unit("rita", ["rita", "jazmin"], "quotation", undefined, {
        attribution: "rita",
        polarity: "negative",
      }),
      unit("self", ["gusta", "jazmin"], "opinion"),
    ],
    [
      ask("¿Qué olor molesta a Rita?", ["rita"], ["jazmin"]),
      ask("¿Me gusta el olor del jazmín?", ["self"], ["gusta|si"]),
    ],
  ),
];
