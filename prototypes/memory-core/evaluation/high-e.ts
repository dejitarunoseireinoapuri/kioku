import { ask as q, scenario as s, unit as u, day } from "./case.ts";

export const highE = [
  s(
    "i49",
    "ambiguity",
    "Quiero limpiar el trómbulo. También quiero encolar una silla.",
    [u("trombone", ["limpiar", "trombon"]), u("chair", ["encolar", "silla"])],
    [
      q("¿Qué instrumento quiero limpiar?", ["trombone"], ["trombon"]),
      q("¿Qué quiero hacer con la silla?", ["chair"], ["encolar"]),
    ],
    { status: "clarify", clarification: "Con trómbulo me refería al trombón." },
  ),
  s(
    "i50",
    "ambiguity",
    "Quieroaprender a hacer vitrales. Tengo pendiente ordenar las acuarelas.",
    [
      u("glass", ["aprender", "vitrales"]),
      u("paint", ["ordenar", "acuarelas"]),
    ],
    [
      q("¿Qué quiero aprender a hacer?", ["glass"], ["vitrales"]),
      q("¿Qué tengo pendiente ordenar?", ["paint"], ["acuarelas"]),
    ],
  ),
  s(
    "i51",
    "ambiguity",
    "El 30 de febrero de 2027 tengo una visita a la fábrica de vidrio. Quiero comprar un cortador circular.",
    [
      u(
        "visit",
        ["visita", "fabrica", "vidrio"],
        "intention",
        day("2027-02-28"),
      ),
      u("cutter", ["comprar", "cortador", "circular"]),
    ],
    [
      q(
        "¿Cuándo tengo la visita a la fábrica de vidrio?",
        ["visit"],
        ["28", "febrero"],
      ),
      q("¿Qué cortador quiero comprar?", ["cutter"], ["circular"]),
    ],
    {
      status: "clarify",
      clarification: "La visita será el 28 de febrero de 2027.",
      clarificationAt: "2026-07-18T18:00:00Z",
    },
  ),
  s(
    "i52",
    "ambiguity",
    "Mañana quiero llevar el drunco al taller. La lima está junto al taladro.",
    [
      u(
        "trunk",
        ["llevar", "tronco", "taller"],
        "intention",
        day("2026-07-15"),
      ),
      u("file", ["lima", "taladro"], "fact"),
    ],
    [
      q("¿Qué día quiero llevar el tronco al taller?", ["trunk"], ["15"]),
      q("¿Dónde está la lima?", ["file"], ["taladro"]),
    ],
    {
      status: "clarify",
      clarification: "Drunco era tronco.",
      clarificationAt: "2026-07-20T18:00:00Z",
    },
  ),
  s(
    "i53",
    "ambiguity",
    "Fui con mi madrina a recoger a su sobrina. Luego la acompañé a la estación.",
    [
      u("pickup", ["madrina", "recoger", "sobrina"], "fact"),
      u("station", ["madrina", "acompan", "estacion"], "fact", undefined, {
        forbidden: ["recoger", "sobrina"],
      }),
    ],
    [
      q("¿Con quién fui a recoger a su sobrina?", ["pickup"], ["madrina"]),
      q("¿A quién acompañé a la estación?", ["station"], ["madrina"]),
    ],
    {
      status: "clarify",
      clarification: "Acompañé a la estación a mi madrina.",
    },
  ),
  s(
    "i54",
    "ambiguity",
    "¿Alguna vez he construido un terrario para escarabajos?",
    [],
    [
      q("¿He construido un terrario para escarabajos?", []),
      q("¿Qué terrario he construido?", []),
    ],
    { status: "no_memory" },
  ),
  s(
    "i55",
    "forget",
    "El abrigo de fieltro me pica y por eso no me gusta. El sombrero está en la percha del pasillo.",
    [
      u("coat", ["abrigo", "fieltro", "pica"], "opinion", undefined, {
        polarity: "negative",
      }),
      u("hat", ["sombrero", "percha", "pasillo"], "fact"),
    ],
    [
      q("¿Por qué no me gusta el abrigo de fieltro?", ["coat"], ["pica"]),
      q("¿Dónde está el sombrero?", ["hat"], ["percha", "pasillo"]),
    ],
  ),
  s(
    "i56",
    "forget",
    "He dejado nueve sobres en la bandeja y cinco en el archivador.",
    [
      u("tray", ["sobres", "nueve|9", "bandeja"], "fact", undefined, {
        evidenceTerms: ["dejado"],
      }),
      u("file", ["sobres", "cinco|5", "archivador"], "fact", undefined, {
        evidenceTerms: ["dejado"],
      }),
    ],
    [
      q("¿Cuántos sobres dejé en la bandeja?", ["tray"], ["nueve|9"]),
      q("¿Cuántos sobres dejé en el archivador?", ["file"], ["cinco|5"]),
    ],
  ),
  s(
    "i57",
    "forget",
    "Quiero recorrer el sendero de los alcornoques, arreglar el asa de una maleta y aprender a hacer papel jaspeado.",
    [
      u("path", ["recorrer", "sendero", "alcornoques"]),
      u("handle", ["arreglar", "asa", "maleta"]),
      u("paper", ["aprender", "papel", "jaspeado"]),
    ],
    [
      q("¿Qué sendero quiero recorrer?", ["path"], ["alcornoques"]),
      q("¿Qué quiero arreglar de la maleta?", ["handle"], ["asa"]),
      q("¿Qué papel quiero aprender a hacer?", ["paper"], ["jaspeado"]),
    ],
    {
      forget: ["handle"],
      after: [
        q("¿Qué quiero arreglar de la maleta?", []),
        q("¿Qué sendero quiero recorrer?", ["path"], ["alcornoques"]),
        q("¿Qué papel quiero aprender a hacer?", ["paper"], ["jaspeado"]),
      ],
    },
  ),
  s(
    "i58",
    "forget",
    "La postal de la exposición dice «Mira despacio y escucha el color». Dejé la acreditación dentro del catálogo.",
    [
      u(
        "postcard",
        ["postal", "mira", "despacio", "escucha", "color"],
        "quotation",
        undefined,
        { attribution: "postal|exposicion" },
      ),
      u("badge", ["acreditacion", "catalogo"], "fact"),
    ],
    [
      q(
        "¿Qué dice la postal de la exposición?",
        ["postcard"],
        ["despacio", "color"],
      ),
      q("¿Dónde dejé la acreditación?", ["badge"], ["catalogo"]),
    ],
  ),
  s(
    "i59",
    "forget",
    "Hoy quiero repasar los nudos marineros. Mañana quiero practicar con la ocarina.",
    [
      u(
        "knots",
        ["repasar", "nudos", "marineros"],
        "intention",
        day("2026-07-14"),
      ),
      u("music", ["practicar", "ocarina"], "intention", day("2026-07-15")),
    ],
    [
      q("¿Qué quiero repasar hoy?", ["knots"], ["nudos"]),
      q("¿Y qué quiero practicar mañana?", ["music"], ["ocarina"], {
        previous: "¿Qué quiero repasar hoy?",
      }),
    ],
  ),
  s(
    "i60",
    "forget",
    "He comprado un punzón de hueso. Quiero grabar una hebilla con la inicial de Ramiro.",
    [
      u("awl", ["comprado", "punzon", "hueso"], "fact"),
      u("buckle", ["grabar", "hebilla", "inicial", "ramiro"]),
    ],
    [
      q("¿De qué material es el punzón que compré?", ["awl"], ["hueso"]),
      q(
        "¿Qué inicial quiero grabar en la hebilla?",
        ["buckle"],
        ["ramiro|\\br\\b"],
      ),
    ],
    {
      forget: ["awl", "buckle"],
      after: [
        q("¿Qué punzón compré?", []),
        q("¿Qué quiero grabar en la hebilla?", []),
      ],
    },
  ),
];
