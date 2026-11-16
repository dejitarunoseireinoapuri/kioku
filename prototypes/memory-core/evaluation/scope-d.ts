import { ask, day, scenario, unit, unknown } from "./case.ts";

export const scopeD = [
  scenario(
    "h37",
    "similar",
    "No quiero competir en el torneo de damas. Mi sobrino sí quiere competir en ese torneo.",
    [
      unit("self", ["competir", "torneo", "damas"], "intention", unknown, {
        polarity: "negative",
        subject: "^(?:yo|owner|propietari[oa]|usuari[oa])$",
      }),
      unit(
        "nephew",
        ["sobrino", "competir", "torneo", "damas"],
        "intention",
        unknown,
        { subject: "sobrino" },
      ),
    ],
    [
      ask("¿Quiero competir yo en el torneo de damas?", ["self"], ["no"]),
      ask("¿Quiere competir mi sobrino?", ["nephew"], ["quiere"]),
    ],
  ),
  scenario(
    "h38",
    "similar",
    "Mi fontanero Darío quiere aprender checo. Mi vecino Darío quiere aprender turco.",
    [
      unit("plumber", ["fontanero", "dario", "checo"]),
      unit("neighbor", ["vecino", "dario", "turco"]),
    ],
    [
      ask(
        "¿Qué idioma quiere aprender mi fontanero Darío?",
        ["plumber"],
        ["checo"],
      ),
      ask(
        "¿Qué idioma quiere aprender mi vecino Darío?",
        ["neighbor"],
        ["turco"],
      ),
    ],
  ),
  scenario(
    "h39",
    "similar",
    "El 3 de marzo de 2027 quiero recorrer el sendero del Hayedo. El 11 de marzo de 2027 quiero recorrer el mismo sendero.",
    [
      unit(
        "first",
        ["recorrer", "sendero", "hayedo"],
        "intention",
        day("2027-03-03"),
      ),
      unit(
        "second",
        ["recorrer", "sendero", "hayedo"],
        "intention",
        day("2027-03-11"),
      ),
    ],
    [
      ask("¿Qué quiero recorrer el 3 de marzo?", ["first"], ["hayedo"]),
      ask("¿Qué quiero recorrer el 11 de marzo?", ["second"], ["hayedo"]),
    ],
  ),
  scenario(
    "h40",
    "similar",
    "Quiero reservar una habitación en El Robledal. Ya he reservado una en Las Dunas.",
    [
      unit("plan", ["reservar", "habitacion", "robledal"]),
      unit("booked", ["reservado", "habitacion", "dunas"], "fact"),
    ],
    [
      ask("¿Dónde quiero reservar una habitación?", ["plan"], ["robledal"]),
      ask("¿Dónde he reservado ya una habitación?", ["booked"], ["dunas"]),
    ],
  ),
  scenario(
    "h41",
    "similar",
    "Mi cuñada quiere probar el taller de esmalte. Mi primo me dijo que quiere probar ese taller.",
    [
      unit("sister", ["cunada", "taller", "esmalte"]),
      unit("cousin", ["primo", "taller", "esmalte"], "quotation", unknown, {
        attribution: "primo",
      }),
    ],
    [
      ask("¿Qué taller quiere probar mi cuñada?", ["sister"], ["esmalte"]),
      ask(
        "¿Qué taller me dijo mi primo que quiere probar?",
        ["cousin"],
        ["esmalte"],
      ),
    ],
  ),
  scenario(
    "h42",
    "similar",
    "Ester me contó que quiere visitar Cudillero. Lidia me contó que quiere visitar Cudillero.",
    [
      unit("ester", ["ester", "visitar", "cudillero"], "quotation", unknown, {
        attribution: "ester",
      }),
      unit("lidia", ["lidia", "visitar", "cudillero"], "quotation", unknown, {
        attribution: "lidia",
      }),
    ],
    [
      ask(
        "¿Qué quiere visitar Ester según me contó?",
        ["ester"],
        ["cudillero"],
      ),
      ask(
        "¿Qué quiere visitar Lidia según me contó?",
        ["lidia"],
        ["cudillero"],
      ),
    ],
  ),
  scenario(
    "h43",
    "correction",
    "La puerta del cobertizo mide 184 centímetros de alto. Quiero pintar la verja.",
    [
      unit("door", ["puerta", "cobertizo", "184", "alto"], "fact"),
      unit("fence", ["pintar", "verja"]),
    ],
    [
      ask("¿Cuánto mide de alto la puerta del cobertizo?", ["door"], ["184"]),
      ask("¿Qué quiero pintar?", ["fence"], ["verja"]),
    ],
    {
      correction: {
        label: "door",
        text: "Medí mal esa puerta: mide 189 centímetros de alto, no 184.",
        expected: unit(
          "door",
          ["puerta", "cobertizo", "189", "alto"],
          "fact",
          unknown,
          { forbidden: ["184"] },
        ),
        query: ask(
          "¿Cuánto mide de alto la puerta y de qué edificio es?",
          ["door"],
          ["189", "cobertizo"],
          { forbidden: ["184"] },
        ),
      },
    },
  ),
  scenario(
    "h44",
    "correction",
    "El pase del acuario cuesta 31 euros. Quiero comprar un mapa de corrientes.",
    [
      unit("pass", ["pase", "acuario", "31", "euros"], "fact"),
      unit("map", ["comprar", "mapa", "corrientes"]),
    ],
    [
      ask("¿Cuánto cuesta el pase del acuario?", ["pass"], ["31"]),
      ask("¿Qué mapa quiero comprar?", ["map"], ["corrientes"]),
    ],
    {
      correction: {
        label: "pass",
        text: "El precio que anoté del pase es incorrecto: son 34 euros, no 31.",
        expected: unit(
          "pass",
          ["pase", "acuario", "34", "euros"],
          "fact",
          unknown,
          { forbidden: ["31"] },
        ),
        query: ask(
          "¿Cuánto cuesta el pase del acuario ahora?",
          ["pass"],
          ["34"],
          { forbidden: ["31"] },
        ),
      },
    },
  ),
  scenario(
    "h45",
    "correction",
    "El 6 de noviembre de 2026 tengo una visita al yacimiento. Quiero llevar una libreta.",
    [
      unit("visit", ["visita", "yacimiento"], "intention", day("2026-11-06")),
      unit("notebook", ["llevar", "libreta"]),
    ],
    [
      ask(
        "¿Qué día tengo la visita al yacimiento?",
        ["visit"],
        ["6", "noviembre"],
      ),
      ask("¿Qué quiero llevar?", ["notebook"], ["libreta"]),
    ],
    {
      correction: {
        label: "visit",
        text: "La visita al yacimiento no es el 6: la fecha correcta es el 8 de noviembre de 2026.",
        expected: unit(
          "visit",
          ["visita", "yacimiento"],
          "intention",
          day("2026-11-08"),
          { forbidden: ["\\b6\\b"] },
        ),
        query: ask(
          "¿Qué día tengo la visita al yacimiento?",
          ["visit"],
          ["8", "noviembre"],
          { forbidden: ["\\b6\\b"] },
        ),
      },
    },
  ),
  scenario(
    "h46",
    "correction",
    "He acordado con Celso revisar las diapositivas en la biblioteca. Quiero escanear los negativos.",
    [
      unit(
        "agreement",
        ["celso", "revisar", "diapositivas", "biblioteca"],
        "fact",
      ),
      unit("negatives", ["escanear", "negativos"]),
    ],
    [
      ask(
        "¿Con quién acordé revisar las diapositivas?",
        ["agreement"],
        ["celso"],
      ),
      ask("¿Qué quiero escanear?", ["negatives"], ["negativos"]),
    ],
    {
      correction: {
        label: "agreement",
        text: "Me equivoqué de nombre: lo acordé con Ciro, no con Celso.",
        expected: unit(
          "agreement",
          ["ciro", "revisar", "diapositivas", "biblioteca"],
          "fact",
          unknown,
          { forbidden: ["celso"] },
        ),
        query: ask(
          "¿Con quién y dónde acordé revisar las diapositivas?",
          ["agreement"],
          ["ciro", "biblioteca"],
          { forbidden: ["celso"] },
        ),
      },
    },
  ),
  scenario(
    "h47",
    "correction",
    "Mañana quiero comprar una carpeta naranja para el curso de botánica. Quiero afilar las tijeras.",
    [
      unit(
        "folder",
        ["comprar", "carpeta", "naranja", "curso", "botanica"],
        "intention",
        day("2026-07-15"),
      ),
      unit("scissors", ["afilar", "tijeras"]),
    ],
    [
      ask(
        "¿De qué color quiero comprar la carpeta para botánica?",
        ["folder"],
        ["naranja"],
      ),
      ask("¿Qué quiero afilar?", ["scissors"], ["tijeras"]),
    ],
    {
      correction: {
        label: "folder",
        text: "Me confundí con el color de la carpeta: la quiero gris, no naranja.",
        expected: unit(
          "folder",
          ["comprar", "carpeta", "gris", "curso", "botanica"],
          "intention",
          day("2026-07-15"),
          { forbidden: ["naranja"] },
        ),
        query: ask(
          "¿De qué color, para qué curso y qué día quiero comprar la carpeta?",
          ["folder"],
          ["gris", "botanica", "15"],
          { forbidden: ["naranja"] },
        ),
      },
    },
  ),
  scenario(
    "h48",
    "correction",
    "Antes prefería merendar dátiles; ahora prefiero merendar nueces.",
    [
      unit("before", ["antes", "prefer", "datiles"], "opinion"),
      unit("now", ["ahora", "prefier|prefer", "nueces"], "opinion"),
    ],
    [
      ask("¿Qué prefería merendar antes?", ["before"], ["datiles"]),
      ask("¿Qué prefiero merendar ahora?", ["now"], ["nueces"]),
    ],
    { expectedRelations: [{ kind: "evolvesFrom", from: "now", to: "before" }] },
  ),
];
