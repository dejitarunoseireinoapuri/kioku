import { entry, gold, time, ask, absent } from "./fresh-fixture.ts";
import type { Scenario } from "./fixture.ts";
export const scenarios: Scenario[] = [
  entry(
    "h01",
    "context",
    "Quiero ver El castillo ambulante cuando Miki esté en su retiro de escritura. Aún no he visto esa película.",
    [
      gold(["castillo", "ambulante", "Miki"], {
        kinds: ["intention"],
        eventStatuses: ["planned"],
      }),
      gold(["no", "visto", "castillo"], { eventStatuses: ["not_completed"] }),
    ],
    [
      ask(
        "¿Qué película quería ver durante el retiro de Miki?",
        ["h01"],
        [["castillo"], ["ambulante"]],
      ),
      ask("¿Consta que ya vi El castillo ambulante?", ["h01"], [["no"]], {
        critical: true,
        allowAbstention: true,
      }),
    ],
  ),
  entry(
    "h02",
    "context",
    "El retiro de escritura de Miki será en Cuenca el 26 de noviembre de 2026.",
    [
      gold(["Miki", "Cuenca"], {
        kinds: ["fact", "intention"],
        eventStatuses: ["planned"],
        time: time("day", "2026-11-26"),
      }),
    ],
    [
      ask(
        "¿Qué película quería ver cuando Miki estuviera en el retiro y en qué ciudad será el retiro?",
        ["h01", "h02"],
        [["castillo"], ["ambulante"], ["cuenca"]],
      ),
      absent("¿Quién me informó de que Miki estaría en Cuenca?"),
    ],
  ),
  entry(
    "h03",
    "context",
    "El martes 10 de noviembre de 2026 quedé con Itsuki, mi compañero de escalada. Itsuki me contó que había preparado sopa de miso con calabacín.",
    [
      gold(["Itsuki", "escalada"], {
        eventStatuses: ["completed"],
        time: time("day", "2026-11-10"),
      }),
      gold(["Itsuki", "miso", "calabacin"], {
        provenance: "reported",
        attribution: [
          "Itsuki",
          "Itsuki, mi compañero de escalada",
          "mi compañero de escalada",
        ],
        eventStatuses: ["completed"],
      }),
    ],
    [
      ask(
        "¿Qué receta me contó Itsuki cuando quedamos el martes 10?",
        ["h03"],
        [["miso"], ["calabacin"]],
      ),
      ask("¿Quién me habló de la sopa con calabacín?", ["h03"], [["itsuki"]]),
    ],
  ),
  entry(
    "h04",
    "time",
    "La prueba de japonés está programada para el 24 de noviembre de 2026 a las 18:40 en el aula D2.",
    [
      gold(["japones", "18:40", "D2"], {
        kinds: ["fact", "intention"],
        eventStatuses: ["planned"],
        time: time("day", "2026-11-24"),
      }),
    ],
    [
      ask(
        "¿Qué día y a qué hora está prevista la prueba de japonés?",
        ["h04"],
        [["24 de noviembre", "2026-11-24", "24/11/2026"], ["18:40"]],
      ),
      ask(
        "¿En qué aula está programada la prueba de japonés?",
        ["h04"],
        [["d2"]],
      ),
    ],
  ),
  entry(
    "h05",
    "time",
    "Para el lunes 23 de noviembre de 2026 debo escribir diez frases de japonés con el verbo taberu y repasar la página 62. Todavía no he hecho esas tareas.",
    [
      gold(["frases", "taberu", "62"], {
        kinds: ["intention"],
        eventStatuses: ["planned"],
        time: time("day", "2026-11-23"),
      }),
    ],
    [
      ask(
        "¿Qué deberes de japonés tengo para el lunes 23?",
        ["h05"],
        [["diez", "10"], ["frases"], ["taberu"], ["62"]],
      ),
      ask(
        "¿Consta que ya terminé esos deberes de japonés?",
        ["h05"],
        [["no"]],
        { critical: true, allowAbstention: true },
      ),
    ],
  ),
  entry(
    "h06",
    "time",
    "Anteayer llamé a mi padre durante once minutos y hablamos de reparar su bicicleta azul.",
    [
      gold(["padre", "minutos", "bicicleta", "azul"], {
        eventStatuses: ["completed"],
        time: time("day", "2026-11-09"),
      }),
    ],
    [
      ask(
        "¿Llamé a mi padre la semana pasada?",
        ["h06"],
        [
          ["si", "llamaste"],
          ["9 de noviembre", "2026-11-09", "09/11/2026"],
        ],
        { critical: true },
      ),
      ask(
        "¿De qué hablamos y cuánto duró la llamada a mi padre?",
        ["h06"],
        [["bicicleta"], ["once", "11"], ["minut"]],
      ),
    ],
  ),
  entry(
    "h07",
    "basic",
    "No me gusta el jengibre encurtido. Sí me gusta el edamame con sal.",
    [
      gold(["no", "jengibre"], { kinds: ["opinion"] }),
      gold(["edamame", "sal"], { kinds: ["opinion"] }),
    ],
    [
      ask("¿Dije que me gustaba el jengibre encurtido?", ["h07"], [["no"]], {
        critical: true,
      }),
      ask(
        "¿Qué aperitivo japonés dije que sí me gustaba?",
        ["h07"],
        [["edamame"]],
      ),
    ],
  ),
  entry(
    "h08",
    "mixed",
    "Ayer compré una lupa plegable en la tienda Niebla por 16 euros. Se me ocurrió diseñar un juego cooperativo sobre fareros.",
    [
      gold(["lupa", "plegable", "Niebla", "16"], {
        eventStatuses: ["completed"],
        time: time("day", "2026-11-10"),
      }),
      gold(["juego", "cooperativo", "fareros"], {
        kinds: ["thought", "intention"],
        eventStatuses: ["unspecified", "planned"],
      }),
    ],
    [
      ask(
        "¿En qué tienda compré la lupa y cuánto pagué?",
        ["h08"],
        [["niebla"], ["16"]],
      ),
      ask(
        "¿Cuál era la idea del juego sobre fareros?",
        ["h08"],
        [["cooperativ"], ["fareros"]],
      ),
    ],
  ),
];
