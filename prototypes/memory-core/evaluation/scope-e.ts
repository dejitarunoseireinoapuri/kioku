import { ask, scenario, unit } from "./case.ts";

export const scopeE = [
  scenario(
    "h49",
    "ambiguity",
    "Quiero pegar el flurón. Quiero arreglar el cerrojo.",
    [
      unit("flowers", ["pegar", "florero"]),
      unit("lock", ["arreglar", "cerrojo"]),
    ],
    [
      ask("¿Qué quiero pegar?", ["flowers"], ["florero"]),
      ask("¿Qué quiero arreglar?", ["lock"], ["cerrojo"]),
    ],
    { status: "clarify", clarification: "Por flurón quería decir florero." },
  ),
  scenario(
    "h50",
    "ambiguity",
    "Quieroir al taller de serigrafía. Tengo pendiente limpiar el terrario.",
    [
      unit("workshop", ["taller", "serigrafia"]),
      unit("terrarium", ["limpiar", "terrario"]),
    ],
    [
      ask("¿A qué taller quiero ir?", ["workshop"], ["serigrafia"]),
      ask("¿Qué tengo pendiente limpiar?", ["terrarium"], ["terrario"]),
    ],
  ),
  scenario(
    "h51",
    "ambiguity",
    "El 31 de abril de 2027 tengo visita al museo de autómatas. Quiero comprar un cuaderno de bocetos.",
    [
      unit("museum", ["visita", "museo", "automatas"], "intention", {
        precision: "day",
        value: "2027-04-30",
        end: null,
      }),
      unit("book", ["comprar", "cuaderno", "bocetos"]),
    ],
    [
      ask(
        "¿Qué día tengo la visita al museo de autómatas?",
        ["museum"],
        ["30", "abril"],
      ),
      ask("¿Qué cuaderno quiero comprar?", ["book"], ["bocetos"]),
    ],
    {
      status: "clarify",
      clarification:
        "La fecha correcta de la visita es el 30 de abril de 2027.",
      clarificationAt: "2026-07-17T18:00:00Z",
    },
  ),
  scenario(
    "h52",
    "ambiguity",
    "Mañana quiero reparar el blenque. Quiero cambiar la cinta de la persiana.",
    [
      unit("bench", ["reparar", "banco"], "intention", {
        precision: "day",
        value: "2026-07-15",
        end: null,
      }),
      unit("blind", ["cambiar", "cinta", "persiana"]),
    ],
    [
      ask("¿Qué día quiero reparar el banco?", ["bench"], ["15"]),
      ask("¿Qué quiero cambiar de la persiana?", ["blind"], ["cinta"]),
    ],
    {
      status: "clarify",
      clarification: "Con blenque me refería al banco.",
      clarificationAt: "2026-07-19T18:00:00Z",
    },
  ),
  scenario(
    "h53",
    "ambiguity",
    "Fui con mi padrastro a buscar a su hermano. Después lo llevé al puerto.",
    [
      unit("pickup", ["padrastro", "buscar", "hermano"], "fact"),
      unit("port", ["padrastro", "llev", "puerto"], "fact"),
    ],
    [
      ask("¿Con quién fui a buscar a su hermano?", ["pickup"], ["padrastro"]),
      ask("¿A quién llevé al puerto?", ["port"], ["padrastro"]),
    ],
    { status: "clarify", clarification: "Llevé al puerto a mi padrastro." },
  ),
  scenario(
    "h54",
    "ambiguity",
    "¿He hecho alguna vez un curso de ebanistería?",
    [],
    [
      ask("¿He hecho un curso de ebanistería?", [], [], {
        status: "not_found",
      }),
      ask("¿Qué curso de ebanistería he terminado?", [], [], {
        status: "not_found",
      }),
    ],
    { status: "no_memory" },
  ),
  scenario(
    "h55",
    "forget",
    "El cojín de lentejuelas me roza y por eso me desagrada. He guardado las mantas en el arcón.",
    [
      unit("cushion", ["cojin", "lentejuelas", "roza"], "opinion", undefined, {
        polarity: "negative",
      }),
      unit("blankets", ["mantas", "arcon"], "fact"),
    ],
    [
      ask(
        "¿Por qué me desagrada el cojín de lentejuelas?",
        ["cushion"],
        ["roza"],
      ),
      ask("¿Dónde guardé las mantas?", ["blankets"], ["arcon"]),
    ],
  ),
  scenario(
    "h56",
    "forget",
    "Tengo siete carretes de hilo en la cesta y dos en el escritorio.",
    [
      unit("basket", ["carretes", "hilo", "siete|7", "cesta"], "fact"),
      unit("desk", ["carretes", "hilo", "dos|2", "escritorio"], "fact"),
    ],
    [
      ask(
        "¿Cuántos carretes de hilo tengo en la cesta?",
        ["basket"],
        ["siete|7"],
      ),
      ask("¿Cuántos carretes tengo en el escritorio?", ["desk"], ["dos|2"]),
    ],
  ),
  scenario(
    "h57",
    "forget",
    "Quiero visitar el jardín de cactus, reparar el cierre de la pulsera y aprender mosaico romano.",
    [
      unit("garden", ["visitar", "jardin", "cactus"]),
      unit("bracelet", ["reparar", "cierre", "pulsera"]),
      unit("mosaic", ["aprender", "mosaico", "romano"]),
    ],
    [
      ask("¿Qué jardín quiero visitar?", ["garden"], ["cactus"]),
      ask("¿Qué quiero reparar de la pulsera?", ["bracelet"], ["cierre"]),
      ask("¿Qué tipo de mosaico quiero aprender?", ["mosaic"], ["romano"]),
    ],
    {
      forget: ["bracelet"],
      after: [
        ask("¿Qué quiero reparar de la pulsera?", [], [], {
          status: "not_found",
        }),
        ask("¿Qué jardín quiero visitar?", ["garden"], ["cactus"]),
        ask("¿Qué mosaico quiero aprender?", ["mosaic"], ["romano"]),
      ],
    },
  ),
  scenario(
    "h58",
    "forget",
    "La pancarta del encuentro dice «Cuida el agua y comparte la sombra». Tengo la acreditación en el bolsillo del chaleco.",
    [
      unit(
        "banner",
        ["pancarta", "encuentro", "cuida", "agua", "comparte", "sombra"],
        "quotation",
        undefined,
        { attribution: "pancarta|encuentro" },
      ),
      unit("badge", ["acreditacion", "bolsillo", "chaleco"], "fact"),
    ],
    [
      ask(
        "¿Qué dice la pancarta del encuentro?",
        ["banner"],
        ["agua", "sombra"],
      ),
      ask("¿Dónde está mi acreditación?", ["badge"], ["bolsillo", "chaleco"]),
    ],
  ),
  scenario(
    "h59",
    "forget",
    "Hoy quiero practicar caligrafía. Mañana quiero aprender una canción con el ukelele.",
    [
      unit("writing", ["practicar", "caligrafia"], "intention", {
        precision: "day",
        value: "2026-07-14",
        end: null,
      }),
      unit("music", ["aprender", "cancion", "ukelele"], "intention", {
        precision: "day",
        value: "2026-07-15",
        end: null,
      }),
    ],
    [
      ask("¿Qué quiero practicar hoy?", ["writing"], ["caligrafia"]),
      ask("¿Y qué quiero aprender mañana?", ["music"], ["cancion", "ukelele"], {
        previous: "¿Qué quiero practicar hoy?",
      }),
    ],
  ),
  scenario(
    "h60",
    "forget",
    "He comprado un sello de lacre. Quiero escribir una carta a Damián.",
    [
      unit("seal", ["comprado", "sello", "lacre"], "fact"),
      unit("letter", ["escribir", "carta", "damian"]),
    ],
    [
      ask("¿Qué sello he comprado?", ["seal"], ["lacre"]),
      ask("¿A quién quiero escribir una carta?", ["letter"], ["damian"]),
    ],
    {
      forget: ["seal", "letter"],
      after: [
        ask("¿Qué sello he comprado?", [], [], { status: "not_found" }),
        ask("¿A quién quiero escribir?", [], [], { status: "not_found" }),
      ],
    },
  ),
];
