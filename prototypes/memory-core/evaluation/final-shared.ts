import { ask, scenario, unit } from "./case.ts";
export const finalShared = [
  scenario(
    "f07",
    "shared",
    "Durante la mudanza del estudio, embalé la máquina de coser y desmonté la mesa plegable.",
    [
      unit("machine", ["mudanza", "estudio", "maquina", "coser"], "fact"),
      unit("table", ["mudanza", "estudio", "mesa", "plegable"], "fact"),
    ],
    [
      ask(
        "¿Qué embalé durante la mudanza del estudio?",
        ["machine"],
        ["maquina", "coser"],
      ),
      ask(
        "¿Qué desmonté durante esa mudanza?",
        ["table"],
        ["mesa", "plegable"],
      ),
    ],
  ),
  scenario(
    "f08",
    "shared",
    "En el vivero compré 11 macetas cuadradas y 4 redondas para el balcón.",
    [
      unit(
        "square",
        ["vivero", "11", "macetas", "cuadrad", "balcon"],
        "fact",
        undefined,
        { evidenceTerms: ["compre"] },
      ),
      unit(
        "round",
        ["vivero", "4", "macetas", "redond", "balcon"],
        "fact",
        undefined,
        { evidenceTerms: ["compre"] },
      ),
    ],
    [
      ask(
        "¿Cuántas macetas cuadradas compré y dónde?",
        ["square"],
        ["11", "vivero"],
      ),
      ask(
        "¿Cuántas macetas redondas compré y para dónde?",
        ["round"],
        ["4", "balcon"],
      ),
    ],
  ),
  scenario(
    "f09",
    "shared",
    "Para la merienda de la asociación, horneé magdalenas de limón y preparé una jarra de horchata.",
    [
      unit(
        "muffins",
        ["merienda", "asociacion", "magdalenas", "limon"],
        "fact",
      ),
      unit("drink", ["merienda", "asociacion", "jarra", "horchata"], "fact"),
    ],
    [
      ask(
        "¿Qué horneé para la asociación?",
        ["muffins"],
        ["magdalenas", "limon"],
      ),
      ask("¿Qué bebida preparé para la merienda?", ["drink"], ["horchata"]),
    ],
  ),
  scenario(
    "f10",
    "shared",
    "De la excursión al embalse traje una piedra lisa; también dibujé allí un junco.",
    [
      unit("stone", ["embalse", "piedra", "lisa"], "fact"),
      unit("drawing", ["embalse", "junco"], "fact"),
    ],
    [
      ask("¿Qué piedra traje del embalse?", ["stone"], ["lisa"]),
      ask("¿Qué dibujé en la excursión al embalse?", ["drawing"], ["junco"]),
    ],
  ),
  scenario(
    "f11",
    "shared",
    "Con la cámara analógica hice una foto del puente colgante y otra del faro abandonado.",
    [
      unit(
        "bridge",
        ["camara", "analogica", "puente", "colgante"],
        "fact",
        undefined,
        { evidenceTerms: ["foto"] },
      ),
      unit(
        "beacon",
        ["camara", "analogica", "faro", "abandonado"],
        "fact",
        undefined,
        { evidenceTerms: ["foto"] },
      ),
    ],
    [
      ask(
        "¿Qué puente fotografié con la cámara analógica?",
        ["bridge"],
        ["colgante"],
      ),
      ask("¿Qué faro fotografié?", ["beacon"], ["faro", "abandonado"]),
    ],
    {
      after: [
        ask("¿Qué puente fotografié?", [], [], { status: "not_found" }),
        ask(
          "¿Qué faro fotografié y con qué cámara?",
          ["beacon"],
          ["abandonado", "analogica"],
        ),
      ],
    },
  ),
  scenario(
    "f12",
    "shared",
    "En casa de Estela lavé las cortinas del salón; la alfombra del dormitorio la sacudí allí también.",
    [
      unit("curtains", ["estela", "cortinas", "salon"], "fact"),
      unit("rug", ["estela", "alfombra", "dormitorio"], "fact"),
    ],
    [
      ask("¿Qué lavé en casa de Estela?", ["curtains"], ["cortinas", "salon"]),
      ask(
        "¿Qué alfombra sacudí y en casa de quién?",
        ["rug"],
        ["dormitorio", "estela"],
      ),
    ],
  ),
];
