import { ask, scenario, unit, unknown } from "./case.ts";

export const groupingAttribution = [
  scenario(
    "g19",
    "attribution",
    "El cartel del teatro decía: «Apaga la luz, cierra la puerta y escucha el silencio». Quiero dibujar la fachada de ese teatro.",
    [
      unit(
        "sign",
        [
          "cartel",
          "teatro",
          "apaga",
          "luz",
          "cierra",
          "puerta",
          "escucha",
          "silencio",
        ],
        "quotation",
        unknown,
        { attribution: "cartel|teatro" },
      ),
      unit("facade", ["dibujar", "fachada", "teatro"]),
    ],
    [
      ask(
        "¿Qué decía el cartel del teatro?",
        ["sign"],
        ["luz", "puerta", "silencio"],
      ),
      ask("¿Qué quiero dibujar del teatro?", ["facade"], ["fachada"]),
    ],
  ),
  scenario(
    "g20",
    "attribution",
    "El poema de la tarjeta dice: «La tarde cose sombras\ny la noche las deshace». He colocado la tarjeta en un marco de nogal.",
    [
      unit(
        "poem",
        ["poema", "tarjeta", "tarde", "cose", "sombras", "noche", "deshace"],
        "quotation",
        unknown,
        { attribution: "poema|tarjeta" },
      ),
      unit("frame", ["tarjeta", "marco", "nogal"], "fact"),
    ],
    [
      ask(
        "¿Qué versos aparecen en la tarjeta?",
        ["poem"],
        ["tarde", "sombras", "noche"],
      ),
      ask("¿Dónde he colocado la tarjeta?", ["frame"], ["marco", "nogal"]),
    ],
  ),
  scenario(
    "g21",
    "attribution",
    "Berta me dijo que quiere reparar su acordeón y que quiere matricularse en astronomía.",
    [
      unit(
        "accordion",
        ["berta", "reparar", "acordeon"],
        "quotation",
        unknown,
        { attribution: "berta" },
      ),
      unit(
        "astronomy",
        ["berta", "matricular", "astronomia"],
        "quotation",
        unknown,
        { attribution: "berta" },
      ),
    ],
    [
      ask(
        "¿Qué instrumento quiere reparar Berta según me dijo?",
        ["accordion"],
        ["acordeon"],
      ),
      ask(
        "¿En qué quiere matricularse Berta según me contó?",
        ["astronomy"],
        ["astronomia"],
      ),
    ],
  ),
  scenario(
    "g22",
    "attribution",
    "A Mauro le gusta el helado de sésamo. Elisa me dijo que no le gusta ese helado.",
    [
      unit("mauro", ["mauro", "helado", "sesamo"], "opinion"),
      unit("elisa", ["elisa", "helado", "sesamo"], "quotation", unknown, {
        attribution: "elisa",
        polarity: "negative",
      }),
    ],
    [
      ask("¿Le gusta a Mauro el helado de sésamo?", ["mauro"], ["gusta"]),
      ask(
        "¿Qué me dijo Elisa del helado de sésamo?",
        ["elisa"],
        ["no", "gusta"],
      ),
    ],
  ),
  scenario(
    "g23",
    "attribution",
    "En la cubierta pone «No alimentes al dragón». En la contracubierta pone «Abre la ventana».",
    [
      unit("front", ["cubierta", "alimentes", "dragon"], "quotation", unknown, {
        attribution: "cubierta",
        polarity: "negative",
      }),
      unit(
        "back",
        ["contracubierta", "abre", "ventana"],
        "quotation",
        unknown,
        { attribution: "contracubierta" },
      ),
    ],
    [
      ask(
        "¿Qué frase aparece en la cubierta?",
        ["front"],
        ["no", "alimentes", "dragon"],
      ),
      ask(
        "¿Qué frase aparece en la contracubierta?",
        ["back"],
        ["abre", "ventana"],
      ),
    ],
  ),
  scenario(
    "g24",
    "attribution",
    "Mi vecina quiere aprender esgrima. En su cuaderno escribió: «Quiero perder el miedo y ganar paciencia».",
    [
      unit("fencing", ["vecina", "aprender", "esgrima"]),
      unit(
        "notebook",
        ["cuaderno", "miedo", "paciencia"],
        "quotation",
        unknown,
        { attribution: "vecina|cuaderno" },
      ),
    ],
    [
      ask(
        "¿Qué disciplina quiere aprender mi vecina?",
        ["fencing"],
        ["esgrima"],
      ),
      ask(
        "¿Qué escribió mi vecina en su cuaderno?",
        ["notebook"],
        ["miedo", "paciencia"],
      ),
    ],
  ),
];
