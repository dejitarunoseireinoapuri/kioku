import { ask, day, scenario, unit, unknown } from "./case.ts";

export const scopeC = [
  scenario(
    "h25",
    "time",
    "Mañana tengo ensayo de percusión. Quiero comprar baquetas.",
    [
      unit(
        "rehearsal",
        ["ensayo", "percusion"],
        "intention",
        day("2026-07-15"),
      ),
      unit("sticks", ["comprar", "baquetas"]),
    ],
    [
      ask("¿Qué día tengo ensayo de percusión?", ["rehearsal"], ["15"]),
      ask("¿Qué quiero comprar?", ["sticks"], ["baquetas"]),
    ],
  ),
  scenario(
    "h26",
    "time",
    "El 18 de diciembre de 2026 tengo una charla sobre fósiles. Ese día quiero llevar una lupa.",
    [
      unit("talk", ["charla", "fosiles"], "intention", day("2026-12-18")),
      unit("lens", ["llevar", "lupa"], "intention", day("2026-12-18")),
    ],
    [
      ask(
        "¿Cuándo tengo la charla sobre fósiles?",
        ["talk"],
        ["18", "diciembre"],
      ),
      ask("¿Qué día quiero llevar la lupa?", ["lens"], ["18", "diciembre"]),
    ],
  ),
  scenario(
    "h27",
    "time",
    "En abril de 2027 quiero hacer un curso de latín. Quiero recuperar mi diccionario.",
    [
      unit("latin", ["curso", "latin"], "intention", {
        precision: "month",
        value: "2027-04",
        end: null,
      }),
      unit("dictionary", ["recuperar", "diccionario"]),
    ],
    [
      ask(
        "¿En qué mes quiero hacer el curso de latín?",
        ["latin"],
        ["abril", "2027"],
      ),
      ask("¿Qué día exacto empieza ese curso?", [], [], {
        status: "not_found",
        contextLabels: ["latin"],
      }),
    ],
  ),
  scenario(
    "h28",
    "time",
    "El cumpleaños de mi padrino es el 13 de mayo. Quiero regalarle una armónica.",
    [
      unit("birthday", ["cumpleanos", "padrino", "13", "mayo"], "fact", {
        precision: "month_day",
        value: "--05-13",
        end: null,
      }),
      unit("gift", ["regalar", "padrino", "armonica"]),
    ],
    [
      ask("¿Cuándo cumple años mi padrino?", ["birthday"], ["13", "mayo"]),
      ask("¿Qué quiero regalarle?", ["gift"], ["armonica"]),
    ],
  ),
  scenario(
    "h29",
    "time",
    "Ayer cosí el bolsillo del delantal. Mañana quiero coser un botón al abrigo.",
    [
      unit(
        "pocket",
        ["cosi|cosido", "bolsillo", "delantal"],
        "fact",
        day("2026-07-13"),
      ),
      unit(
        "button",
        ["coser", "boton", "abrigo"],
        "intention",
        day("2026-07-15"),
      ),
    ],
    [
      ask("¿Qué cosí ayer?", ["pocket"], ["bolsillo", "delantal"]),
      ask("¿Qué quiero coser mañana?", ["button"], ["boton", "abrigo"]),
    ],
  ),
  scenario(
    "h30",
    "time",
    "El 4 de febrero de 2027 quiero visitar la cantera. Para esa visita quiero llevar un casco.",
    [
      unit("quarry", ["visita", "cantera"], "intention", day("2027-02-04")),
      unit(
        "helmet",
        ["llevar", "casco", "visita", "cantera"],
        "intention",
        day("2027-02-04"),
      ),
    ],
    [
      ask("¿Cuándo quiero visitar la cantera?", ["quarry"], ["4", "febrero"]),
      ask("¿Qué quiero llevar para esa visita?", ["helmet"], ["casco"]),
    ],
  ),
  scenario(
    "h31",
    "duplicate",
    "Quiero ver el observatorio de Yebes. Quiero aprender a pulir ámbar.",
    [
      unit("observatory", ["observatorio", "yebes"]),
      unit("amber", ["aprender", "pulir", "ambar"]),
    ],
    [
      ask("¿Qué observatorio quiero ver?", ["observatory"], ["yebes"]),
      ask("¿Qué quiero aprender a pulir?", ["amber"], ["ambar"]),
    ],
    {
      repeat: {
        text: "Sigo teniendo pendiente ver el observatorio de Yebes.",
        count: 2,
      },
    },
  ),
  scenario(
    "h32",
    "duplicate",
    "Nicanor me dijo que quiere aprender xilografía. Yo quiero reparar un barómetro.",
    [
      unit(
        "woodcut",
        ["nicanor", "aprender", "xilografia"],
        "quotation",
        unknown,
        { attribution: "nicanor" },
      ),
      unit("barometer", ["reparar", "barometro"]),
    ],
    [
      ask(
        "¿Qué me contó Nicanor que quiere aprender?",
        ["woodcut"],
        ["xilografia"],
      ),
      ask("¿Qué instrumento quiero reparar?", ["barometer"], ["barometro"]),
    ],
    {
      repeat: {
        text: "Nicanor me ha repetido que quiere aprender xilografía.",
        count: 2,
      },
    },
  ),
  scenario(
    "h33",
    "duplicate",
    "Guardé el abono del tren en la funda del portátil. El recibo está en la agenda.",
    [
      unit("pass", ["abono", "tren", "funda", "portatil"], "fact"),
      unit("receipt", ["recibo", "agenda"], "fact"),
    ],
    [
      ask("¿Dónde está el abono del tren?", ["pass"], ["funda", "portatil"]),
      ask("¿Dónde está el recibo?", ["receipt"], ["agenda"]),
    ],
    {
      repeat: {
        text: "El abono del tren sigue en la funda del portátil.",
        count: 2,
      },
    },
  ),
  scenario(
    "h34",
    "duplicate",
    "El bizcocho de anís me resulta desagradable. Me gusta la tarta de ciruelas.",
    [
      unit("cake", ["bizcocho", "anis"], "opinion", unknown, {
        polarity: "negative",
      }),
      unit("pie", ["tarta", "ciruelas"], "opinion"),
    ],
    [
      ask(
        "¿Qué pienso del bizcocho de anís?",
        ["cake"],
        ["desagrad|disgust|no te gusta"],
      ),
      ask("¿Qué tarta me gusta?", ["pie"], ["ciruelas"]),
    ],
    { repeat: { text: "No me gusta el bizcocho de anís.", count: 2 } },
  ),
  scenario(
    "h35",
    "duplicate",
    "El 12 de enero de 2027 tengo revisión de la caldera. Quiero cambiar el felpudo.",
    [
      unit("boiler", ["revision", "caldera"], "intention", day("2027-01-12")),
      unit("mat", ["cambiar", "felpudo"]),
    ],
    [
      ask(
        "¿Qué día tengo la revisión de la caldera?",
        ["boiler"],
        ["12", "enero"],
      ),
      ask("¿Qué quiero cambiar de la entrada?", ["mat"], ["felpudo"]),
    ],
    {
      repeat: {
        text: "Sigue pendiente la revisión de la caldera del 12 de enero de 2027.",
        count: 2,
      },
    },
  ),
  scenario(
    "h36",
    "duplicate",
    "Tengo pendiente la película Relojes de Sal. Quiero ordenar el costurero.",
    [
      unit("film", ["pelicula", "relojes", "sal"]),
      unit("sewing", ["ordenar", "costurero"]),
    ],
    [
      ask("¿Qué película tengo pendiente?", ["film"], ["relojes", "sal"]),
      ask("¿Qué quiero ordenar?", ["sewing"], ["costurero"]),
    ],
    { repeat: { text: "Aún tengo pendiente Relojes de Sal.", count: 2 } },
  ),
];
