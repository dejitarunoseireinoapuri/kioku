import { ask, day, scenario, unit } from "./case.ts";
export const finalIndependent = [
  scenario(
    "f01",
    "independent",
    "Hoy he entregado un paquete de cerámica en la oficina del barrio. Para desconectar, me apetece aprender origami.",
    [
      unit(
        "parcel",
        ["paquete", "ceramica", "oficina", "barrio"],
        "fact",
        day("2026-07-14"),
      ),
      unit("origami", ["origami", "desconectar"]),
    ],
    [
      ask(
        "¿Dónde entregué el paquete de cerámica?",
        ["parcel"],
        ["oficina", "barrio"],
      ),
      ask(
        "¿Qué me apetece aprender para desconectar?",
        ["origami"],
        ["origami"],
      ),
    ],
  ),
  scenario(
    "f02",
    "independent",
    "He devuelto el trípode prestado a Candela; sigo teniendo pendiente calibrar la impresora.",
    [
      unit("tripod", ["tripode", "candela"], "fact"),
      unit("printer", ["calibrar", "impresora"]),
    ],
    [
      ask("¿A quién devolví el trípode?", ["tripod"], ["candela"]),
      ask(
        "¿Qué tengo pendiente hacer con la impresora?",
        ["printer"],
        ["calibrar"],
      ),
    ],
  ),
  scenario(
    "f03",
    "independent",
    "El segundo cajón de la cómoda contiene mi cargador de pilas. Tengo ganas de probar el desayuno del hotel Mirador.",
    [
      unit(
        "charger",
        ["segundo", "cajon", "comoda", "cargador", "pilas"],
        "fact",
      ),
      unit("breakfast", ["desayuno", "hotel", "mirador"]),
    ],
    [
      ask(
        "¿En qué cajón está el cargador de pilas?",
        ["charger"],
        ["segundo", "comoda"],
      ),
      ask(
        "¿Qué desayuno me apetecía probar?",
        ["breakfast"],
        ["hotel", "mirador"],
      ),
    ],
  ),
  scenario(
    "f04",
    "independent",
    "La sopa de castañas me resulta demasiado dulce y no me gusta. Anoche acabé de montar la lámpara del pasillo.",
    [
      unit(
        "soup",
        ["sopa", "castanas", "demasiado", "dulce"],
        "opinion",
        undefined,
        { polarity: "negative" },
      ),
      unit("lamp", ["lampara", "pasillo"], "fact", day("2026-07-13")),
    ],
    [
      ask("¿Qué me parecía demasiado dulce?", ["soup"], ["sopa", "castanas"]),
      ask("¿Qué terminé de montar anoche?", ["lamp"], ["lampara", "pasillo"]),
    ],
  ),
  scenario(
    "f05",
    "independent",
    "He comprado una entrada para la exposición de minerales. Aún no he decidido qué ver durante las vacaciones.",
    [
      unit("ticket", ["entrada", "exposicion", "minerales"], "fact"),
      unit("decision", ["no", "decid", "vacaciones"], "fact", undefined, {
        polarity: "negative",
      }),
    ],
    [
      ask(
        "¿Para qué exposición compré una entrada?",
        ["ticket"],
        ["minerales"],
      ),
      ask(
        "¿Había decidido ya qué ver durante las vacaciones?",
        ["decision"],
        ["no"],
      ),
    ],
  ),
  scenario(
    "f06",
    "independent",
    "Me he apuntado al boletín del planetario. El programa que quiero probar para dibujar se llama Lienzo Lunar.",
    [
      unit("bulletin", ["boletin", "planetario"], "fact"),
      unit("software", ["dibujar", "lienzo lunar"]),
    ],
    [
      ask("¿A qué boletín me apunté?", ["bulletin"], ["planetario"]),
      ask(
        "¿Cómo se llama el programa de dibujo que quiero probar?",
        ["software"],
        ["lienzo lunar"],
      ),
    ],
  ),
];
