import { ask, day, scenario, unit } from "./case.ts";
export const reserveC = [
  scenario(
    "r37",
    "similar",
    "El 10 de julio de 2026 fui al teatro Prisma. El 20 de julio de 2026 quiero volver al teatro Prisma.",
    [
      unit("past", ["prisma"], "fact", day("2026-07-10")),
      unit("future", ["prisma"], "intention", day("2026-07-20")),
    ],
    [
      ask("¿Cuándo fui al teatro Prisma?", ["past"], ["10"]),
      ask("¿Cuándo quiero volver?", ["future"], ["20"], {
        previous: "¿Cuándo fui al teatro Prisma?",
      }),
    ],
  ),
  scenario(
    "r38",
    "similar",
    "Mi compañero Álex quiere aprender ruso. Mi vecino Álex quiere aprender sueco.",
    [
      unit("work", ["companero", "alex", "ruso"], "intention"),
      unit("neighbor", ["vecino", "alex", "sueco"], "intention"),
    ],
    [
      ask("¿Qué idioma quiere aprender mi compañero Álex?", ["work"], ["ruso"]),
      ask("¿Y mi vecino Álex?", ["neighbor"], ["sueco"], {
        previous: "¿Qué idioma quiere aprender mi compañero Álex?",
      }),
    ],
  ),
  scenario(
    "r39",
    "similar",
    "Me gusta el café de avellana, pero no me gusta el helado de avellana.",
    [
      unit("coffee", ["cafe", "avellana"], "opinion"),
      unit("ice", ["helado", "avellana"], "opinion", undefined, {
        polarity: "negative",
      }),
    ],
    [
      ask("¿Me gusta el café de avellana?", ["coffee"], ["si|gusta"]),
      ask("¿Y el helado de avellana?", ["ice"], ["no"], {
        previous: "¿Me gusta el café de avellana?",
      }),
    ],
  ),
  scenario(
    "r40",
    "similar",
    "Hoy quiero visitar el museo de trenes de Brisalia. Mañana quiero visitar el museo de trenes de Rocafina.",
    [
      unit("brisalia", ["trenes", "brisalia"], "intention", day("2026-07-14")),
      unit("rocafina", ["trenes", "rocafina"], "intention", day("2026-07-15")),
    ],
    [
      ask(
        "¿En qué ciudad visitaré el museo de trenes hoy?",
        ["brisalia"],
        ["brisalia"],
      ),
      ask("¿Y mañana?", ["rocafina"], ["rocafina"], {
        previous: "¿En qué ciudad visitaré el museo de trenes hoy?",
      }),
    ],
  ),
  scenario(
    "r41",
    "similar",
    "Dejé las llaves de la bici en la lata azul. Las llaves del cobertizo están en la caja naranja.",
    [
      unit("bike", ["llaves", "bici", "lata", "azul"], "fact"),
      unit("shed", ["llaves", "cobertizo", "caja", "naranja"], "fact"),
    ],
    [
      ask("¿Dónde están las llaves de la bici?", ["bike"], ["lata", "azul"]),
      ask("¿Y las del cobertizo?", ["shed"], ["caja", "naranja"], {
        previous: "¿Dónde están las llaves de la bici?",
      }),
    ],
  ),
  scenario(
    "r42",
    "similar",
    "El 12 de julio de 2026 cociné arroz con setas. El 16 de julio de 2026 quiero cocinar arroz con calabaza.",
    [
      unit("mushroom", ["arroz", "setas"], "fact", day("2026-07-12")),
      unit("pumpkin", ["arroz", "calabaza"], "intention", day("2026-07-16")),
    ],
    [
      ask("¿Con qué cociné el arroz el día 12?", ["mushroom"], ["setas"]),
      ask("¿Con qué quiero cocinarlo el 16?", ["pumpkin"], ["calabaza"], {
        previous: "¿Con qué cociné el arroz el día 12?",
      }),
    ],
  ),
  scenario(
    "r43",
    "correction",
    "El 26 de julio de 2026 quiero visitar el castillo de Niebla.",
    [unit("castle", ["castillo", "niebla"], "intention", day("2026-07-26"))],
    [
      ask("¿Qué castillo quiero visitar?", ["castle"], ["niebla"]),
      ask("¿Qué fecha tiene la visita?", ["castle"], ["26"]),
    ],
    {
      correction: {
        label: "castle",
        text: "El nombre correcto es castillo de Aurora, no de Niebla.",
        expected: unit(
          "castle",
          ["castillo", "aurora"],
          "intention",
          day("2026-07-26"),
          { forbidden: ["niebla"] },
        ),
        query: ask(
          "¿Qué castillo visitaré y qué día?",
          ["castle"],
          ["aurora", "26"],
          { forbidden: ["niebla"] },
        ),
      },
    },
  ),
  scenario(
    "r44",
    "correction",
    "El 28 de julio de 2026 tengo clase de torno. Quiero comprar arcilla blanca.",
    [
      unit("pottery", ["torno"], "intention", day("2026-07-28")),
      unit("clay", ["arcilla", "blanca"]),
    ],
    [
      ask("¿Cuándo tengo torno?", ["pottery"], ["28"]),
      ask("¿Qué arcilla quiero comprar?", ["clay"], ["blanca"]),
    ],
    {
      correction: {
        label: "pottery",
        text: "Me equivoqué: la clase de torno es el 30 de julio de 2026.",
        expected: unit("pottery", ["torno"], "intention", day("2026-07-30")),
        query: ask("¿Cuándo es ahora la clase de torno?", ["pottery"], ["30"], {
          forbidden: ["28"],
        }),
      },
    },
  ),
  scenario(
    "r45",
    "correction",
    "Guardé cinco entradas del festival en el sobre amarillo.",
    [unit("tickets", ["cinco|5", "entradas", "amarillo"], "fact")],
    [
      ask("¿Cuántas entradas guardé?", ["tickets"], ["cinco|5"]),
      ask("¿Dónde las guardé?", ["tickets"], ["amarillo"], {
        previous: "¿Cuántas entradas guardé?",
      }),
    ],
    {
      correction: {
        label: "tickets",
        text: "Eran cuatro entradas, no cinco.",
        expected: unit(
          "tickets",
          ["cuatro|4", "entradas", "amarillo"],
          "fact",
          undefined,
          { forbidden: ["cinco|5"] },
        ),
        query: ask(
          "¿Cuántas entradas hay y dónde?",
          ["tickets"],
          ["cuatro|4", "amarillo"],
          { forbidden: ["cinco|5"] },
        ),
      },
    },
  ),
  scenario(
    "r46",
    "correction",
    "El 17 de julio de 2026 quiero almorzar en Hiedra con mi prima.",
    [unit("lunch", ["hiedra", "prima"], "intention", day("2026-07-17"))],
    [
      ask("¿Dónde quiero almorzar?", ["lunch"], ["hiedra"]),
      ask("¿Con quién será el almuerzo?", ["lunch"], ["prima"]),
    ],
    {
      correction: {
        label: "lunch",
        text: "La persona era mi tía, no mi prima.",
        expected: unit(
          "lunch",
          ["hiedra", "tia"],
          "intention",
          day("2026-07-17"),
          { forbidden: ["prima"] },
        ),
        query: ask(
          "¿Con quién y dónde quiero almorzar el 17?",
          ["lunch"],
          ["tia", "hiedra"],
          { forbidden: ["prima"] },
        ),
      },
    },
  ),
  scenario(
    "r47",
    "correction",
    "En 2024 prefería el chocolate negro. Desde 2026 prefiero el chocolate con leche.",
    [
      unit("old", ["chocolate", "negro"], "opinion", {
        precision: "year",
        value: "2024",
        end: null,
      }),
      unit("new", ["chocolate", "leche"], "opinion", {
        precision: "year",
        value: "2026",
        end: null,
      }),
    ],
    [
      ask("¿Qué chocolate prefería en 2024?", ["old"], ["negro"]),
      ask("¿Qué prefiero desde 2026?", ["new"], ["leche"]),
    ],
  ),
  scenario(
    "r48",
    "correction",
    "Antes coleccionaba sellos; ahora colecciono postales de faros.",
    [
      unit("old", ["sellos"], "fact"),
      unit("new", ["postales", "faros"], "fact", day("2026-07-14")),
    ],
    [
      ask("¿Qué coleccionaba antes?", ["old"], ["sellos"]),
      ask("¿Qué colecciono ahora?", ["new"], ["postales", "faros"]),
    ],
  ),
];
