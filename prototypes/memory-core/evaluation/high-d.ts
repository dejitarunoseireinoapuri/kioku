import { ask as q, scenario as s, unit as u, day, unknown } from "./case.ts";

export const highD = [
  s(
    "i37",
    "similar",
    "Mi profesor Darío quiere aprender cerámica. Mi vecino Darío quiere aprender apicultura.",
    [
      u("teacher", ["profesor", "dario", "ceramica"]),
      u("neighbor", ["vecino", "dario", "apicultura"]),
    ],
    [
      q("¿Qué quiere aprender mi profesor Darío?", ["teacher"], ["ceramica"]),
      q("¿Qué quiere aprender mi vecino Darío?", ["neighbor"], ["apicultura"]),
    ],
  ),
  s(
    "i38",
    "similar",
    "No quiero apuntarme al taller de escultura. Mi hermana sí quiere apuntarse a ese taller.",
    [
      u("self", ["taller", "escultura"], "intention", unknown, {
        polarity: "negative",
        subject: "^(?:yo|owner|propietari[oa]|usuari[oa])$",
      }),
      u("sister", ["hermana", "taller", "escultura"], "intention", unknown, {
        subject: "hermana",
      }),
    ],
    [
      q("¿Quiero apuntarme yo a escultura?", ["self"], ["no"]),
      q("¿Quiere mi hermana apuntarse a escultura?", ["sister"], ["quiere"]),
    ],
  ),
  s(
    "i39",
    "similar",
    "Reservé una mesa en La Alondra para el 3 de agosto de 2026. Quiero reservar en La Alondra para el 10 de agosto de 2026.",
    [
      u("booked", ["reserv", "alondra"], "fact", day("2026-08-03")),
      u("plan", ["reservar", "alondra"], "intention", day("2026-08-10")),
    ],
    [
      q(
        "¿Para qué día hice ya la reserva en La Alondra?",
        ["booked"],
        ["3", "agosto"],
      ),
      q("¿Para qué día quiero hacer otra reserva?", ["plan"], ["10", "agosto"]),
    ],
  ),
  s(
    "i40",
    "similar",
    "Ayer visité el acuario de Gijón. Quiero volver al acuario de Gijón el 8 de diciembre de 2026.",
    [
      u("visited", ["visit", "acuario", "gijon"], "fact", day("2026-07-13")),
      u(
        "return",
        ["volver", "acuario", "gijon"],
        "intention",
        day("2026-12-08"),
      ),
    ],
    [
      q("¿Qué acuario visité ayer?", ["visited"], ["gijon"]),
      q("¿Cuándo quiero volver al acuario?", ["return"], ["8", "diciembre"]),
    ],
  ),
  s(
    "i41",
    "similar",
    "El olor del incienso de cedro me gusta. Su humo me molesta.",
    [
      u("odor", ["olor", "incienso", "cedro"], "opinion"),
      u("smoke", ["humo", "incienso", "cedro"], "opinion", unknown, {
        polarity: "negative",
      }),
    ],
    [
      q("¿Qué pienso del olor del incienso de cedro?", ["odor"], ["gusta"]),
      q("¿Qué me molesta de ese incienso?", ["smoke"], ["humo"]),
    ],
  ),
  s(
    "i42",
    "similar",
    "Antes prefería trabajar con arcilla roja; ahora prefiero la blanca.",
    [
      u("red", ["prefer", "arcilla", "roja"], "opinion"),
      u("white", ["prefier|prefer", "arcilla", "blanca"], "opinion"),
    ],
    [
      q("¿Qué arcilla prefería antes?", ["red"], ["roja"]),
      q("¿Qué arcilla prefiero ahora?", ["white"], ["blanca"]),
    ],
    { expectedRelations: [{ kind: "evolvesFrom", from: "white", to: "red" }] },
  ),
  s(
    "i43",
    "correction",
    "He guardado 18 tuercas en la caja celeste. El alicate está en el cinturón de herramientas.",
    [
      u("nuts", ["18", "tuercas", "caja", "celeste"], "fact"),
      u("pliers", ["alicate", "cinturon", "herramientas"], "fact"),
    ],
    [
      q("¿Cuántas tuercas guardé en la caja celeste?", ["nuts"], ["18"]),
      q("¿Dónde está el alicate?", ["pliers"], ["cinturon"]),
    ],
    {
      correction: {
        label: "nuts",
        text: "Eran 23 tuercas, no 18.",
        expected: u(
          "nuts",
          ["23", "tuercas", "caja", "celeste"],
          "fact",
          unknown,
          { forbidden: ["18"], evidenceTerms: ["guardado"] },
        ),
        query: q(
          "¿Cuántas tuercas guardé y dónde?",
          ["nuts"],
          ["23", "caja", "celeste"],
          { forbidden: ["18"] },
        ),
      },
    },
  ),
  s(
    "i44",
    "correction",
    "El 7 de febrero de 2027 tengo ensayo con Leonor. Quiero comprar resina para el arco.",
    [
      u("rehearsal", ["ensayo", "leonor"], "intention", day("2027-02-07")),
      u("resin", ["comprar", "resina", "arco"]),
    ],
    [
      q("¿Con quién tengo ensayo?", ["rehearsal"], ["leonor"]),
      q("¿Qué quiero comprar para el arco?", ["resin"], ["resina"]),
    ],
    {
      correction: {
        label: "rehearsal",
        text: "El ensayo es con Inés, no con Leonor.",
        expected: u(
          "rehearsal",
          ["ensayo", "ines"],
          "intention",
          day("2027-02-07"),
          { forbidden: ["leonor"] },
        ),
        query: q(
          "¿Cuándo y con quién tengo ensayo?",
          ["rehearsal"],
          ["7", "febrero", "ines"],
          { forbidden: ["leonor"] },
        ),
      },
    },
  ),
  s(
    "i45",
    "correction",
    "Mañana quiero llevar una cesta al vivero. Quiero comprar un rastrillo pequeño.",
    [
      u(
        "basket",
        ["llevar", "cesta", "vivero"],
        "intention",
        day("2026-07-15"),
      ),
      u("rake", ["comprar", "rastrillo", "pequeno"]),
    ],
    [
      q("¿Cuándo quiero llevar la cesta al vivero?", ["basket"], ["15"]),
      q("¿Qué rastrillo quiero comprar?", ["rake"], ["pequeno"]),
    ],
    {
      correction: {
        label: "basket",
        text: "La cesta la llevaré el 19 de julio de 2026.",
        expected: u(
          "basket",
          ["llevar", "cesta", "vivero"],
          "intention",
          day("2026-07-19"),
          { forbidden: ["manana"] },
        ),
        query: q(
          "¿Qué día llevaré la cesta al vivero?",
          ["basket"],
          ["19", "julio"],
          { forbidden: ["15"] },
        ),
      },
    },
  ),
  s(
    "i46",
    "correction",
    "El taller de esmaltado cuesta 42 euros. Mi carpeta está en el armario gris.",
    [
      u("fee", ["taller", "esmaltado", "42", "euros"], "fact"),
      u("folder", ["carpeta", "armario", "gris"], "fact"),
    ],
    [
      q("¿Cuánto cuesta el taller de esmaltado?", ["fee"], ["42"]),
      q("¿Dónde está mi carpeta?", ["folder"], ["armario", "gris"]),
    ],
    {
      repeat: {
        text: "El precio del taller de esmaltado sigue siendo 42 euros.",
        count: 2,
      },
      correction: {
        label: "fee",
        text: "El precio correcto es 47 euros, no 42.",
        expected: u(
          "fee",
          ["taller", "esmaltado", "47", "euros"],
          "fact",
          unknown,
          { forbidden: ["42"] },
        ),
        query: q("¿Cuál es el precio del taller?", ["fee"], ["47"], {
          forbidden: ["42"],
        }),
      },
    },
  ),
  s(
    "i47",
    "correction",
    "Rosalía me dijo que quedan 16 asientos para la proyección. Quiero coser una funda de gafas.",
    [
      u(
        "seats",
        ["rosalia", "16", "asientos", "proyeccion"],
        "quotation",
        unknown,
        { attribution: "rosalia" },
      ),
      u("case", ["coser", "funda", "gafas"]),
    ],
    [
      q("¿Cuántos asientos quedan según Rosalía?", ["seats"], ["16"]),
      q("¿Qué funda quiero coser?", ["case"], ["gafas"]),
    ],
    {
      correction: {
        label: "seats",
        text: "Rosalía había dicho 11 asientos, no 16.",
        expected: u(
          "seats",
          ["rosalia", "11", "asientos", "proyeccion"],
          "quotation",
          unknown,
          { attribution: "rosalia", forbidden: ["16"] },
        ),
        query: q(
          "¿Cuántos asientos quedan según lo que dijo Rosalía?",
          ["seats"],
          ["11"],
          { forbidden: ["16"] },
        ),
      },
    },
  ),
  s(
    "i48",
    "correction",
    "Quiero pulir una bandeja de latón. El cepillo está detrás del torno.",
    [
      u("tray", ["pulir", "bandeja", "laton"]),
      u("brush", ["cepillo", "torno"], "fact"),
    ],
    [
      q(
        "¿De qué material es la bandeja que quiero pulir?",
        ["tray"],
        ["laton"],
      ),
      q("¿Dónde está el cepillo?", ["brush"], ["torno"]),
    ],
    {
      correction: {
        label: "tray",
        text: "La bandeja es de plata, no de latón.",
        expected: u(
          "tray",
          ["pulir", "bandeja", "plata"],
          "intention",
          unknown,
          { forbidden: ["laton"] },
        ),
        query: q(
          "¿Qué quiero hacer con la bandeja de plata?",
          ["tray"],
          ["pulir"],
          { forbidden: ["laton"] },
        ),
      },
    },
  ),
];
