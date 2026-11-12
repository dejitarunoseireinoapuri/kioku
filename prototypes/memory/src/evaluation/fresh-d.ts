import { entry, gold, time, ask } from "./fresh-fixture.ts";
import type { Scenario } from "./fixture.ts";
export const scenarios: Scenario[] = [
  entry(
    "h25",
    "time",
    "Mañana a las 7:35 tengo programada la recogida de un paquete en la oficina postal Pinar.",
    [
      gold(["paquete", "Pinar", "7:35"], {
        kinds: ["fact", "intention"],
        eventStatuses: ["planned"],
        time: time("day", "2026-10-26"),
      }),
    ],
    [
      ask(
        "¿Qué día estaba prevista la recogida del paquete en Pinar?",
        ["h25"],
        [["26 de octubre", "2026-10-26", "26/10/2026"]],
      ),
      ask(
        "¿A qué hora estaba programada la recogida en Pinar?",
        ["h25"],
        [["7:35", "07:35"]],
      ),
    ],
    { receivedAt: "2026-10-24T23:30:00Z", zone: "Europe/Madrid" },
  ),
  entry(
    "h26",
    "mixed",
    "Me encantó el pan de centeno de la panadería Humo. Hoy terminé de montar el rompecabezas del faro rojo.",
    [
      gold(["pan", "centeno", "Humo"], { kinds: ["opinion"] }),
      gold(["rompecabezas", "faro", "rojo"], {
        eventStatuses: ["completed"],
        time: time("day", "2026-11-11"),
      }),
    ],
    [
      ask("¿Qué pan me gustó en Humo?", ["h26"], [["centeno"]]),
      ask(
        "¿Cuándo terminé el rompecabezas del faro rojo?",
        ["h26"],
        [["11 de noviembre", "2026-11-11", "11/11/2026"]],
      ),
    ],
  ),
  entry(
    "h27",
    "basic",
    "La llave pequeña de latón está dentro de la taza con lunares, en el estante inferior del mueble del recibidor.",
    [gold(["llave", "laton", "taza", "lunares", "inferior", "recibidor"])],
    [
      ask(
        "¿Dónde está mi llave pequeña de latón?",
        ["h27"],
        [["taza"], ["lunares"], ["recibidor"]],
      ),
      ask(
        "¿En qué estante puse la taza que contiene la llave de latón?",
        ["h27"],
        [["inferior"]],
      ),
    ],
  ),
  entry(
    "h28",
    "basic",
    "No soy alérgico al melocotón. Sí soy alérgico al anacardo.",
    [gold(["no", "melocoton"]), gold(["alerg", "anacardo"])],
    [
      ask("¿A qué alimento dije que tengo alergia?", ["h28"], [["anacardo"]], {
        critical: true,
      }),
      ask("¿Dije que era alérgico al melocotón?", ["h28"], [["no"]], {
        critical: true,
      }),
    ],
  ),
  entry(
    "h29",
    "change",
    "Corrijo el precio de la sesión de grabado: pagué 27 euros, no 72.",
    [gold(["grabado", "27"], { eventStatuses: ["completed"] })],
    [
      ask(
        "¿Cuánto pagué realmente por la sesión de grabado?",
        ["h29"],
        [["27"]],
        { critical: true },
      ),
      ask(
        "¿Qué precio incorrecto corregí de la sesión de grabado?",
        ["h29"],
        [["72"]],
      ),
    ],
  ),
  entry(
    "h30",
    "mixed",
    "Hoy me sentí aliviado al terminar de ordenar el trastero. Pensé en hacer una foto de cada caja para recordar su contenido.",
    [
      gold(["aliviad", "trastero"], {
        kinds: ["fact", "thought"],
        eventStatuses: ["completed", "unspecified"],
        time: time("day", "2026-11-11"),
      }),
      gold(["foto", "caja", "contenido"], {
        kinds: ["thought", "intention"],
        eventStatuses: ["planned", "unspecified"],
      }),
    ],
    [
      ask(
        "¿Cómo me sentí al terminar de ordenar el trastero?",
        ["h30"],
        [["aliviad"]],
      ),
      ask(
        "¿Qué idea tuve para recordar el contenido de las cajas?",
        ["h30"],
        [["foto"], ["caja"]],
      ),
    ],
  ),
  entry(
    "h31",
    "time",
    "La devolución del proyector está prevista para 2026-12-09 a las 16:05 en el local del barrio.",
    [
      gold(["proyector", "16:05"], {
        kinds: ["fact", "intention"],
        eventStatuses: ["planned"],
        time: time("day", "2026-12-09"),
      }),
    ],
    [
      ask(
        "¿Qué fecha y hora tengo para devolver el proyector?",
        ["h31"],
        [["9 de diciembre", "2026-12-09", "09/12/2026"], ["16:05"]],
      ),
      ask(
        "¿Dónde debo devolver el proyector?",
        ["h31"],
        [["local"], ["barrio"]],
      ),
    ],
  ),
  entry(
    "h32",
    "context",
    "Chika me recomendó leer El jardín de las mareas porque le conté que me interesan los manglares.",
    [
      gold(["Chika", "jardin", "mareas"], {
        provenance: "reported",
        attribution: "Chika",
        eventStatuses: ["completed"],
      }),
      gold(["interes", "manglares"], { kinds: ["opinion", "fact"] }),
    ],
    [
      ask("¿Qué libro me recomendó Chika?", ["h32"], [["jardin"], ["mareas"]]),
      ask(
        "¿Qué interés mío relacionó Chika con ese libro?",
        ["h32"],
        [["manglares"]],
      ),
    ],
  ),
];
