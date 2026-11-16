import { ask, day, scenario, unit } from "./case.ts";
export const holdoutD = [
  scenario(
    "v37",
    "similar",
    "El 4 de julio de 2026 fui al teatro Iris. El 11 de julio de 2026 volví al teatro Iris.",
    [
      unit("first", ["teatro", "iris"], "fact", day("2026-07-04")),
      unit("second", ["teatro", "iris"], "fact", day("2026-07-11")),
    ],
    [
      ask("¿Fui al teatro Iris el 4 de julio?", ["first"], ["si|fuiste"]),
      ask("¿Fui al teatro Iris el 11 de julio?", ["second"], ["si|fuiste"]),
    ],
  ),
  scenario(
    "v38",
    "similar",
    "Mi vecino Óscar quiere aprender saxofón. Mi compañero de clase Óscar quiere aprender violín.",
    [
      unit("neighbor", ["vecino", "oscar", "saxofon"]),
      unit("classmate", ["companero", "oscar", "violin"]),
    ],
    [
      ask(
        "¿Qué instrumento quiere aprender mi vecino Óscar?",
        ["neighbor"],
        ["saxofon"],
      ),
      ask(
        "¿Qué instrumento quiere aprender mi compañero de clase Óscar?",
        ["classmate"],
        ["violin"],
      ),
    ],
  ),
  scenario(
    "v39",
    "similar",
    "Quiero fabricar una pajarera de madera. Ya he fabricado un comedero para pájaros.",
    [
      unit("birdhouse", ["pajarera", "madera"]),
      unit("feeder", ["comedero", "pajaros"], "fact"),
    ],
    [
      ask("¿Qué quiero fabricar de madera?", ["birdhouse"], ["pajarera"]),
      ask("¿Qué he fabricado ya para los pájaros?", ["feeder"], ["comedero"]),
    ],
  ),
  scenario(
    "v40",
    "similar",
    "El impermeable azul está en la percha del vestíbulo. El impermeable gris está en la mochila.",
    [
      unit("blue", ["impermeable", "azul", "percha", "vestibulo"], "fact"),
      unit("grey", ["impermeable", "gris", "mochila"], "fact"),
    ],
    [
      ask(
        "¿Dónde está el impermeable azul?",
        ["blue"],
        ["percha", "vestibulo"],
      ),
      ask("¿Dónde está el impermeable gris?", ["grey"], ["mochila"]),
    ],
  ),
  scenario(
    "v41",
    "similar",
    "Me gusta la infusión de hinojo. A Sara no le gusta la infusión de hinojo.",
    [
      unit("self", ["me gusta", "hinojo"], "opinion"),
      unit("sara", ["sara", "hinojo"], "opinion", undefined, {
        polarity: "negative",
      }),
    ],
    [
      ask("¿Me gusta la infusión de hinojo?", ["self"], ["si|gusta"]),
      ask("¿Le gusta a Sara la infusión de hinojo?", ["sara"], ["no"]),
    ],
  ),
  scenario(
    "v42",
    "similar",
    "Quiero visitar la isla de La Palma. Ya visité Palma de Mallorca.",
    [
      unit("island", ["isla", "palma"]),
      unit("city", ["palma", "mallorca"], "fact"),
    ],
    [
      ask("¿Qué isla quiero visitar?", ["island"], ["palma"]),
      ask("¿Ya he visitado Palma de Mallorca?", ["city"], ["si|visitaste"]),
    ],
  ),
  scenario(
    "v43",
    "correction",
    "Compré 27 cuentas de cristal azul en la mercería del puerto. Quiero comprar hilo de lino.",
    [
      unit(
        "beads",
        ["27", "cuentas", "cristal", "azul", "merceria", "puerto"],
        "fact",
      ),
      unit("thread", ["hilo", "lino"]),
    ],
    [
      ask("¿Cuántas cuentas compré?", ["beads"], ["27"]),
      ask("¿Qué hilo quiero comprar?", ["thread"], ["lino"]),
    ],
    {
      correction: {
        label: "beads",
        text: "Me equivoqué en la cantidad de cuentas: fueron 31, no 27.",
        expected: unit(
          "beads",
          ["31", "cuentas", "cristal", "azul", "merceria", "puerto"],
          "fact",
          undefined,
          { forbidden: ["27"] },
        ),
        query: ask(
          "¿Cuántas cuentas compré y dónde?",
          ["beads"],
          ["31", "merceria", "puerto"],
          { forbidden: ["27"] },
        ),
      },
    },
  ),
  scenario(
    "v44",
    "correction",
    "Quedé con Leonor para diseñar el cartel en la biblioteca. Quiero reservar una sala de ensayo.",
    [
      unit("meeting", ["leonor", "cartel", "biblioteca"], "fact"),
      unit("room", ["sala", "ensayo"]),
    ],
    [
      ask("¿Con quién quedé para diseñar el cartel?", ["meeting"], ["leonor"]),
      ask("¿Qué sala quiero reservar?", ["room"], ["ensayo"]),
    ],
    {
      correction: {
        label: "meeting",
        text: "El nombre estaba mal: quedé con Inés, no con Leonor.",
        expected: unit(
          "meeting",
          ["ines", "cartel", "biblioteca"],
          "fact",
          undefined,
          { forbidden: ["leonor"] },
        ),
        query: ask(
          "¿Con quién quedé y dónde para diseñar el cartel?",
          ["meeting"],
          ["ines", "biblioteca"],
          { forbidden: ["leonor"] },
        ),
      },
    },
  ),
  scenario(
    "v45",
    "correction",
    "El 24 de julio de 2026 tengo el examen de dibujo técnico. Quiero comprar un compás.",
    [
      unit(
        "exam",
        ["examen", "dibujo", "tecnico"],
        "intention",
        day("2026-07-24"),
      ),
      unit("compass", ["compas"]),
    ],
    [
      ask("¿Cuándo tengo el examen de dibujo técnico?", ["exam"], ["24"]),
      ask("¿Qué instrumento quiero comprar?", ["compass"], ["compas"]),
    ],
    {
      correction: {
        label: "exam",
        text: "La fecha del examen estaba equivocada: es el 29 de julio de 2026, no el 24.",
        expected: unit(
          "exam",
          ["examen", "dibujo", "tecnico"],
          "intention",
          day("2026-07-29"),
          { forbidden: ["24"] },
        ),
        query: ask(
          "¿Qué día tengo el examen de dibujo técnico?",
          ["exam"],
          ["29"],
          { forbidden: ["24"] },
        ),
      },
    },
  ),
  scenario(
    "v46",
    "correction",
    "Guardé una carpeta beige en el armario del balcón. Quiero ordenar mis postales.",
    [
      unit("folder", ["carpeta", "beige", "armario", "balcon"], "fact"),
      unit("cards", ["ordenar", "postales"]),
    ],
    [
      ask(
        "¿De qué color es la carpeta guardada en el balcón?",
        ["folder"],
        ["beige"],
      ),
      ask("¿Qué quiero ordenar?", ["cards"], ["postales"]),
    ],
    {
      correction: {
        label: "folder",
        text: "El color estaba mal: la carpeta es burdeos, no beige.",
        expected: unit(
          "folder",
          ["carpeta", "burdeos", "armario", "balcon"],
          "fact",
          undefined,
          { forbidden: ["beige"] },
        ),
        query: ask(
          "¿De qué color es la carpeta y dónde está?",
          ["folder"],
          ["burdeos", "armario", "balcon"],
          { forbidden: ["beige"] },
        ),
      },
    },
  ),
  scenario(
    "v47",
    "correction",
    "Antes prefería la salsa de tomate; ahora prefiero la salsa de almendras.",
    [
      unit("before", ["antes", "tomate"], "opinion"),
      unit("now", ["ahora", "almendras"], "opinion"),
    ],
    [
      ask("¿Qué salsa prefería antes?", ["before"], ["tomate"]),
      ask("¿Qué salsa prefiero ahora?", ["now"], ["almendras"]),
    ],
  ),
  scenario(
    "v48",
    "correction",
    "La monitora dijo que hay 38 plazas en el taller de vidrieras del Ateneo. Yo quiero hacer un curso de costura.",
    [
      unit(
        "places",
        ["monitora", "38", "vidrieras", "ateneo"],
        "quotation",
        undefined,
        { attribution: "monitora" },
      ),
      unit("sewing", ["costura"]),
    ],
    [
      ask("¿Cuántas plazas dijo la monitora que había?", ["places"], ["38"]),
      ask("¿Qué curso quiero hacer yo?", ["sewing"], ["costura"]),
    ],
    {
      correction: {
        label: "places",
        text: "La cantidad que apunté estaba mal: la monitora dijo 43, no 38.",
        expected: unit(
          "places",
          ["monitora", "43", "vidrieras", "ateneo"],
          "quotation",
          undefined,
          { attribution: "monitora", forbidden: ["38"] },
        ),
        query: ask(
          "¿Cuántas plazas dijo la monitora que había en vidrieras y dónde es el taller?",
          ["places"],
          ["43", "ateneo"],
          { forbidden: ["38"] },
        ),
      },
    },
  ),
];
