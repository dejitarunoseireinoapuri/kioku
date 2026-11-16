import { ask, day, scenario, unit } from "./case.ts";
export const freshC = [
  scenario(
    "n25",
    "time",
    "Mañana quiero visitar el acuario de medusas.",
    [unit("aquarium", ["acuario", "medusas"], "intention", day("2026-07-16"))],
    [
      ask("¿Qué fecha quiero visitar el acuario?", ["aquarium"], ["16"]),
      ask("¿Qué quiero visitar mañana?", ["aquarium"], ["acuario"]),
    ],
    { at: "2026-07-14T22:20:00Z" },
  ),
  scenario(
    "n26",
    "time",
    "Ayer visité la fábrica de vidrio soplado.",
    [unit("glass", ["fabrica", "vidrio"], "fact", day("2026-07-12"))],
    [
      ask("¿Qué fecha visité la fábrica de vidrio?", ["glass"], ["12"]),
      ask("¿Qué visité ayer?", ["glass"], ["vidrio"]),
    ],
    { at: "2026-07-14T03:20:00Z", zone: "America/Bogota" },
  ),
  scenario(
    "n27",
    "time",
    "En octubre de 2026 quiero hacer un taller de marquetería.",
    [
      unit("wood", ["marqueteria"], "intention", {
        precision: "month",
        value: "2026-10",
        end: null,
      }),
    ],
    [
      ask("¿En qué mes quiero hacer marquetería?", ["wood"], ["octubre|10"]),
      ask("¿Sé qué día exacto será el taller de marquetería?", [], [], {
        contextLabels: ["wood"],
      }),
    ],
  ),
  scenario(
    "n28",
    "time",
    "El cumpleaños de mi padrino es el 8 de diciembre.",
    [
      unit("birthday", ["padrino", "8", "diciembre"], "fact", {
        precision: "month_day",
        value: "--12-08",
        end: null,
      }),
    ],
    [
      ask("¿Cuándo cumple años mi padrino?", ["birthday"], ["8", "diciembre"]),
      ask(
        "¿Qué cumpleaños tengo el 8 de diciembre?",
        ["birthday"],
        ["padrino"],
      ),
    ],
  ),
  scenario(
    "n29",
    "time",
    "Del 9 al 12 de septiembre de 2026 estaré en Valle Lumbre.",
    [
      unit("stay", ["valle lumbre"], "intention", {
        precision: "interval",
        value: "2026-09-09",
        end: "2026-09-12",
      }),
    ],
    [
      ask(
        "¿Qué días estaré en Valle Lumbre?",
        ["stay"],
        ["9", "12", "septiembre"],
      ),
      ask("¿Dónde estaré el 10 de septiembre?", ["stay"], ["valle lumbre"]),
    ],
  ),
  scenario(
    "n30",
    "time",
    "Mañana quiero observar grullas en la laguna.",
    [unit("birds", ["grullas", "laguna"], "intention", day("2026-10-26"))],
    [
      ask("¿Qué día quiero observar grullas?", ["birds"], ["26"]),
      ask("¿Dónde quiero observarlas mañana?", ["birds"], ["laguna"], {
        previous: "¿Qué día quiero observar grullas?",
      }),
    ],
    { at: "2026-10-24T23:30:00Z", zone: "Europe/Madrid" },
  ),
  scenario(
    "n31",
    "duplicate",
    "El 4 de agosto de 2026 quiero escuchar el audiolibro Rutas de Ámbar.",
    [unit("audio", ["rutas", "ambar"], "intention", day("2026-08-04"))],
    [
      ask("¿Qué audiolibro quiero escuchar?", ["audio"], ["rutas", "ambar"]),
      ask("¿Para qué día lo tengo pendiente?", ["audio"], ["4", "agosto"], {
        previous: "¿Qué audiolibro quiero escuchar?",
      }),
    ],
    {
      repeat: {
        text: "Tengo pendiente Rutas de Ámbar para el 4 de agosto de 2026.",
        count: 1,
      },
    },
  ),
  scenario(
    "n32",
    "duplicate",
    "Puse la lupa de aumento en la bolsa lateral del maletín marrón.",
    [unit("lens", ["lupa", "lateral", "maletin", "marron"], "fact")],
    [
      ask("¿Dónde guardé la lupa?", ["lens"], ["lateral", "marron"]),
      ask("¿De qué color es el maletín de la lupa?", ["lens"], ["marron"]),
    ],
    {
      repeat: {
        text: "La lupa está dentro de la bolsa lateral de mi maletín marrón.",
        count: 1,
      },
    },
  ),
  scenario(
    "n33",
    "duplicate",
    "No me agrada el zumo de guayaba porque me resulta arenoso.",
    [
      unit("juice", ["guayaba", "arenos"], "opinion", undefined, {
        polarity: "negative",
      }),
    ],
    [
      ask("¿Me gusta el zumo de guayaba?", ["juice"], ["no"]),
      ask("¿Por qué no me agrada ese zumo?", ["juice"], ["arenos"], {
        previous: "¿Me gusta el zumo de guayaba?",
      }),
    ],
    {
      repeat: {
        text: "El zumo de guayaba no me gusta, noto una textura arenosa.",
        count: 1,
      },
    },
  ),
  scenario(
    "n34",
    "duplicate",
    "El 6 de agosto de 2026 tengo cita para ajustar las plantillas.",
    [unit("appointment", ["plantillas"], "intention", day("2026-08-06"))],
    [
      ask("¿Cuándo tengo el ajuste de plantillas?", ["appointment"], ["6"]),
      ask("¿Qué cita tengo el 6 de agosto?", ["appointment"], ["plantillas"]),
    ],
    {
      repeat: {
        text: "La cita del ajuste de plantillas será el 6 de agosto de 2026.",
        count: 1,
      },
    },
  ),
  scenario(
    "n35",
    "duplicate",
    "Si consigo una mesa grande, quiero construir una ciudad de cartón.",
    [
      unit(
        "city",
        ["mesa", "grande", "ciudad", "carton"],
        "intention",
        undefined,
        { condition: "mesa.*grande" },
      ),
    ],
    [
      ask(
        "¿Qué necesito para construir la ciudad de cartón?",
        ["city"],
        ["mesa", "grande"],
      ),
      ask("¿De qué material quiero construir la ciudad?", ["city"], ["carton"]),
    ],
    {
      repeat: {
        text: "Quiero hacer una ciudad de cartón, pero solo si logro tener una mesa grande.",
        count: 1,
      },
    },
  ),
  scenario(
    "n36",
    "duplicate",
    "Vera me dijo que le encanta el aroma del jazmín.",
    [
      unit("vera", ["vera", "jazmin"], "quotation", undefined, {
        attribution: "vera",
      }),
    ],
    [
      ask("¿Qué aroma le encanta a Vera?", ["vera"], ["jazmin"]),
      ask("¿A quién le gusta el jazmín?", ["vera"], ["vera"]),
    ],
    {
      repeat: {
        text: "Según Vera, le gusta muchísimo cómo huele el jazmín.",
        count: 1,
      },
    },
  ),
];
