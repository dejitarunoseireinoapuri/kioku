import { ask as q, scenario as s, unit as u, day, unknown } from "./case.ts";

export const boundedC = [
  s(
    "j25",
    "time",
    "Mañana quiero entregar un grabado a Candela. El rodillo está en el estante inferior.",
    [
      u(
        "print",
        ["entregar", "grabado", "candela"],
        "intention",
        day("2026-07-16"),
      ),
      u("roller", ["rodillo", "estante", "inferior"], "fact"),
    ],
    [
      q(
        "¿Qué fecha entregaré el grabado a Candela?",
        ["print"],
        ["16", "julio"],
      ),
      q("¿Dónde está el rodillo?", ["roller"], ["estante", "inferior"]),
    ],
    { at: "2026-07-14T23:40:00Z" },
  ),
  s(
    "j26",
    "time",
    "En noviembre de 2027 quiero aprender grabado en linóleo. Dejé el sacapuntas en la caja de costura.",
    [
      u("course", ["aprender", "grabado", "linoleo"], "intention", {
        precision: "month",
        value: "2027-11",
        end: null,
      }),
      u("sharpener", ["sacapuntas", "caja", "costura"], "fact"),
    ],
    [
      q(
        "¿En qué mes y año quiero aprender grabado en linóleo?",
        ["course"],
        ["noviembre", "2027"],
      ),
      q("¿Dónde dejé el sacapuntas?", ["sharpener"], ["caja", "costura"]),
    ],
  ),
  s(
    "j27",
    "time",
    "El cumpleaños de Eloy es el 24 de enero. Quiero regalarle una caja de acuarelas.",
    [
      u("birthday", ["cumpleanos", "eloy"], "fact", {
        precision: "month_day",
        value: "--01-24",
        end: null,
      }),
      u("gift", ["regalar", "eloy", "caja", "acuarelas"]),
    ],
    [
      q("¿Qué día y mes cumple años Eloy?", ["birthday"], ["24", "enero"]),
      q("¿Qué quiero regalar a Eloy?", ["gift"], ["caja", "acuarelas"]),
    ],
  ),
  s(
    "j28",
    "time",
    "Del 2 al 5 de octubre de 2027 estaré en Cuenca. Mi libreta de campo tiene tapas de corcho.",
    [
      u("trip", ["cuenca"], "intention", {
        precision: "interval",
        value: "2027-10-02",
        end: "2027-10-05",
      }),
      u("book", ["libreta", "campo", "tapas", "corcho"], "fact"),
    ],
    [
      q("¿Entre qué fechas estaré en Cuenca?", ["trip"], ["2", "5", "octubre"]),
      q("¿De qué son las tapas de mi libreta de campo?", ["book"], ["corcho"]),
    ],
  ),
  s(
    "j29",
    "time",
    "Ayer terminé un rompecabezas. Mañana quiero enmarcarlo.",
    [
      u("puzzle", ["termin", "rompecabezas"], "fact", day("2026-07-12")),
      u("frame", ["enmarcar", "rompecabezas"], "intention", day("2026-07-14")),
    ],
    [
      q("¿Qué fecha terminé el rompecabezas?", ["puzzle"], ["12", "julio"]),
      q(
        "¿Qué fecha quiero enmarcar el rompecabezas?",
        ["frame"],
        ["14", "julio"],
      ),
    ],
    { at: "2026-07-14T02:00:00Z", zone: "America/Los_Angeles" },
  ),
  s(
    "j30",
    "time",
    "En 2028 quiero recorrer la ruta de los molinos. Mi brújula pequeña está en el cajón azul.",
    [
      u("route", ["recorrer", "ruta", "molinos"], "intention", {
        precision: "year",
        value: "2028",
        end: null,
      }),
      u("compass", ["brujula", "pequena", "cajon", "azul"], "fact"),
    ],
    [
      q(
        "¿En qué año quiero recorrer la ruta de los molinos?",
        ["route"],
        ["2028"],
      ),
      q("¿Dónde está la brújula pequeña?", ["compass"], ["cajon", "azul"]),
    ],
  ),
  s(
    "j31",
    "duplicate",
    "Guardé el afinador en el bolsillo exterior del estuche. Quiero aprender a tocar la ocarina.",
    [
      u("tuner", ["afinador", "bolsillo", "exterior", "estuche"], "fact"),
      u("ocarina", ["aprender", "ocarina"]),
    ],
    [
      q("¿Dónde guardé el afinador?", ["tuner"], ["bolsillo", "exterior"]),
      q("¿Qué instrumento quiero aprender a tocar?", ["ocarina"], ["ocarina"]),
    ],
    {
      repeat: {
        text: "El afinador sigue en el bolsillo exterior del estuche.",
        count: 2,
      },
    },
  ),
  s(
    "j32",
    "duplicate",
    "Quiero leer la novela La Casa de Sal. El pisapapeles es de alabastro.",
    [
      u("novel", ["leer", "novela", "casa", "sal"]),
      u("weight", ["pisapapeles", "alabastro"], "fact"),
    ],
    [
      q("¿Qué novela quiero leer?", ["novel"], ["casa", "sal"]),
      q("¿De qué material es el pisapapeles?", ["weight"], ["alabastro"]),
    ],
    {
      repeat: {
        text: "Todavía tengo pendiente leer La Casa de Sal.",
        count: 2,
      },
    },
  ),
  s(
    "j33",
    "duplicate",
    "No me gusta el helado de regaliz. Mi cuchara larga está en el cajón superior.",
    [
      u("taste", ["helado", "regaliz"], "opinion", undefined, {
        polarity: "negative",
      }),
      u("spoon", ["cuchara", "larga", "cajon", "superior"], "fact"),
    ],
    [
      q(
        "¿Me gusta el helado de regaliz?",
        ["taste"],
        ["no|disgusta|desagrada"],
      ),
      q("¿Dónde está mi cuchara larga?", ["spoon"], ["cajon", "superior"]),
    ],
    { repeat: { text: "Sigue sin gustarme el helado de regaliz.", count: 2 } },
  ),
  s(
    "j34",
    "duplicate",
    "El 12 de septiembre de 2027 tengo revisión de la bicicleta. Quiero comprar un timbre de cobre.",
    [
      u("service", ["revision", "bicicleta"], "intention", day("2027-09-12")),
      u("bell", ["comprar", "timbre", "cobre"]),
    ],
    [
      q(
        "¿Qué fecha tengo la revisión de la bicicleta?",
        ["service"],
        ["12", "septiembre"],
      ),
      q("¿De qué material quiero el timbre?", ["bell"], ["cobre"]),
    ],
    {
      repeat: {
        text: "La revisión de mi bicicleta sigue programada para el 12 de septiembre de 2027.",
        count: 2,
      },
    },
  ),
  s(
    "j35",
    "duplicate",
    "Inés me dijo que quiere aprender a hacer vitrales. Yo quiero restaurar una silla.",
    [
      u("glass", ["ines", "aprender", "vitrales"], "quotation", undefined, {
        attribution: "ines",
      }),
      u("chair", ["restaurar", "silla"]),
    ],
    [
      q("¿Qué quiere aprender Inés según me dijo?", ["glass"], ["vitrales"]),
      q("¿Qué mueble quiero restaurar?", ["chair"], ["silla"]),
    ],
    {
      repeat: {
        text: "Inés volvió a decir que quiere aprender a hacer vitrales.",
        count: 2,
      },
    },
  ),
  s(
    "j36",
    "duplicate",
    "Si recibo el paquete, empezaré a montar el planetario. Quiero ordenar las diapositivas.",
    [
      u(
        "model",
        ["recib", "paquete", "montar", "planetario"],
        "intention",
        unknown,
        { condition: "recib.*paquete" },
      ),
      u("slides", ["ordenar", "diapositivas"]),
    ],
    [
      q(
        "¿De qué depende que empiece a montar el planetario?",
        ["model"],
        ["paquete"],
      ),
      q("¿Qué quiero ordenar?", ["slides"], ["diapositivas"]),
    ],
    {
      repeat: {
        text: "Sigo queriendo montar el planetario si recibo el paquete.",
        count: 2,
      },
    },
  ),
];
