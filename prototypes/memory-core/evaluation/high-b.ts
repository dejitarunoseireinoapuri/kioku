import { ask as q, scenario as s, unit as u } from "./case.ts";

export const highB = [
  s(
    "i13",
    "condition",
    "Si encuentro lino sin teñir, coseré una funda para el atlas. Quiero limpiar el telescopio.",
    [
      u(
        "cover",
        ["coser", "funda", "atlas", "lino", "tenir"],
        "intention",
        undefined,
        { condition: "encuentr.*lino" },
      ),
      u("scope", ["limpiar", "telescopio"]),
    ],
    [
      q("¿Qué condición puse para coser la funda?", ["cover"], ["lino"]),
      q("¿Qué quiero limpiar?", ["scope"], ["telescopio"]),
    ],
  ),
  s(
    "i14",
    "condition",
    "Cuando Lucero devuelva la escalera pintaré el altillo. Tengo pendiente afinar el violonchelo.",
    [
      u(
        "loft",
        ["lucero", "escalera", "pintar", "altillo"],
        "intention",
        undefined,
        { condition: "lucero.*devuel|devuel.*lucero" },
      ),
      u("cello", ["afinar", "violonchelo"]),
    ],
    [
      q("¿Cuándo pintaré el altillo?", ["loft"], ["lucero", "escalera"]),
      q("¿Qué instrumento tengo pendiente afinar?", ["cello"], ["violonchelo"]),
    ],
  ),
  s(
    "i15",
    "condition",
    "Si no hay niebla, subiré al mirador de las Encinas. No quiero vender mi acordeón.",
    [
      u("lookout", ["niebla", "mirador", "encinas"], "intention", undefined, {
        condition: "no.*niebla",
      }),
      u("accordion", ["vender", "acordeon"], "intention", undefined, {
        polarity: "negative",
      }),
    ],
    [
      q("¿Con qué condición subiré al mirador?", ["lookout"], ["no", "niebla"]),
      q("¿Quiero vender mi acordeón?", ["accordion"], ["no"]),
    ],
  ),
  s(
    "i16",
    "condition",
    "No quiero hornear pan si la báscula sigue rota. Me apetece dibujar una medusa.",
    [
      u(
        "bread",
        ["hornear", "pan", "bascula", "rota"],
        "intention",
        undefined,
        { polarity: "negative", condition: "bascula.*rota" },
      ),
      u("jelly", ["dibujar", "medusa"]),
    ],
    [
      q(
        "¿En qué situación no quiero hornear pan?",
        ["bread"],
        ["bascula", "rota"],
      ),
      q("¿Qué animal me apetece dibujar?", ["jelly"], ["medusa"]),
    ],
  ),
  s(
    "i17",
    "condition",
    "Si abre el embarcadero iré en barca; si permanece cerrado, haré la ruta a pie. Tengo el silbato en la riñonera.",
    [
      u(
        "route",
        ["embarcadero", "barca", "cerrado", "pie"],
        "intention",
        undefined,
        { condition: "embarcadero|abr|cerr" },
      ),
      u("whistle", ["silbato", "rinonera"], "fact"),
    ],
    [
      q("¿Qué haré si el embarcadero sigue cerrado?", ["route"], ["pie"]),
      q("¿Dónde tengo el silbato?", ["whistle"], ["rinonera"]),
    ],
  ),
  s(
    "i18",
    "condition",
    "Solo compraré la mandolina si cabe en el armario. El metrónomo está sobre el piano.",
    [
      u(
        "mandolin",
        ["comprar", "mandolina", "armario"],
        "intention",
        undefined,
        { condition: "cab.*armario" },
      ),
      u("metronome", ["metronomo", "piano"], "fact"),
    ],
    [
      q(
        "¿Qué condición puse para comprar la mandolina?",
        ["mandolin"],
        ["armario"],
      ),
      q("¿Dónde está el metrónomo?", ["metronome"], ["piano"]),
    ],
  ),
  s(
    "i19",
    "attribution",
    "El jardinero Teodoro me aconsejó plantar borrajas. Yo quiero sembrar caléndulas.",
    [
      u("borage", ["teodoro", "plantar", "borrajas"], "quotation", undefined, {
        attribution: "teodoro|jardinero",
      }),
      u("marigold", ["sembrar", "calendulas"]),
    ],
    [
      q("¿Qué me aconsejó plantar Teodoro?", ["borage"], ["borrajas"]),
      q("¿Qué quiero sembrar yo?", ["marigold"], ["calendulas"]),
    ],
  ),
  s(
    "i20",
    "attribution",
    "En la etiqueta del estuche pone «No mojes la seda». La caja de tizas está bajo el caballete.",
    [
      u("label", ["etiqueta", "no", "mojes", "seda"], "quotation", undefined, {
        polarity: "negative",
        attribution: "etiqueta|estuche",
      }),
      u("chalk", ["caja", "tizas", "caballete"], "fact"),
    ],
    [
      q("¿Qué advierte la etiqueta del estuche?", ["label"], ["no", "seda"]),
      q("¿Dónde está la caja de tizas?", ["chalk"], ["caballete"]),
    ],
  ),
  s(
    "i21",
    "attribution",
    "Mi vecina Ofelia quiere aprender esperanto. A mí me interesa aprender a tallar sellos.",
    [
      u(
        "language",
        ["ofelia", "aprender", "esperanto"],
        "intention",
        undefined,
        { subject: "ofelia" },
      ),
      u("stamp", ["aprender", "tallar", "sellos"]),
    ],
    [
      q("¿Qué idioma quiere aprender Ofelia?", ["language"], ["esperanto"]),
      q("¿Qué me interesa aprender a tallar?", ["stamp"], ["sellos"]),
    ],
  ),
  s(
    "i22",
    "attribution",
    "El cartel del invernadero dice «Comparte semillas, conserva raíces». Quiero comprar una regadera de zinc.",
    [
      u(
        "sign",
        ["cartel", "comparte", "semillas", "conserva", "raices"],
        "quotation",
        undefined,
        { attribution: "cartel|invernadero" },
      ),
      u("can", ["comprar", "regadera", "zinc"]),
    ],
    [
      q(
        "¿Qué dice el cartel del invernadero?",
        ["sign"],
        ["semillas", "raices"],
      ),
      q("¿De qué material quiero la regadera?", ["can"], ["zinc"]),
    ],
  ),
  s(
    "i23",
    "attribution",
    "Estela escribió en mi cuaderno: «Quiero escuchar el mar y olvidar el reloj». Yo dejé el compás en el cajón inferior.",
    [
      u(
        "quote",
        ["estela", "escuchar", "mar", "olvidar", "reloj"],
        "quotation",
        undefined,
        { attribution: "estela" },
      ),
      u("compass", ["compas", "cajon", "inferior"], "fact"),
    ],
    [
      q("¿Qué escribió Estela?", ["quote"], ["mar", "reloj"], {
        quotations: [
          {
            label: "quote",
            literal: "Quiero escuchar el mar y olvidar el reloj",
            introduction: "estela (?:escribio|anoto)(?: en tu cuaderno)?",
            attribution: "estela",
          },
        ],
      }),
      q("¿Dónde dejé el compás?", ["compass"], ["cajon", "inferior"]),
    ],
  ),
  s(
    "i24",
    "attribution",
    "Según Aurelio, su canario se llama Bronce. Mi canario se llama Nimbo.",
    [
      u("aurelio", ["aurelio", "canario", "bronce"], "quotation", undefined, {
        attribution: "aurelio",
      }),
      u("self", ["canario", "nimbo"], "fact"),
    ],
    [
      q(
        "¿Cómo se llama el canario de Aurelio según él?",
        ["aurelio"],
        ["bronce"],
      ),
      q("¿Cómo se llama mi canario?", ["self"], ["nimbo"]),
    ],
  ),
];
