import { ask, day, scenario, unit } from "./case.ts";

export const groupingTime = [
  scenario(
    "g25",
    "time",
    "Mañana tengo la revisión del audífono. Ayer limpié la pecera.",
    [
      unit("aid", ["revision", "audifono"], "intention", day("2026-08-01")),
      unit("tank", ["limpi", "pecera"], "fact", day("2026-07-30")),
    ],
    [
      ask("¿Qué día tengo la revisión del audífono?", ["aid"], ["1", "agosto"]),
      ask("¿Qué día limpié la pecera?", ["tank"], ["30", "julio"]),
    ],
    { at: "2026-07-31T12:00:00Z" },
  ),
  scenario(
    "g26",
    "time",
    "Hoy he fotografiado el eclipse. Mañana quiero ordenar los negativos.",
    [
      unit("eclipse", ["fotografiado", "eclipse"], "fact", day("2026-07-15")),
      unit(
        "negatives",
        ["ordenar", "negativos"],
        "intention",
        day("2026-07-16"),
      ),
    ],
    [
      ask("¿Qué día fotografié el eclipse?", ["eclipse"], ["15"]),
      ask("¿Qué día quiero ordenar los negativos?", ["negatives"], ["16"]),
    ],
    { at: "2026-07-14T16:30:00Z", zone: "Asia/Tokyo" },
  ),
  scenario(
    "g27",
    "time",
    "Hoy he comprado una hamaca. Mañana quiero instalarla en la terraza.",
    [
      unit("purchase", ["comprado", "hamaca"], "fact", day("2026-07-13")),
      unit(
        "install",
        ["instalar", "hamaca", "terraza"],
        "intention",
        day("2026-07-14"),
      ),
    ],
    [
      ask("¿Qué día compré la hamaca?", ["purchase"], ["13"]),
      ask("¿Qué día quiero instalar la hamaca?", ["install"], ["14"]),
    ],
    { at: "2026-07-14T02:00:00Z", zone: "America/Mexico_City" },
  ),
  scenario(
    "g28",
    "time",
    "Estaré en el retiro del 28 de diciembre de 2026 al 3 de enero de 2027. El cumpleaños de Noelia es el 29 de febrero.",
    [
      unit("retreat", ["retiro"], "intention", {
        precision: "interval",
        value: "2026-12-28",
        end: "2027-01-03",
      }),
      unit("birthday", ["cumpleanos", "noelia"], "fact", {
        precision: "month_day",
        value: "--02-29",
        end: null,
      }),
    ],
    [
      ask(
        "¿En qué fechas estaré en el retiro?",
        ["retreat"],
        ["28", "diciembre", "3", "enero"],
      ),
      ask("¿Cuándo cumple años Noelia?", ["birthday"], ["29", "febrero"]),
    ],
  ),
  scenario(
    "g29",
    "time",
    "En septiembre de 2027 quiero cursar encuadernación japonesa. En 2029 quiero recorrer Namibia.",
    [
      unit("course", ["encuadernacion", "japonesa"], "intention", {
        precision: "month",
        value: "2027-09",
        end: null,
      }),
      unit("trip", ["recorrer", "namibia"], "intention", {
        precision: "year",
        value: "2029",
        end: null,
      }),
    ],
    [
      ask(
        "¿Qué mes quiero cursar encuadernación japonesa?",
        ["course"],
        ["septiembre", "2027"],
      ),
      ask("¿Qué año quiero recorrer Namibia?", ["trip"], ["2029"]),
    ],
  ),
  scenario(
    "g30",
    "time",
    "Hoy a las nueve de la noche tengo ensayo de coro. Mañana por la mañana quiero comprar una carpeta.",
    [
      unit(
        "choir",
        ["ensayo", "coro", "nueve|21", "noche"],
        "intention",
        day("2026-07-14"),
      ),
      unit(
        "folder",
        ["comprar", "carpeta", "manana"],
        "intention",
        day("2026-07-15"),
      ),
    ],
    [
      ask("¿A qué hora tengo ensayo de coro?", ["choir"], ["nueve|21"]),
      ask(
        "¿Qué día y parte del día quiero comprar una carpeta?",
        ["folder"],
        ["15", "manana"],
      ),
    ],
  ),
];
