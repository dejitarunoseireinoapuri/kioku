import * as f from "./fixture.ts";
import type { Scenario } from "./fixture.ts";

// Reserved v2: authored before any v2 validation call; never included in runtime prompts.
export const scenarios: Scenario[] = [
  f.scenario(
    "n01",
    "context",
    "Cuando Irene se vaya al congreso quiero ver La llegada. Todavía no la he visto.",
    [f.item(["Irene", "llegada"], "intention")],
    [
      f.yes(
        "¿Qué película quería ver aprovechando que Irene estaba fuera?",
        "n01",
        [["llegada"]],
      ),
      f.yes("¿Dije que ya había visto La llegada?", "n01", [["no"]], true),
    ],
  ),
  f.scenario(
    "n02",
    "intention",
    "Mañana quiero enviar a Leo el dossier sobre los molinos. Aún no lo he enviado.",
    [f.item(["Leo", "dossier", "molinos"], "intention", "2026-11-12")],
    [
      f.yes("¿Qué documento tenía pensado mandar a Leo?", "n02", [
        ["dossier"],
        ["molinos"],
      ]),
      f.yes("¿Consta que envié el dossier a Leo?", "n02", [["no"]], true, true),
    ],
  ),
  f.scenario(
    "n03",
    "basic",
    "No me gusta el cilantro; sí me gusta la albahaca.",
    [f.item(["cilantro", "no"], "opinion"), f.item(["albahaca"], "opinion")],
    [
      f.yes("¿Me gusta el cilantro?", "n03", [["no"]], true),
      f.yes("¿Qué hierba dije que sí me gustaba?", "n03", [["albahaca"]]),
    ],
  ),
  f.scenario(
    "n04",
    "time",
    "La prueba de alemán será el 19 de noviembre de 2026 a las 17:15 en el aula C.",
    [f.item(["aleman", "17:15", "C"], "fact", "2026-11-19")],
    [
      f.yes("¿Qué día y hora tengo la prueba de alemán?", "n04", [
        ["19 de noviembre", "2026-11-19"],
        ["17:15"],
      ]),
      f.yes("¿Dónde es la prueba de alemán?", "n04", [["aula c"]]),
    ],
  ),
  f.scenario(
    "n05",
    "time",
    "Para el lunes 16 de noviembre de 2026 tengo que preparar el audio 2 y el ejercicio 8 de la página 53 de alemán.",
    [f.item(["audio", "2", "8", "53"], "intention", "2026-11-16")],
    [
      {
        ...f.yes("¿Qué deberes de alemán tengo para el lunes?", "n05", [
          ["audio"],
          ["2"],
          ["8"],
          ["53"],
        ]),
        at: "2026-11-11T18:00:00+01:00",
      },
      f.yes(
        "¿En qué página está el ejercicio para el 16 de noviembre?",
        "n05",
        [["53"]],
      ),
    ],
  ),
  f.scenario(
    "n06",
    "context",
    "Irene irá al congreso de Bilbao el 21 de noviembre de 2026.",
    [f.item(["Irene", "Bilbao"], "intention", "2026-11-21")],
    [
      {
        ...f.yes(
          "¿Qué película pensaba ver cuando Irene viajara al congreso y en qué ciudad será el congreso?",
          "n01",
          [["llegada"], ["bilbao"]],
        ),
        sources: ["n01", "n06"],
      },
      f.yes("¿A qué ciudad viajará Irene el 21?", "n06", [["bilbao"]]),
    ],
  ),
  f.scenario(
    "n07",
    "context",
    "El martes 10 de noviembre de 2026 quedé con Óscar, mi amigo del ajedrez. Me contó que había cenado lentejas con calabaza.",
    [f.item(["Oscar", "lentejas", "calabaza"], "fact", "2026-11-10")],
    [
      f.yes(
        "¿De qué comida habló mi amigo del ajedrez cuando quedamos?",
        "n07",
        [["lentejas"], ["calabaza"]],
      ),
      f.yes("¿Qué hablamos Óscar y yo el martes 10?", "n07", [["lentejas"]]),
    ],
  ),
  f.scenario(
    "n08",
    "ambiguity",
    "Alex, mi compañero del gimnasio, cumple años el 2 de febrero.",
    [f.item(["Alex", "gimnasio", "2", "febrero"])],
    [
      f.yes(
        "¿Cuándo cumple años Alex el del gimnasio?",
        "n08",
        [["2 de febrero"]],
        true,
      ),
      f.unclear("¿Cuándo cumple años Alex?"),
    ],
  ),
  f.scenario(
    "n09",
    "ambiguity",
    "Alex, mi primo, cumple años el 17 de octubre.",
    [f.item(["Alex", "primo", "17", "octubre"])],
    [
      f.yes(
        "¿Cuándo es el cumpleaños de mi primo Alex?",
        "n09",
        [["17 de octubre"]],
        true,
      ),
      f.unclear("¿Qué fecha tengo para el cumpleaños de Alex?"),
    ],
  ),
  f.scenario(
    "n10",
    "ambiguity",
    "Él dijo que la tutoría sería el viernes.",
    [f.item(["Riku", "tutoria"], "fact", "2026-11-13")],
    [
      f.yes("¿Quién me dijo cuándo sería la tutoría?", "n10", [["riku"]]),
      f.yes("¿Qué fecha tiene la tutoría de la que habló Riku?", "n10", [
        ["13 de noviembre", "2026-11-13"],
      ]),
    ],
    {
      status: "needs_clarification",
      clarification:
        "Riku, mi tutor de dibujo. El viernes 13 de noviembre de 2026.",
    },
  ),
  f.scenario(
    "n11",
    "mixed",
    "Ayer compré un bolígrafo burdeos en Tinta por 23 euros. Se me ocurrió un juego sobre un lago flotante.",
    [
      f.item(["boligrafo", "burdeos", "Tinta", "23"], "fact", "2026-11-10"),
      f.item(["juego", "lago", "flotante"], "thought"),
    ],
    [
      f.yes("¿Cuánto pagué por el bolígrafo y en qué tienda?", "n11", [
        ["23"],
        ["tinta"],
      ]),
      f.yes("¿De qué trataba la idea del juego que tuve?", "n11", [
        ["lago"],
        ["flotante"],
      ]),
    ],
  ),
  f.scenario(
    "n12",
    "mixed",
    "Me encantó el pudin de coco de Bruma. Hoy terminé de leer Las islas de papel.",
    [
      f.item(["pudin", "coco", "Bruma"], "opinion"),
      f.item(["islas", "papel"], "fact", "2026-11-11"),
    ],
    [
      f.yes("¿Qué postre me gustó en Bruma?", "n12", [["pudin"], ["coco"]]),
      f.yes("¿Qué libro terminé el 11 de noviembre?", "n12", [
        ["islas"],
        ["papel"],
      ]),
    ],
  ),
  f.scenario(
    "n13",
    "intention",
    "Estoy pensando en apuntarme a equitación, pero todavía no me he inscrito.",
    [f.item(["equitacion", "no"], "intention")],
    [
      f.yes(
        "¿Dije que ya estaba inscrito en equitación?",
        "n13",
        [["no"]],
        true,
      ),
      f.yes("¿Qué actividad quería empezar?", "n13", [["equitacion"]]),
    ],
  ),
  f.scenario(
    "n14",
    "intention",
    "Quiero regalar un bonsái a Elena en su cumpleaños, pero no sé qué día cumple años.",
    [f.item(["bonsai", "Elena"], "intention")],
    [
      f.yes("¿Qué regalo pensé para Elena?", "n14", [["bonsai"]]),
      f.no("¿Qué día cumple años Elena?"),
    ],
  ),
  f.scenario(
    "n15",
    "change",
    "Hasta octubre prefería trabajar con música; desde noviembre de 2026 prefiero trabajar en silencio.",
    [
      f.item(["octubre", "musica"], "opinion"),
      f.item(["noviembre", "silencio"], "opinion"),
    ],
    [
      f.yes("¿Prefiero ahora trabajar con música o en silencio?", "n15", [
        ["silencio"],
      ]),
      f.yes("¿Cómo prefería trabajar antes de noviembre?", "n15", [["musica"]]),
    ],
  ),
  f.scenario(
    "n16",
    "change",
    "Había planeado visitar el acuario el viernes 13 de noviembre de 2026, pero lo descarté: finalmente iré al concierto de arpa el sábado 14 de noviembre de 2026.",
    [
      f.item(["acuario"], "intention", "2026-11-13"),
      f.item(["concierto", "arpa"], "intention", "2026-11-14"),
    ],
    [
      f.yes(
        "¿Qué plan decidí finalmente para el 14 de noviembre de 2026?",
        "n16",
        [["concierto"], ["arpa"]],
        true,
      ),
      f.yes("¿Qué visita descarté?", "n16", [["acuario"]]),
    ],
  ),
];
