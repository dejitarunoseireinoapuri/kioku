import { ask as q, scenario as s, unit as u, day } from "./case.ts";

export const boundedA = [
  s(
    "j01",
    "independent",
    "He terminado un mosaico de nueve piezas. Quiero donar una lámpara.",
    [
      u("mosaic", ["termin", "mosaico", "nueve|9"], "fact"),
      u("lamp", ["donar", "lampara"]),
    ],
    [
      q(
        "¿Cuántas piezas tiene el mosaico que terminé?",
        ["mosaic"],
        ["nueve|9"],
      ),
      q("¿Qué quiero donar?", ["lamp"], ["lampara"]),
    ],
  ),
  s(
    "j02",
    "independent",
    "Mi llavero tiene forma de planeta. Me disgusta el zumo de apio.",
    [
      u("keyring", ["llavero", "planeta"], "fact"),
      u("juice", ["zumo", "apio"], "opinion", undefined, {
        polarity: "negative",
      }),
    ],
    [
      q("¿Qué forma tiene mi llavero?", ["keyring"], ["planeta"]),
      q("¿Me gusta el zumo de apio?", ["juice"], ["no|disgusta|desagrada"]),
    ],
  ),
  s(
    "j03",
    "independent",
    "Tengo pendiente revelar un carrete. Guardé la entrada del acuario dentro de una novela.",
    [
      u("film", ["revelar", "carrete"]),
      u("ticket", ["entrada", "acuario", "novela"], "fact"),
    ],
    [
      q("¿Qué tengo pendiente revelar?", ["film"], ["carrete"]),
      q("¿Dónde guardé la entrada del acuario?", ["ticket"], ["novela"]),
    ],
  ),
  s(
    "j04",
    "independent",
    "Mi personaje del juego se llama Nébula. Quiero cambiar la correa de mi reloj.",
    [
      u("character", ["personaje", "nebula"], "fact"),
      u("watch", ["cambiar", "correa", "reloj"]),
    ],
    [
      q("¿Cómo se llama mi personaje del juego?", ["character"], ["nebula"]),
      q("¿Qué quiero cambiar de mi reloj?", ["watch"], ["correa"]),
    ],
  ),
  s(
    "j05",
    "independent",
    "Pagué 28 euros por encuadernar el cuaderno. Me gustaría visitar un faro.",
    [
      u("book", ["28", "euros", "encuadern", "cuaderno"], "fact"),
      u("lighthouse", ["visitar", "faro"]),
    ],
    [
      q("¿Cuánto pagué por encuadernar el cuaderno?", ["book"], ["28"]),
      q("¿Qué me gustaría visitar?", ["lighthouse"], ["faro"]),
    ],
  ),
  s(
    "j06",
    "independent",
    "Imagino una biblioteca que flota entre nubes. La taza esmaltada está en la repisa.",
    [
      u("idea", ["biblioteca", "flota", "nubes"], "thought"),
      u("cup", ["taza", "esmaltada", "repisa"], "fact"),
    ],
    [
      q("¿Cómo es la biblioteca que imagino?", ["idea"], ["flota", "nubes"]),
      q("¿Dónde está la taza esmaltada?", ["cup"], ["repisa"]),
    ],
  ),
  s(
    "j07",
    "shared",
    "Bajo el banco del patio dejé unas aletas y una bolsa de arena.",
    [
      u("fins", ["banco", "patio", "dej", "aletas"], "fact"),
      u("sand", ["banco", "patio", "dej", "bolsa", "arena"], "fact"),
    ],
    [
      q("¿Dónde dejé las aletas?", ["fins"], ["banco", "patio"]),
      q("¿Qué contiene la bolsa que dejé bajo el banco?", ["sand"], ["arena"]),
    ],
  ),
  s(
    "j08",
    "shared",
    "Mireya me dijo que quiere fabricar jabón y aprender encuadernación.",
    [
      u("soap", ["mireya", "fabricar", "jabon"], "quotation", undefined, {
        attribution: "mireya",
      }),
      u(
        "binding",
        ["mireya", "aprender", "encuadernacion"],
        "quotation",
        undefined,
        { attribution: "mireya" },
      ),
    ],
    [
      q("¿Qué quiere fabricar Mireya según me dijo?", ["soap"], ["jabon"]),
      q(
        "¿Qué quiere aprender Mireya según me dijo?",
        ["binding"],
        ["encuadernacion"],
      ),
    ],
  ),
  s(
    "j09",
    "shared",
    "Durante el encuentro del barrio intercambié una postal y regalé un llavero.",
    [
      u("postcard", ["encuentro", "barrio", "intercambi", "postal"], "fact"),
      u("gift", ["encuentro", "barrio", "regal", "llavero"], "fact"),
    ],
    [
      q(
        "¿Qué intercambié en el encuentro del barrio?",
        ["postcard"],
        ["postal"],
      ),
      q("¿Qué regalé en ese encuentro?", ["gift"], ["llavero"]),
    ],
  ),
  s(
    "j10",
    "shared",
    "El yogur de coco parece cremoso, pero todavía no lo he abierto.",
    [
      u("look", ["yogur", "coco", "cremoso"], "opinion"),
      u("open", ["yogur", "coco", "no", "abierto"], "fact", undefined, {
        polarity: "negative",
      }),
    ],
    [
      q(
        "¿Qué aspecto me parece que tiene el yogur de coco?",
        ["look"],
        ["cremoso"],
      ),
      q("¿He abierto el yogur de coco?", ["open"], ["no"]),
    ],
  ),
  s(
    "j11",
    "shared",
    "En el lateral de la mochila llevo un silbato naranja y un mapa plastificado.",
    [
      u("whistle", ["lateral", "mochila", "silbato", "naranja"], "fact"),
      u("map", ["lateral", "mochila", "mapa", "plastificado"], "fact"),
    ],
    [
      q("¿De qué color es el silbato de la mochila?", ["whistle"], ["naranja"]),
      q("¿En qué parte de la mochila llevo el mapa?", ["map"], ["lateral"]),
    ],
  ),
  s(
    "j12",
    "shared",
    "El 20 de abril de 2027 visitaré la salina. Para esa visita quiero llevar prismáticos.",
    [
      u("visit", ["visitar", "salina"], "intention", day("2027-04-20")),
      u(
        "optics",
        ["llevar", "prismaticos", "salina"],
        "intention",
        day("2027-04-20"),
      ),
    ],
    [
      q("¿Qué día visitaré la salina?", ["visit"], ["20", "abril"]),
      q(
        "¿Qué quiero llevar para la visita a la salina?",
        ["optics"],
        ["prismaticos"],
      ),
    ],
    {
      expectedRelations: [{ kind: "requires", from: "optics", to: "visit" }],
      forgetClosure: ["optics"],
      after: [
        q("¿Qué día visitaré la salina?", []),
        q("¿Qué quería llevar para la visita a la salina?", []),
      ],
    },
  ),
];
