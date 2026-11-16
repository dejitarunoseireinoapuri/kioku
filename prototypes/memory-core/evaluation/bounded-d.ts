import { ask as q, scenario as s, unit as u, day, unknown } from "./case.ts";

export const boundedD = [
  s(
    "j37",
    "similar",
    "Mi prima Sol colecciona monedas. Mi vecina Sol colecciona peonzas.",
    [
      u("cousin", ["prima", "sol", "monedas"], "fact"),
      u("neighbor", ["vecina", "sol", "peonzas"], "fact"),
    ],
    [
      q("¿Qué colecciona mi prima Sol?", ["cousin"], ["monedas"]),
      q("¿Qué colecciona mi vecina Sol?", ["neighbor"], ["peonzas"]),
    ],
  ),
  s(
    "j38",
    "similar",
    "Yo no quiero participar en la obra de teatro. Mi hermano sí quiere participar en esa obra.",
    [
      u("self", ["obra", "teatro"], "intention", undefined, {
        polarity: "negative",
        subject: "^(?:yo|owner|propietari[oa]|usuari[oa])$",
      }),
      u("brother", ["hermano", "obra", "teatro"], "intention", undefined, {
        subject: "hermano",
      }),
    ],
    [
      q("¿Quiero participar yo en la obra de teatro?", ["self"], ["no"]),
      q("¿Quiere mi hermano participar en la obra?", ["brother"], ["quiere"]),
    ],
  ),
  s(
    "j39",
    "similar",
    "Compré una entrada para el cine Arce para el 6 de junio de 2027. Quiero comprar otra entrada para el cine Arce para el 13 de junio de 2027.",
    [
      u(
        "bought",
        ["compr", "entrada", "cine", "arce"],
        "fact",
        day("2027-06-06"),
        {
          evidenceTerms: ["6 de junio"],
          forbidden: ["13 de junio|2027-06-13"],
        },
      ),
      u(
        "plan",
        ["compr", "entrada", "cine", "arce"],
        "intention",
        day("2027-06-13"),
        {
          evidenceTerms: ["13 de junio"],
          forbidden: ["(?<!\\d)6 de junio|2027-06-06"],
        },
      ),
    ],
    [
      q(
        "¿Para qué día compré ya una entrada del cine Arce?",
        ["bought"],
        ["6", "junio"],
      ),
      q(
        "¿Para qué día quiero comprar otra entrada?",
        ["plan"],
        ["13", "junio"],
      ),
    ],
  ),
  s(
    "j40",
    "similar",
    "Ayer recorrí el jardín botánico. Quiero volver al jardín botánico el 17 de mayo de 2027.",
    [
      u("walk", ["recorr", "jardin", "botanico"], "fact", day("2026-07-13")),
      u(
        "return",
        ["volver", "jardin", "botanico"],
        "intention",
        day("2027-05-17"),
      ),
    ],
    [
      q("¿Qué jardín recorrí ayer?", ["walk"], ["botanico"]),
      q(
        "¿Cuándo quiero volver al jardín botánico?",
        ["return"],
        ["17", "mayo"],
      ),
    ],
  ),
  s(
    "j41",
    "similar",
    "La textura del papel reciclado me encanta. Su olor me desagrada.",
    [
      u("texture", ["textura", "papel", "reciclado"], "opinion"),
      u("odor", ["olor", "papel", "reciclado"], "opinion", undefined, {
        polarity: "negative",
      }),
    ],
    [
      q(
        "¿Qué pienso de la textura del papel reciclado?",
        ["texture"],
        ["encanta"],
      ),
      q("¿Qué me desagrada de ese papel?", ["odor"], ["olor"]),
    ],
  ),
  s(
    "j42",
    "similar",
    "Antes prefería escribir con tinta sepia; ahora prefiero la verde.",
    [
      u("sepia", ["prefer|prefier", "tinta", "sepia"], "opinion"),
      u("green", ["prefer|prefier", "tinta", "verde"], "opinion"),
    ],
    [
      q("¿Qué tinta prefería antes?", ["sepia"], ["sepia"]),
      q("¿Qué tinta prefiero ahora?", ["green"], ["verde"]),
    ],
    {
      expectedRelations: [{ kind: "evolvesFrom", from: "green", to: "sepia" }],
    },
  ),
  s(
    "j43",
    "correction",
    "He colocado 26 cuentas en el tarro ámbar. El dedal está sobre el cojín.",
    [
      u("beads", ["26", "cuentas", "tarro", "ambar"], "fact"),
      u("thimble", ["dedal", "cojin"], "fact"),
    ],
    [
      q("¿Cuántas cuentas coloqué en el tarro ámbar?", ["beads"], ["26"]),
      q("¿Dónde está el dedal?", ["thimble"], ["cojin"]),
    ],
    {
      correction: {
        label: "beads",
        text: "No eran 26 cuentas, eran 31.",
        expected: u(
          "beads",
          ["31", "cuentas", "tarro", "ambar"],
          "fact",
          unknown,
          { forbidden: ["26", "\\bno\\b"], evidenceTerms: ["colocado"] },
        ),
        query: q(
          "¿Cuántas cuentas coloqué y en qué tarro?",
          ["beads"],
          ["31", "ambar"],
          { forbidden: ["26"] },
        ),
      },
    },
  ),
  s(
    "j44",
    "correction",
    "El 3 de diciembre de 2027 tengo un taller con Melina. Quiero comprar cera de abejas.",
    [
      u("workshop", ["taller", "melina"], "intention", day("2027-12-03")),
      u("wax", ["comprar", "cera", "abejas"]),
    ],
    [
      q("¿Con quién tengo el taller?", ["workshop"], ["melina"]),
      q("¿Qué cera quiero comprar?", ["wax"], ["abejas"]),
    ],
    {
      correction: {
        label: "workshop",
        text: "El taller es con Elvira, no con Melina.",
        expected: u(
          "workshop",
          ["taller", "elvira"],
          "intention",
          day("2027-12-03"),
          { forbidden: ["melina"] },
        ),
        query: q(
          "¿Cuándo y con quién tengo el taller?",
          ["workshop"],
          ["3", "diciembre", "elvira"],
          { forbidden: ["melina"] },
        ),
      },
    },
  ),
  s(
    "j45",
    "correction",
    "Mañana quiero devolver el libro de mariposas. Mi marcapáginas está en la cartera.",
    [
      u(
        "return",
        ["devolver", "libro", "mariposas"],
        "intention",
        day("2026-07-15"),
      ),
      u("bookmark", ["marcapaginas", "cartera"], "fact"),
    ],
    [
      q("¿Cuándo quiero devolver el libro de mariposas?", ["return"], ["15"]),
      q("¿Dónde está el marcapáginas?", ["bookmark"], ["cartera"]),
    ],
    {
      correction: {
        label: "return",
        text: "Devolveré ese libro el 22 de julio de 2026.",
        expected: u(
          "return",
          ["devolver", "libro", "mariposas"],
          "intention",
          day("2026-07-22"),
          { forbidden: ["manana"] },
        ),
        query: q(
          "¿Qué día devolveré el libro de mariposas?",
          ["return"],
          ["22", "julio"],
          { forbidden: ["15"] },
        ),
      },
    },
  ),
  s(
    "j46",
    "correction",
    "El pase del museo cuesta 34 euros. Mi gorra está en el perchero.",
    [
      u("price", ["pase", "museo", "34", "euros"], "fact"),
      u("cap", ["gorra", "perchero"], "fact"),
    ],
    [
      q("¿Cuánto cuesta el pase del museo?", ["price"], ["34"]),
      q("¿Dónde está mi gorra?", ["cap"], ["perchero"]),
    ],
    {
      repeat: {
        text: "El precio del pase del museo sigue siendo 34 euros.",
        count: 2,
      },
      correction: {
        label: "price",
        text: "El pase cuesta 39 euros, no 34.",
        expected: u(
          "price",
          ["pase", "museo", "39", "euros"],
          "fact",
          unknown,
          { forbidden: ["34"] },
        ),
        query: q("¿Cuánto cuesta el pase del museo?", ["price"], ["39"], {
          forbidden: ["34"],
        }),
      },
    },
  ),
  s(
    "j47",
    "correction",
    "Dora me dijo que hay 27 plazas para la visita nocturna. Quiero tejer una funda de botella.",
    [
      u(
        "places",
        ["dora", "27", "plazas", "visita", "nocturna"],
        "quotation",
        unknown,
        { attribution: "dora" },
      ),
      u("cover", ["tejer", "funda", "botella"]),
    ],
    [
      q("¿Cuántas plazas hay según Dora?", ["places"], ["27"]),
      q("¿Qué funda quiero tejer?", ["cover"], ["botella"]),
    ],
    {
      correction: {
        label: "places",
        text: "Dora dijo 19 plazas, no 27.",
        expected: u(
          "places",
          ["dora", "19", "plazas", "visita", "nocturna"],
          "quotation",
          unknown,
          { attribution: "dora", forbidden: ["27"] },
        ),
        query: q(
          "¿Cuántas plazas hay según lo que dijo Dora?",
          ["places"],
          ["19"],
          { forbidden: ["27"] },
        ),
      },
    },
  ),
  s(
    "j48",
    "correction",
    "No regalé mi broche de plata. El joyero está dentro de la cómoda.",
    [
      u("brooch", ["regal", "broche", "plata"], "fact", unknown, {
        polarity: "negative",
      }),
      u("box", ["joyero", "comoda"], "fact"),
    ],
    [
      q("¿Regalé mi broche de plata?", ["brooch"], ["no"]),
      q("¿Dónde está el joyero?", ["box"], ["comoda"]),
    ],
    {
      correction: {
        label: "brooch",
        text: "El broche era de estaño, no de plata.",
        expected: u("brooch", ["regal", "broche", "estano"], "fact", unknown, {
          polarity: "negative",
          forbidden: ["plata"],
          evidenceTerms: ["\\bno\\b"],
        }),
        query: q("¿Regalé mi broche de estaño?", ["brooch"], ["no"], {
          forbidden: ["plata"],
        }),
      },
    },
  ),
];
