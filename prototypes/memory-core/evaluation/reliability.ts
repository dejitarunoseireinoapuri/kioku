import { ask, day, scenario, unit } from "./case.ts";

// Expectations fixed before provider execution. Focused validation, not a new R2 reserve.
export const reliability = [
  scenario(
    "w01",
    "shared",
    "Puse ocho botones en el bote y dejé otros cinco botones en la bandeja.",
    [
      unit("jar", ["\\b(?:ocho|8)\\b", "botones", "bote"], "fact"),
      unit("tray", ["\\b(?:cinco|5)\\b", "botones", "bandeja"], "fact"),
    ],
    [
      ask("¿Cuántos botones puse en el bote?", ["jar"], ["\\b(?:ocho|8)\\b"]),
      ask(
        "¿Cuántos botones hay en la bandeja?",
        ["tray"],
        ["\\b(?:cinco|5)\\b"],
      ),
    ],
  ),
  scenario(
    "w02",
    "shared",
    "Para el mercadillo preparé 17 tarjetas violetas y 6 naranjas.",
    [
      unit(
        "violet",
        ["mercadillo", "17", "tarjetas", "violeta"],
        "fact",
        undefined,
        { evidenceTerms: ["prepare"] },
      ),
      unit(
        "orange",
        ["mercadillo", "6", "tarjetas", "naranja"],
        "fact",
        undefined,
        { evidenceTerms: ["prepare"] },
      ),
    ],
    [
      ask("¿Cuántas tarjetas violetas preparé?", ["violet"], ["17"]),
      ask(
        "¿Cuántas tarjetas naranjas preparé y para qué?",
        ["orange"],
        ["6", "mercadillo"],
      ),
    ],
  ),
  scenario(
    "w03",
    "similar",
    "Dejé cuatro velas en el cajón. Puse otras siete velas en la repisa.",
    [
      unit("drawer", ["\\b(?:cuatro|4)\\b", "velas", "cajon"], "fact"),
      unit("shelf", ["\\b(?:siete|7)\\b", "velas", "repisa"], "fact"),
    ],
    [
      ask(
        "¿Cuántas velas hay en el cajón?",
        ["drawer"],
        ["\\b(?:cuatro|4)\\b"],
      ),
      ask("¿Cuántas velas hay en la repisa?", ["shelf"], ["\\b(?:siete|7)\\b"]),
    ],
  ),
  scenario(
    "w04",
    "independent",
    "Guardé el broche turquesa en el joyero. Quiero guardar el reloj en la caja fuerte.",
    [
      unit("brooch", ["broche", "turquesa", "joyero"], "fact"),
      unit("watch", ["reloj", "caja fuerte"]),
    ],
    [
      ask("¿Dónde está mi broche turquesa?", ["brooch"], ["joyero"]),
      ask("¿Ya guardé el reloj en la caja fuerte?", [], [], {
        status: "not_found",
      }),
    ],
    {
      forget: ["watch"],
      after: [
        ask("¿Dónde está mi broche turquesa?", ["brooch"], ["joyero"]),
        ask("¿Dónde está mi pulsera coral?", [], [], { status: "not_found" }),
      ],
    },
  ),
  scenario(
    "w05",
    "independent",
    "Conté 26 chinchetas en el escritorio. Encontré una lupa en el estuche.",
    [
      unit("pins", ["26", "chinchetas", "escritorio"], "fact"),
      unit("glass", ["lupa", "estuche"], "fact"),
    ],
    [
      ask("¿Cuántas chinchetas conté?", ["pins"], ["26"]),
      ask(
        "¿Cuántas chinchetas quedan exactamente después de las que he usado?",
        [],
        [],
        { status: "not_found" },
      ),
    ],
    {
      forget: ["glass"],
      after: [
        ask("¿Cuántas chinchetas conté?", ["pins"], ["26"]),
        ask(
          "¿Cuántas chinchetas quedan exactamente después de las que he usado?",
          [],
          [],
          { status: "not_found" },
        ),
      ],
    },
  ),
  scenario(
    "w06",
    "time",
    "En diciembre de 2026 quiero visitar el museo del vidrio. Dejé el bono de transporte en la chaqueta.",
    [
      unit("museum", ["museo", "vidrio"], "intention", {
        precision: "month",
        value: "2026-12",
        end: null,
      }),
      unit("pass", ["bono", "transporte", "chaqueta"], "fact"),
    ],
    [
      ask("¿Qué día exacto visitaré el museo del vidrio?", [], [], {
        status: "not_found",
      }),
      ask("¿Dónde está el bono de transporte?", ["pass"], ["chaqueta"]),
    ],
  ),
  scenario(
    "w07",
    "similar",
    "Mi prima Vega quiere aprender clarinete. Mi profesora Vega quiere aprender arpa.",
    [
      unit("cousin", ["prima", "vega", "clarinete"]),
      unit("teacher", ["profesora", "vega", "arpa"]),
    ],
    [
      ask(
        "¿Qué instrumento quiere aprender mi prima Vega?",
        ["cousin"],
        ["clarinete"],
      ),
      ask(
        "¿Qué instrumento quiere aprender mi profesora Vega?",
        ["teacher"],
        ["arpa"],
      ),
    ],
  ),
  scenario(
    "w08",
    "time",
    "El 8 de octubre de 2026 tengo una clase de grabado. El 23 de octubre de 2026 quiero visitar una cantera.",
    [
      unit("class", ["clase", "grabado"], "intention", day("2026-10-08")),
      unit("quarry", ["visitar", "cantera"], "intention", day("2026-10-23")),
    ],
    [
      ask("¿Qué día tengo la clase de grabado?", ["class"], ["8"]),
      ask("¿Qué día quiero visitar la cantera?", ["quarry"], ["23"]),
    ],
  ),
  scenario(
    "w09",
    "correction",
    "Antes prefería el zumo de piña; ahora prefiero el zumo de granada.",
    [
      unit("before", ["antes", "pina"], "opinion"),
      unit("now", ["ahora", "granada"], "opinion"),
    ],
    [
      ask("¿Qué zumo prefería antes?", ["before"], ["pina"]),
      ask("¿Qué zumo prefiero ahora?", ["now"], ["granada"]),
    ],
  ),
  scenario(
    "w10",
    "correction",
    "Quedé con Ciro para preparar la maqueta en el centro cívico. Quiero alquilar un proyector.",
    [
      unit("agreement", ["ciro", "maqueta", "centro civico"], "fact"),
      unit("projector", ["alquilar", "proyector"]),
    ],
    [
      ask(
        "¿Con quién quedé para preparar la maqueta?",
        ["agreement"],
        ["ciro"],
      ),
      ask("¿Ya terminamos de preparar la maqueta?", [], [], {
        status: "not_found",
      }),
    ],
    {
      correction: {
        label: "agreement",
        text: "Apunté mal el nombre: quedé con Berta, no con Ciro.",
        expected: unit(
          "agreement",
          ["berta", "maqueta", "centro civico"],
          "fact",
          undefined,
          { forbidden: ["ciro"] },
        ),
        query: ask(
          "¿Con quién quedé y dónde para preparar la maqueta?",
          ["agreement"],
          ["berta", "centro civico"],
          { forbidden: ["ciro"] },
        ),
      },
    },
  ),
  scenario(
    "w11",
    "ambiguity",
    "Quiero flunar con Teo.",
    [
      unit(
        "dance",
        ["bailar", "salsa", "teo"],
        "intention",
        day("2026-07-20"),
        { forbidden: ["flunar"] },
      ),
    ],
    [
      ask("¿Qué quiero hacer con Teo?", ["dance"], ["bailar", "salsa"]),
      ask("¿Qué día quiero bailar salsa con Teo?", ["dance"], ["20"]),
    ],
    {
      status: "clarify",
      clarification: "Con flunar quería decir bailar salsa mañana con Teo.",
      clarificationAt: "2026-07-19T10:00:00Z",
    },
  ),
  scenario(
    "w12",
    "correction",
    "Compré 36 etiquetas plateadas en la papelería de la plaza. Quiero comprar una regla flexible.",
    [
      unit(
        "labels",
        ["36", "etiquetas", "platead", "papeleria", "plaza"],
        "fact",
      ),
      unit("ruler", ["regla", "flexible"]),
    ],
    [
      ask("¿Cuántas etiquetas compré?", ["labels"], ["36"]),
      ask("¿Qué regla quiero comprar?", ["ruler"], ["flexible"]),
    ],
    {
      correction: {
        label: "labels",
        text: "Me equivoqué en la cantidad: compré 41 etiquetas, no 36.",
        expected: unit(
          "labels",
          ["41", "etiquetas", "platead", "papeleria", "plaza"],
          "fact",
          undefined,
          { forbidden: ["36"] },
        ),
        query: ask(
          "¿Cuántas etiquetas compré, de qué color y dónde?",
          ["labels"],
          ["41", "platead", "papeleria", "plaza"],
          { forbidden: ["36"] },
        ),
      },
    },
  ),
];
