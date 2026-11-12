import { entry, gold, time, ask, absent, ambiguous } from "./fresh-fixture.ts";
import type { Scenario } from "./fixture.ts";
export const scenarios: Scenario[] = [
  entry(
    "h09",
    "ambiguity",
    "Akira, mi compañero del taller de madera, cumple años el 6 de marzo.",
    [
      gold(["Akira", "madera", "6", "marzo"], {
        time: time("month_day", "--03-06"),
      }),
    ],
    [
      ask(
        "¿Cuándo cumple años Akira del taller de madera?",
        ["h09"],
        [["6 de marzo"]],
        { critical: true },
      ),
      ambiguous("¿Cuándo cumple años Akira?", ["h09", "h10"]),
    ],
  ),
  entry(
    "h10",
    "ambiguity",
    "Akira, mi vecino del quinto, cumple años el 28 de septiembre.",
    [
      gold(["Akira", "vecino", "28", "septiembre"], {
        time: time("month_day", "--09-28"),
      }),
    ],
    [
      ask(
        "¿Qué cumpleaños tiene mi vecino Akira?",
        ["h10"],
        [["28 de septiembre"]],
        { critical: true },
      ),
      ambiguous("¿Qué fecha tengo para el cumpleaños de Akira?", [
        "h09",
        "h10",
      ]),
    ],
  ),
  entry(
    "h11",
    "ambiguity",
    "Ella me dijo que la revisión de la caldera sería el viernes.",
    [
      gold(["Yuna", "caldera"], {
        kinds: ["fact", "intention"],
        provenance: "reported",
        attribution: [
          "Yuna",
          "Yuna, la técnica de calefacción",
          "la técnica de calefacción",
        ],
        eventStatuses: ["planned"],
        time: time("day", "2026-11-13"),
      }),
    ],
    [
      ask(
        "¿Quién me indicó la fecha de la revisión de la caldera?",
        ["h11"],
        [["yuna"]],
      ),
      ask(
        "¿Para cuándo estaba prevista la revisión de la caldera que comentó Yuna?",
        ["h11"],
        [
          ["13 de noviembre", "2026-11-13", "13/11/2026"],
          ["previst", "programad", "seria"],
        ],
      ),
    ],
    {
      status: "needs_clarification",
      clarification:
        "Yuna, la técnica de calefacción. El viernes 13 de noviembre de 2026.",
    },
  ),
  entry(
    "h12",
    "ambiguity",
    "La entrega de eso es el día 21.",
    [
      gold(["telescopio", "entrega"], {
        kinds: ["fact", "intention"],
        eventStatuses: ["planned"],
        time: time("day", "2026-12-21"),
      }),
    ],
    [
      ask("¿Qué aparato me tenían que entregar?", ["h12"], [["telescopio"]]),
      ask(
        "¿Qué fecha está prevista para entregar el telescopio?",
        ["h12"],
        [["21 de diciembre", "2026-12-21", "21/12/2026"]],
      ),
    ],
    {
      status: "needs_clarification",
      clarification:
        "Mi telescopio reparado. La entrega está prevista el 21 de diciembre de 2026.",
    },
  ),
  entry(
    "h13",
    "intention",
    "Me gustaría aprender encuadernación. No he reservado ni empezado ningún curso.",
    [
      gold(["encuadernacion"], {
        kinds: ["intention", "thought"],
        eventStatuses: ["planned", "unspecified"],
      }),
      gold(["no", "curso"], { eventStatuses: ["not_completed"] }),
    ],
    [
      ask(
        "¿Qué oficio manual tengo intención de aprender?",
        ["h13"],
        [["encuadernacion"]],
      ),
      ask(
        "¿Consta que ya empecé un curso de encuadernación?",
        ["h13"],
        [["no"]],
        { critical: true, allowAbstention: true },
      ),
    ],
  ),
  entry(
    "h14",
    "intention",
    "Quiero regalar una lámpara de papel a Emi por su aniversario. No sé qué día es ese aniversario.",
    [
      gold(["lampara", "papel", "Emi"], {
        kinds: ["intention"],
        eventStatuses: ["planned"],
      }),
    ],
    [
      ask("¿Qué regalo pensé para Emi?", ["h14"], [["lampara"], ["papel"]]),
      absent("¿Qué día es el aniversario de Emi?"),
    ],
  ),
  entry(
    "h15",
    "change",
    "Antes prefería estudiar con auriculares. Desde octubre de 2026 prefiero estudiar sin música y con la ventana abierta.",
    [
      gold(["auriculares"], { kinds: ["opinion"] }),
      gold(["sin", "musica", "ventana"], {
        kinds: ["opinion"],
        time: time("month", "2026-10"),
      }),
    ],
    [
      ask(
        "¿Cómo prefiero estudiar desde octubre de 2026?",
        ["h15"],
        [["sin musica", "sin música"], ["ventana"], ["abierta"]],
      ),
      ask(
        "¿Qué usaba para estudiar antes de ese cambio?",
        ["h15"],
        [["auriculares"]],
      ),
    ],
  ),
  entry(
    "h16",
    "change",
    "Había previsto una visita al observatorio el domingo 15 de noviembre de 2026, pero la cancelé. En su lugar iré al planetario el martes 17 de noviembre de 2026.",
    [
      gold(["observatorio"], {
        kinds: ["intention", "fact"],
        eventStatuses: ["planned", "not_completed"],
        time: time("day", "2026-11-15"),
      }),
      gold(["planetario"], {
        kinds: ["intention", "fact"],
        eventStatuses: ["planned"],
        time: time("day", "2026-11-17"),
      }),
    ],
    [
      ask(
        "¿Qué plan elegí finalmente para el 17 de noviembre?",
        ["h16"],
        [["planetario"]],
        { critical: true },
      ),
      ask(
        "¿Qué visita cancelé para el domingo 15?",
        ["h16"],
        [["observatorio"]],
      ),
    ],
  ),
];
