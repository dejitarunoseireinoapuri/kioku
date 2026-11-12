import { entry, gold, time, ask, absent } from "./reserve4-fixture.ts";
import type { Scenario } from "./fixture.ts";
export const scenarios: Scenario[] = [
  entry(
    "j01",
    "context",
    "Quiero ver La chica que saltaba a través del tiempo cuando Nozomi esté en su curso de cerámica. Todavía no he visto esa película.",
    [
      gold(["chica", "saltaba", "Nozomi"], {
        kinds: ["intention"],
        eventStatuses: ["planned"],
      }),
      gold(["no", "visto"], { eventStatuses: ["not_completed"] }),
    ],
    [
      ask(
        "¿Qué película quería ver mientras Nozomi estuviera en el curso?",
        ["j01"],
        [["chica"], ["saltaba"]],
      ),
      ask("¿Consta que ya vi esa película?", ["j01"], [["no"]], {
        critical: true,
        allowAbstention: true,
      }),
    ],
  ),
  entry(
    "j02",
    "context",
    "El curso de cerámica de Nozomi está previsto en Zamora para el 3 de diciembre de 2026.",
    [
      gold(["ceramica", "Nozomi", "Zamora"], {
        kinds: ["fact", "intention"],
        eventStatuses: ["planned"],
        time: time("day", "2026-12-03"),
      }),
    ],
    [
      ask(
        "¿Qué película quería ver durante el curso de Nozomi y en qué ciudad está previsto el curso?",
        ["j01", "j02"],
        [["chica"], ["saltaba"], ["zamora"]],
      ),
      absent(
        "¿Quién me dio la información sobre el curso de Nozomi en Zamora?",
      ),
    ],
  ),
  entry(
    "j03",
    "context",
    "El 18 de noviembre de 2026 quedé con Tsubasa, mi entrenador de natación. Tsubasa me contó que había preparado pan de nueces sin levadura.",
    [
      gold(["Tsubasa", "natacion"], {
        eventStatuses: ["completed"],
        time: time("day", "2026-11-18"),
      }),
      gold(["pan", "nueces", "levadura"], {
        provenance: "reported",
        attribution: ["Tsubasa", "Tsubasa, mi entrenador de natación"],
        eventStatuses: ["completed"],
      }),
    ],
    [
      ask(
        "¿Qué había cocinado el entrenador cuando me contó lo del pan?",
        ["j03"],
        [["pan"], ["nueces"], ["sin levadura"]],
      ),
      ask(
        "¿Quién me habló de preparar pan sin levadura?",
        ["j03"],
        [["tsubasa"]],
      ),
    ],
  ),
  entry(
    "j04",
    "time",
    "El examen de japonés está programado para el 12 de diciembre de 2026 a las 10:20 en la sala K3.",
    [
      gold(["japones", "10:20", "K3"], {
        kinds: ["fact", "intention"],
        eventStatuses: ["planned"],
        time: time("day", "2026-12-12"),
      }),
    ],
    [
      ask(
        "¿Qué fecha y hora tengo previstas para el examen de japonés?",
        ["j04"],
        [["12 de diciembre", "2026-12-12"], ["10:20"]],
      ),
      ask(
        "¿En qué sala está previsto el examen de japonés?",
        ["j04"],
        [["k3"]],
      ),
    ],
  ),
  entry(
    "j05",
    "time",
    "Para el lunes 30 de noviembre de 2026 tengo que escribir doce frases con el verbo kiku y leer la página 87 de japonés. Todavía no he hecho esas tareas.",
    [
      gold(["frases", "kiku", "87"], {
        kinds: ["intention"],
        eventStatuses: ["planned"],
        time: time("day", "2026-11-30"),
      }),
    ],
    [
      ask(
        "¿Qué tareas de japonés tengo para el lunes 30?",
        ["j05"],
        [["doce", "12"], ["kiku"], ["87"]],
      ),
      ask("¿Consta que ya acabé las tareas con kiku?", ["j05"], [["no"]], {
        critical: true,
        allowAbstention: true,
      }),
    ],
  ),
  entry(
    "j06",
    "time",
    "Ayer llamé a mi madre durante cinco minutos y hablamos de cambiar el horario del huerto.",
    [
      gold(["madre", "minutos", "horario", "huerto"], {
        eventStatuses: ["completed"],
        time: time("day", "2026-11-18"),
      }),
    ],
    [
      ask(
        "¿Llamé a mi madre la semana pasada?",
        ["j06"],
        [
          ["si", "llamaste"],
          ["18 de noviembre", "2026-11-18"],
        ],
        { critical: true },
      ),
      ask(
        "¿Qué hablamos en la llamada a mi madre y cuánto duró?",
        ["j06"],
        [["horario"], ["huerto"], ["cinco", "5"]],
      ),
    ],
  ),
  entry(
    "j07",
    "time",
    "Mañana a las 11:15 tengo programada la visita al dentista en la clínica Nogal.",
    [
      gold(["dentista", "11:15", "Nogal"], {
        kinds: ["fact", "intention"],
        eventStatuses: ["planned"],
        time: time("day", "2026-12-03"),
      }),
    ],
    [
      ask(
        "¿Qué día estaba prevista la visita al dentista en Nogal?",
        ["j07"],
        [["3 de diciembre", "2026-12-03"]],
        { at: "2026-12-06T12:00:00+01:00" },
      ),
      ask("¿Consta que asistí a la clínica Nogal?", ["j07"], [["no"]], {
        critical: true,
        allowAbstention: true,
        at: "2026-12-06T12:00:00+01:00",
      }),
    ],
    { receivedAt: "2026-12-01T15:30:00Z", zone: "Asia/Tokyo" },
  ),
  entry(
    "j08",
    "basic",
    "Me gustó el sorbete de lichi. No he dicho cuál es mi postre favorito.",
    [gold(["sorbete", "lichi"], { kinds: ["opinion"] })],
    [
      ask("¿Qué sorbete dije que me había gustado?", ["j08"], [["lichi"]]),
      absent("¿Cuál es mi postre favorito?"),
    ],
  ),
];
