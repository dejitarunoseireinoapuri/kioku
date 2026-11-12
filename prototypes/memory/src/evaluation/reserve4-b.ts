import { entry, gold, time, ask, ambiguous } from "./reserve4-fixture.ts";
import type { Scenario } from "./fixture.ts";
export const scenarios: Scenario[] = [
  entry(
    "j09",
    "basic",
    "No soy alérgico al gluten. Sí soy alérgico a la avellana.",
    [gold(["no", "gluten"]), gold(["alerg", "avellana"])],
    [
      ask("¿A qué alimento dije que soy alérgico?", ["j09"], [["avellana"]], {
        critical: true,
      }),
      ask("¿Dije que tenía alergia al gluten?", ["j09"], [["no"]], {
        critical: true,
      }),
    ],
  ),
  entry(
    "j10",
    "ambiguity",
    "Haru, mi primo biólogo, cumple años el 22 de julio.",
    [
      gold(["Haru", "primo", "22", "julio"], {
        time: time("month_day", "--07-22"),
      }),
    ],
    [
      ask("¿Cuándo cumple años mi primo Haru?", ["j10"], [["22 de julio"]], {
        critical: true,
      }),
      ambiguous("¿Qué cumpleaños tiene Haru?", ["j10", "j11"]),
    ],
  ),
  entry(
    "j11",
    "ambiguity",
    "Haru, el dependiente de la librería, cumple años el 11 de enero.",
    [
      gold(["Haru", "libreria", "11", "enero"], {
        time: time("month_day", "--01-11"),
      }),
    ],
    [
      ask(
        "¿Qué fecha tengo para Haru de la librería?",
        ["j11"],
        [["11 de enero"]],
        { critical: true },
      ),
      ambiguous("¿Qué fecha es el cumpleaños de Haru?", ["j10", "j11"]),
    ],
  ),
  entry(
    "j12",
    "ambiguity",
    "Él me dijo que tenía que devolverle el trípode el viernes.",
    [
      gold(["tripode", "Shin"], {
        kinds: ["fact", "intention"],
        provenance: "reported",
        attribution: ["Shin", "Shin, mi profesor de fotografía"],
        eventStatuses: ["planned"],
        time: time("day", "2026-11-27"),
      }),
    ],
    [
      ask(
        "¿Quién me indicó cuándo tenía que devolver el trípode?",
        ["j12"],
        [["shin"]],
      ),
      ask(
        "¿Qué fecha estaba prevista para devolver el trípode?",
        ["j12"],
        [["27 de noviembre", "2026-11-27"]],
      ),
    ],
    {
      status: "needs_clarification",
      clarification:
        "Shin, mi profesor de fotografía. El viernes 27 de noviembre de 2026.",
    },
  ),
  entry(
    "j13",
    "ambiguity",
    "He dejado eso en el cajón pequeño.",
    [
      gold(["adaptador", "microfono", "cajon", "estudio"], {
        eventStatuses: ["completed", "unspecified"],
      }),
    ],
    [
      ask(
        "¿Dónde dejé el adaptador del micrófono?",
        ["j13"],
        [["cajon"], ["escritorio"], ["estudio"]],
      ),
      ask(
        "¿Qué guardé en el cajón pequeño del escritorio del estudio?",
        ["j13"],
        [["adaptador"], ["microfono"]],
      ),
    ],
    {
      status: "needs_clarification",
      clarification:
        "El adaptador del micrófono. El cajón pequeño del escritorio del estudio. No recuerdo la fecha.",
    },
  ),
  entry(
    "j14",
    "intention",
    "Estoy pensando en sacarme el carnet de patrón de barco. Todavía no he hecho la matrícula ni el examen.",
    [
      gold(["carnet", "patron"], {
        kinds: ["intention", "thought"],
        eventStatuses: ["planned", "unspecified"],
      }),
      gold(["no", "matricula", "examen"], { eventStatuses: ["not_completed"] }),
    ],
    [
      ask(
        "¿Qué permiso estaba pensando obtener?",
        ["j14"],
        [["patron"], ["barco"]],
      ),
      ask(
        "¿Consta que ya aprobé el examen para ser patrón de barco?",
        ["j14"],
        [["no"]],
        { critical: true, allowAbstention: true },
      ),
    ],
  ),
  entry(
    "j15",
    "intention",
    "Quiero pedirle a Fuyu la llave inglesa para el sábado 28 de noviembre de 2026. Aún no se la he pedido.",
    [
      gold(["Fuyu", "llave", "inglesa"], {
        kinds: ["intention"],
        eventStatuses: ["planned"],
        time: time("day", "2026-11-28"),
      }),
      gold(["no", "pedido"], { eventStatuses: ["not_completed"] }),
    ],
    [
      ask(
        "¿Qué herramienta tenía intención de pedirle a Fuyu?",
        ["j15"],
        [["llave"], ["inglesa"]],
      ),
      ask(
        "¿Consta que ya le pedí la llave inglesa a Fuyu?",
        ["j15"],
        [["no"]],
        { critical: true, allowAbstention: true },
      ),
    ],
  ),
  entry(
    "j16",
    "change",
    "Antes prefería escribir en la tablet. Desde noviembre de 2026 prefiero escribir en una libreta cuadriculada.",
    [
      gold(["tablet"], { kinds: ["opinion"] }),
      gold(["libreta", "cuadriculada"], {
        kinds: ["opinion"],
        time: time("month", "2026-11"),
      }),
    ],
    [
      ask(
        "¿En qué prefiero escribir desde noviembre de 2026?",
        ["j16"],
        [["libreta"], ["cuadriculada"]],
      ),
      ask(
        "¿Con qué escribía antes de ese cambio?",
        ["j16"],
        [["prefer", "preferencia"], ["tablet"]],
        { critical: true },
      ),
    ],
  ),
];
