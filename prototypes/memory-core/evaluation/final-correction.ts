import { ask, day, scenario, unit } from "./case.ts";
export const finalCorrection = [
  scenario(
    "f43",
    "correction",
    "La estantería del taller mide 138 centímetros de ancho. Quiero comprar una alfombrilla de corte.",
    [
      unit(
        "shelf",
        ["estanteria", "taller", "138", "centimetros", "ancho"],
        "fact",
      ),
      unit("mat", ["alfombrilla", "corte"]),
    ],
    [
      ask(
        "¿Cuánto mide de ancho la estantería del taller?",
        ["shelf"],
        ["138"],
      ),
      ask("¿Qué alfombrilla quiero comprar?", ["mat"], ["corte"]),
    ],
    {
      correction: {
        label: "shelf",
        text: "La medida de la estantería estaba mal: son 142 centímetros de ancho, no 138.",
        expected: unit(
          "shelf",
          ["estanteria", "taller", "142", "centimetros", "ancho"],
          "fact",
          undefined,
          { forbidden: ["138"] },
        ),
        query: ask(
          "¿Cuánto mide la estantería y dónde está?",
          ["shelf"],
          ["142", "taller"],
          { forbidden: ["138"] },
        ),
      },
    },
  ),
  scenario(
    "f44",
    "correction",
    "He acordado con Elvira restaurar el banco del patio. Quiero teñir una camiseta.",
    [
      unit("agreement", ["elvira", "restaurar", "banco", "patio"], "fact"),
      unit("shirt", ["tenir", "camiseta"]),
    ],
    [
      ask("¿Con quién acordé restaurar el banco?", ["agreement"], ["elvira"]),
      ask("¿Qué prenda quiero teñir?", ["shirt"], ["camiseta"]),
    ],
    {
      correction: {
        label: "agreement",
        text: "Me equivoqué de nombre: el acuerdo fue con Jacinta, no con Elvira.",
        expected: unit(
          "agreement",
          ["jacinta", "restaurar", "banco", "patio"],
          "fact",
          undefined,
          { forbidden: ["elvira"] },
        ),
        query: ask(
          "¿Con quién acordé restaurar qué banco?",
          ["agreement"],
          ["jacinta", "banco", "patio"],
          { forbidden: ["elvira"] },
        ),
      },
    },
  ),
  scenario(
    "f45",
    "correction",
    "El 12 de noviembre de 2026 tengo un taller de caligrafía. Quiero comprar papel de arroz.",
    [
      unit(
        "workshop",
        ["taller", "caligrafia"],
        "intention",
        day("2026-11-12"),
      ),
      unit("paper", ["papel", "arroz"]),
    ],
    [
      ask(
        "¿Cuándo tengo el taller de caligrafía?",
        ["workshop"],
        ["12", "noviembre"],
      ),
      ask("¿Qué papel quiero comprar?", ["paper"], ["arroz"]),
    ],
    {
      correction: {
        label: "workshop",
        text: "Anoté mal la fecha del taller de caligrafía: será el 18 de noviembre de 2026, no el 12.",
        expected: unit(
          "workshop",
          ["taller", "caligrafia"],
          "intention",
          day("2026-11-18"),
          { forbidden: ["12"] },
        ),
        query: ask(
          "¿Qué día es el taller de caligrafía?",
          ["workshop"],
          ["18", "noviembre"],
          { forbidden: ["12"] },
        ),
      },
    },
  ),
  scenario(
    "f46",
    "correction",
    "Guardé una caja de terciopelo gris en el baúl del dormitorio. Quiero limpiar los prismáticos.",
    [
      unit("box", ["caja", "terciopelo", "gris", "baul", "dormitorio"], "fact"),
      unit("binoculars", ["limpiar", "prismaticos"]),
    ],
    [
      ask("¿De qué color era la caja del baúl?", ["box"], ["gris"]),
      ask("¿Qué quiero limpiar?", ["binoculars"], ["prismaticos"]),
    ],
    {
      correction: {
        label: "box",
        text: "El color de la caja lo dije mal: es añil, no gris.",
        expected: unit(
          "box",
          ["caja", "terciopelo", "anil", "baul", "dormitorio"],
          "fact",
          undefined,
          { forbidden: ["gris"] },
        ),
        query: ask(
          "¿Cómo es la caja y dónde la guardé?",
          ["box"],
          ["terciopelo", "anil", "baul", "dormitorio"],
          { forbidden: ["gris"] },
        ),
      },
    },
  ),
  scenario(
    "f47",
    "correction",
    "La organizadora me dijo que quedan 24 plazas para la excursión al molino. Quiero arreglar mi impermeable.",
    [
      unit(
        "places",
        ["organizadora", "24", "plazas", "excursion", "molino"],
        "quotation",
        undefined,
        { attribution: "organizadora" },
      ),
      unit("coat", ["arreglar", "impermeable"]),
    ],
    [
      ask(
        "¿Cuántas plazas dijo la organizadora que quedaban?",
        ["places"],
        ["24"],
      ),
      ask("¿Qué prenda quiero arreglar?", ["coat"], ["impermeable"]),
    ],
    {
      correction: {
        label: "places",
        text: "Apunté mal la cifra: la organizadora dijo que quedaban 28 plazas, no 24.",
        expected: unit(
          "places",
          ["organizadora", "28", "plazas", "excursion", "molino"],
          "quotation",
          undefined,
          { attribution: "organizadora", forbidden: ["24"] },
        ),
        query: ask(
          "¿Cuántas plazas dijo que quedaban y para qué excursión?",
          ["places"],
          ["28", "molino"],
          { forbidden: ["24"] },
        ),
      },
    },
  ),
  scenario(
    "f48",
    "correction",
    "Antes me gustaba más el pan de centeno; ahora prefiero el pan de espelta.",
    [
      unit("before", ["antes", "centeno"], "opinion"),
      unit("now", ["ahora", "espelta"], "opinion"),
    ],
    [
      ask("¿Qué pan me gustaba más antes?", ["before"], ["centeno"]),
      ask("¿Qué pan prefiero ahora?", ["now"], ["espelta"]),
    ],
    { expectedRelations: [{ kind: "evolvesFrom", from: "now", to: "before" }] },
  ),
];
