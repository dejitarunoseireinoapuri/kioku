import { ask, day, scenario, unit } from "./case.ts";
export const reserveA = [
  scenario(
    "r01",
    "independent",
    "Esta tarde quiero reparar la cometa roja. Mañana practicaré violín veinte minutos.",
    [
      unit("kite", ["cometa", "roja"], "intention", day("2026-07-14")),
      unit("violin", ["violin", "veinte|20"], "intention", day("2026-07-15")),
    ],
    [
      ask("¿Qué quiero reparar esta tarde?", ["kite"], ["cometa", "roja"]),
      ask("¿Cuánto practicaré violín mañana?", ["violin"], ["veinte|20"]),
    ],
  ),
  scenario(
    "r02",
    "independent",
    "He dejado el paraguas en la taquilla 42 y quiero comprar pilas recargables.",
    [
      unit("umbrella", ["paraguas", "42"], "fact"),
      unit("batteries", ["pilas", "recargables"]),
    ],
    [
      ask("¿Dónde dejé el paraguas?", ["umbrella"], ["42"]),
      ask("¿Qué tipo de pilas quiero comprar?", ["batteries"], ["recargables"]),
    ],
  ),
  scenario(
    "r03",
    "independent",
    "Ayer probé un té ahumado que me resultó amargo. El viernes 17 de julio de 2026 iré al planetario.",
    [
      unit(
        "tea",
        ["te", "ahumado", "amargo"],
        ["fact", "opinion"],
        day("2026-07-13"),
      ),
      unit("stars", ["planetario"], "intention", day("2026-07-17")),
    ],
    [
      ask("¿Qué me pareció el té ahumado?", ["tea"], ["amargo"]),
      ask("¿Cuándo iré al planetario?", ["stars"], ["17|viernes"]),
    ],
  ),
  scenario(
    "r04",
    "independent",
    "Se me ocurrió fabricar una lámpara con corchos. También tengo pendiente devolver el atlas a la biblioteca.",
    [
      unit("lamp", ["lampara", "corchos"], "thought"),
      unit("atlas", ["atlas", "biblioteca"]),
    ],
    [
      ask("¿Qué idea tuve para una lámpara?", ["lamp"], ["corchos"]),
      ask("¿Qué tengo que devolver a la biblioteca?", ["atlas"], ["atlas"]),
    ],
  ),
  scenario(
    "r05",
    "independent",
    "El 21 de julio de 2026 tengo revisión de la vista y el 23 de julio de 2026 visitaré el jardín botánico.",
    [
      unit("eye", ["revision", "vista"], "intention", day("2026-07-21")),
      unit("garden", ["jardin", "botanico"], "intention", day("2026-07-23")),
    ],
    [
      ask("¿Cuándo es mi revisión de la vista?", ["eye"], ["21"]),
      ask("¿Qué visitaré el día 23?", ["garden"], ["botanico"]),
    ],
  ),
  scenario(
    "r06",
    "independent",
    "Compré tres macetas de barro y guardé la factura dentro del diccionario verde.",
    [
      unit("pots", ["tres|3", "macetas", "barro"], "fact"),
      unit("receipt", ["factura", "diccionario", "verde"], "fact"),
    ],
    [
      ask(
        "¿Cuántas macetas y de qué material compré?",
        ["pots"],
        ["tres|3", "barro"],
      ),
      ask("¿Dónde guardé la factura?", ["receipt"], ["diccionario", "verde"]),
    ],
  ),
  scenario(
    "r07",
    "shared",
    "En el mercadillo de Valdemora compré una brújula antigua y encargué una funda de cuero.",
    [
      unit("compass", ["brujula", "antigua", "valdemora"], "fact"),
      unit("case", ["funda", "cuero", "valdemora"], "fact"),
    ],
    [
      ask("¿Qué brújula compré en Valdemora?", ["compass"], ["antigua"]),
      ask("¿Qué encargué en el mercadillo?", ["case"], ["funda", "cuero"]),
    ],
  ),
  scenario(
    "r08",
    "shared",
    "Durante las vacaciones en Miraluna hice un curso de mosaico y aprendí a preparar pan de centeno.",
    [
      unit("mosaic", ["mosaico", "miraluna"], "fact"),
      unit("bread", ["centeno", "miraluna"], "fact"),
    ],
    [
      ask("¿Qué curso hice en Miraluna?", ["mosaic"], ["mosaico"]),
      ask("¿Qué pan aprendí a preparar allí?", ["bread"], ["centeno"]),
    ],
  ),
  scenario(
    "r09",
    "shared",
    "En la feria de ciencia de ayer vi un robot submarino y probé unas gafas de realidad aumentada.",
    [
      unit("robot", ["robot", "submarino"], "fact", day("2026-07-13")),
      unit("glasses", ["gafas", "aumentada"], "fact", day("2026-07-13")),
    ],
    [
      ask("¿Qué robot vi en la feria?", ["robot"], ["submarino"]),
      ask("¿Qué gafas probé y cuándo?", ["glasses"], ["aumentada", "ayer|13"]),
    ],
  ),
  scenario(
    "r10",
    "shared",
    "Con mi hermana recorrí el sendero de las hayas y tomé chocolate con naranja.",
    [
      unit("trail", ["hermana", "hayas"], "fact"),
      unit("chocolate", ["hermana", "chocolate", "naranja"], "fact"),
    ],
    [
      ask("¿Qué sendero recorrí con mi hermana?", ["trail"], ["hayas"]),
      ask(
        "¿Con qué era el chocolate que tomé con ella?",
        ["chocolate"],
        ["naranja"],
      ),
    ],
  ),
  scenario(
    "r11",
    "shared",
    "Para la fiesta de disfraces quiero coser una capa violeta y llevar galletas de avena.",
    [
      unit("cape", ["capa", "violeta", "disfraces"]),
      unit("cookies", ["galletas", "avena", "disfraces"]),
    ],
    [
      ask("¿Qué quiero coser para la fiesta?", ["cape"], ["capa", "violeta"]),
      ask(
        "¿Qué quiero llevar a la fiesta de disfraces?",
        ["cookies"],
        ["avena"],
      ),
    ],
  ),
  scenario(
    "r12",
    "shared",
    "El sábado 18 de julio de 2026, en Puerto Claro, quiero alquilar una canoa y visitar el museo de faros.",
    [
      unit("canoe", ["canoa", "puerto claro"], "intention", day("2026-07-18")),
      unit(
        "museum",
        ["museo", "faros", "puerto claro"],
        "intention",
        day("2026-07-18"),
      ),
    ],
    [
      ask("¿Dónde quiero alquilar una canoa?", ["canoe"], ["puerto claro"]),
      ask("¿Qué museo quiero visitar el sábado?", ["museum"], ["faros"]),
    ],
  ),
  scenario(
    "r13",
    "condition",
    "Si encuentro una entrada por menos de 25 euros, iré al concierto de arpa mañana.",
    [
      unit("harp", ["arpa", "menos", "25"], "intention", day("2026-07-15"), {
        condition: "menos.*25|25.*menos",
      }),
    ],
    [
      ask(
        "¿Cuál es mi condición para ir al concierto de arpa?",
        ["harp"],
        ["menos", "25"],
      ),
      ask("¿Cuándo quiero ir si consigo esa entrada?", ["harp"], ["manana|15"]),
    ],
  ),
  scenario(
    "r14",
    "condition",
    "Solo haré la ruta del acantilado si mi tobillo deja de doler.",
    [
      unit(
        "cliff",
        ["acantilado", "tobillo", "doler|dolor"],
        "intention",
        undefined,
        { condition: "tobillo" },
      ),
    ],
    [
      ask("¿Qué ruta quiero hacer?", ["cliff"], ["acantilado", "tobillo"]),
      ask("¿De qué depende que haga esa ruta?", ["cliff"], ["tobillo"]),
    ],
  ),
  scenario(
    "r15",
    "condition",
    "Si Nora consigue el coche, llevaremos el telescopio al monte el 19 de julio de 2026.",
    [
      unit(
        "telescope",
        ["nora", "coche", "telescopio", "monte"],
        "intention",
        day("2026-07-19"),
        { condition: "nora.*coche" },
      ),
    ],
    [
      ask(
        "¿Qué tiene que pasar para llevar el telescopio al monte?",
        ["telescope"],
        ["nora", "coche"],
      ),
      ask("¿Qué día sería la salida del telescopio?", ["telescope"], ["19"]),
    ],
  ),
  scenario(
    "r16",
    "condition",
    "Quiero adoptar un gato, pero únicamente cuando termine la obra de casa.",
    [
      unit("cat", ["gato", "obra"], "intention", undefined, {
        condition: "obra",
      }),
    ],
    [
      ask("¿Ya tengo decidido cuándo adoptar un gato?", ["cat"], ["obra"]),
      ask("¿Qué animal quiero adoptar?", ["cat"], ["gato"]),
    ],
  ),
  scenario(
    "r17",
    "condition",
    "No reservaré el curso de buceo hasta recibir la confirmación de vacaciones.",
    [
      unit("diving", ["buceo", "vacaciones"], "intention", undefined, {
        condition: "vacaciones",
        polarity: "negative",
      }),
    ],
    [
      ask("¿Qué necesito antes de reservar buceo?", ["diving"], ["vacaciones"]),
      ask("¿Qué curso estoy pendiente de reservar?", ["diving"], ["buceo"]),
    ],
  ),
  scenario(
    "r18",
    "condition",
    "Mañana quiero dibujar en el parque si está abierto; si está cerrado, dibujaré en casa.",
    [
      unit(
        "drawing",
        ["dibujar", "parque", "abierto", "casa", "cerrado"],
        "intention",
        day("2026-07-15"),
        { condition: "abierto|cerrado" },
      ),
    ],
    [
      ask("¿Dónde dibujaré si el parque está cerrado?", ["drawing"], ["casa"]),
      ask("¿Y si está abierto?", ["drawing"], ["parque"], {
        previous: "¿Dónde dibujaré si el parque está cerrado?",
      }),
    ],
  ),
];
