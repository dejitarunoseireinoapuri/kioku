import { ask, day, scenario, unit } from "./case.ts";
export const finalTime = [
  scenario(
    "f25",
    "time",
    "Pasado mañana tengo una revisión de la bicicleta. Ayer renové el carnet de la piscina.",
    [
      unit(
        "bicycle",
        ["revision", "bicicleta"],
        "intention",
        day("2026-07-16"),
      ),
      unit("pool", ["carnet", "piscina"], "fact", day("2026-07-13")),
    ],
    [
      ask("¿Qué día tengo la revisión de la bicicleta?", ["bicycle"], ["16"]),
      ask("¿Qué día renové el carnet de la piscina?", ["pool"], ["13"]),
    ],
  ),
  scenario(
    "f26",
    "time",
    "Mañana quiero llevar la flauta al taller. Hoy he limpiado su estuche.",
    [
      unit("flute", ["flauta", "taller"], "intention", day("2026-07-16")),
      unit("case", ["flauta", "estuche"], "fact", day("2026-07-15")),
    ],
    [
      ask("¿Qué día quiero llevar la flauta al taller?", ["flute"], ["16"]),
      ask("¿Qué día limpié el estuche?", ["case"], ["15"]),
    ],
    { at: "2026-07-14T23:40:00Z", zone: "Europe/Madrid" },
  ),
  scenario(
    "f27",
    "time",
    "Hoy he enviado la postal de Vancouver. Mañana quiero visitar el jardín botánico.",
    [
      unit("postcard", ["postal", "vancouver"], "fact", day("2026-07-13")),
      unit("garden", ["jardin", "botanico"], "intention", day("2026-07-14")),
    ],
    [
      ask("¿Qué día envié la postal?", ["postcard"], ["13"]),
      ask("¿Qué día quiero visitar el jardín botánico?", ["garden"], ["14"]),
    ],
    { at: "2026-07-14T01:20:00Z", zone: "America/Vancouver" },
  ),
  scenario(
    "f28",
    "time",
    "Estaré en el albergue del 5 al 9 de agosto de 2026. El cumpleaños de Héctor es el 5 de febrero.",
    [
      unit("hostel", ["albergue"], "intention", {
        precision: "interval",
        value: "2026-08-05",
        end: "2026-08-09",
      }),
      unit("birthday", ["cumpleanos", "hector"], "fact", {
        precision: "month_day",
        value: "--02-05",
        end: null,
      }),
    ],
    [
      ask(
        "¿Entre qué días estaré en el albergue?",
        ["hostel"],
        ["5", "9", "agosto"],
      ),
      ask(
        "¿Cuándo es el cumpleaños de Héctor?",
        ["birthday"],
        ["5", "febrero"],
      ),
    ],
  ),
  scenario(
    "f29",
    "time",
    "El mes que viene quiero apuntarme a un curso de talla. El año que viene quiero ir a Islandia.",
    [
      unit("carving", ["curso", "talla"], "intention", {
        precision: "month",
        value: "2026-08",
        end: null,
      }),
      unit("iceland", ["islandia"], "intention", {
        precision: "year",
        value: "2027",
        end: null,
      }),
    ],
    [
      ask(
        "¿En qué mes quiero apuntarme al curso de talla?",
        ["carving"],
        ["agosto|2026-08"],
      ),
      ask("¿En qué año quiero ir a Islandia?", ["iceland"], ["2027"]),
    ],
  ),
  scenario(
    "f30",
    "time",
    "El viernes 17 de julio de 2026 a las seis de la tarde tengo ensayo de coro. Quiero volver a escuchar el álbum Horizonte Azul.",
    [
      unit(
        "choir",
        ["ensayo", "coro", "\\b(?:seis|6|18)\\b", "tarde"],
        "intention",
        day("2026-07-17"),
      ),
      unit("album", ["album", "horizonte azul"]),
    ],
    [
      ask(
        "¿A qué hora tengo ensayo de coro el viernes 17?",
        ["choir"],
        ["\\b(?:seis|6|18)\\b"],
      ),
      ask(
        "¿Qué álbum quiero escuchar otra vez?",
        ["album"],
        ["horizonte azul"],
      ),
    ],
  ),
];
