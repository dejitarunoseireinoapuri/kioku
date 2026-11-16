import { ask, day, scenario, unit } from "./case.ts";
// Development examples. Never report these as reserved evaluation cases.
export const tuning = [
  scenario(
    "dev01",
    "independent",
    "Quiero pasear por el muelle hoy y montar un puzzle mañana.",
    [
      unit("walk", ["pasear", "muelle"], "intention", day("2026-07-14")),
      unit("puzzle", ["puzzle"], "intention", day("2026-07-15")),
    ],
    [
      ask("¿Qué quiero hacer hoy?", ["walk"], ["muelle"]),
      ask("¿Qué quiero hacer mañana?", ["puzzle"], ["puzzle"]),
    ],
  ),
  scenario(
    "dev02",
    "shared",
    "En mi visita a Lina, compré acuarelas y reservé un taller de cerámica.",
    [
      unit("paint", ["compre", "acuarelas"], "fact"),
      unit("class", ["reserv", "ceramica"], "fact"),
    ],
    [
      ask("¿Qué compré al visitar a Lina?", ["paint"], ["acuarelas"]),
      ask("¿Qué taller reservé?", ["class"], ["ceramica"]),
    ],
  ),
  scenario(
    "dev03",
    "condition",
    "Si no hay niebla, mañana quiero observar aves en el delta.",
    [
      unit(
        "birds",
        ["aves", "delta", "niebla"],
        "intention",
        day("2026-07-15"),
        { condition: "niebla" },
      ),
    ],
    [
      ask("¿De qué depende que vaya al delta?", ["birds"], ["niebla"]),
      ask("¿Ya he ido a observar aves?", [], [], {
        status: "not_found",
        contextLabels: ["birds"],
        forbidden: ["^(si[, ]+)?ya (has ido|fuiste)"],
      }),
    ],
  ),
  scenario(
    "dev04",
    "attribution",
    "Berta dice que el helado de sésamo le encanta, pero a mí no me gusta.",
    [
      unit("berta", ["berta", "sesamo"], "quotation", undefined, {
        attribution: "berta",
      }),
      unit("self", ["no", "sesamo"], "opinion", undefined, {
        polarity: "negative",
      }),
    ],
    [
      ask("¿A quién le gusta el helado de sésamo?", ["berta"], ["berta"]),
      ask("¿Me gusta a mí ese helado?", ["self"], ["no"]),
    ],
  ),
  scenario(
    "dev05",
    "time",
    "Mañana llevo la bici al taller.",
    [unit("bike", ["bici", "taller"], "intention", day("2026-07-16"))],
    [
      ask("¿Qué día llevo la bici?", ["bike"], ["16|manana"]),
      ask("¿La he llevado ya?", [], [], {
        status: "not_found",
        contextLabels: ["bike"],
        previous: "¿Qué día llevo la bici?",
        forbidden: ["^(si[, ]+)?ya (has llevado|la llevaste)"],
      }),
    ],
    { at: "2026-07-14T23:30:00Z" },
  ),
  scenario(
    "dev06",
    "duplicate",
    "Quiero ver la película Órbita de Papel el 18 de julio de 2026.",
    [unit("film", ["orbita", "papel"], "intention", day("2026-07-18"))],
    [
      ask("¿Qué película tengo pendiente?", ["film"], ["orbita"]),
      ask("¿Para cuándo es?", ["film"], ["18"], {
        previous: "¿Qué película tengo pendiente?",
      }),
    ],
    {
      repeat: {
        text: "El 18 de julio de 2026 tengo pensado ver Órbita de Papel.",
        count: 1,
      },
    },
  ),
  scenario(
    "dev07",
    "similar",
    "El lunes 13 de julio de 2026 nadé en el lago. El miércoles 15 de julio de 2026 quiero nadar en la piscina.",
    [
      unit("lake", ["nade", "lago"], "fact", day("2026-07-13")),
      unit("pool", ["piscina"], "intention", day("2026-07-15")),
    ],
    [
      ask("¿Dónde nadé el lunes?", ["lake"], ["lago"]),
      ask("¿Dónde quiero nadar el miércoles?", ["pool"], ["piscina"]),
    ],
  ),
  scenario(
    "dev08",
    "correction",
    "El 20 de julio de 2026 quiero cenar en Albahaca.",
    [unit("dinner", ["albahaca"], "intention", day("2026-07-20"))],
    [
      ask("¿Dónde quiero cenar?", ["dinner"], ["albahaca"]),
      ask("¿Qué día es la cena?", ["dinner"], ["20"]),
    ],
    {
      correction: {
        label: "dinner",
        text: "Me equivoqué de nombre: en Azafrán, no en Albahaca.",
        expected: unit("dinner", ["azafran"], "intention", day("2026-07-20"), {
          forbidden: ["albahaca"],
        }),
        query: ask(
          "¿Dónde y cuándo quiero cenar?",
          ["dinner"],
          ["azafran", "20"],
          { forbidden: ["albahaca"] },
        ),
      },
    },
  ),
  scenario(
    "dev09",
    "ambiguity",
    "Quiero remary pntar.",
    [
      unit("row", ["remar"], "intention"),
      unit("paint", ["pintar"], "intention"),
    ],
    [
      ask("¿Quiero remar?", ["row"], ["remar"]),
      ask("¿Quiero pintar?", ["paint"], ["pintar"]),
    ],
    {
      status: "clarify",
      clarification: "Quiero remar y también pintar cuadros.",
    },
  ),
  scenario(
    "dev10",
    "forget",
    "He comprado un cuaderno azul de 120 páginas y un lápiz de carbón blando.",
    [
      unit("book", ["cuaderno", "azul", "120"], "fact"),
      unit("pencil", ["lapiz", "carbon", "blando"], "fact"),
    ],
    [
      ask("¿Cómo es el cuaderno que compré?", ["book"], ["azul", "120"]),
      ask("¿Qué lápiz compré?", ["pencil"], ["carbon", "blando"]),
    ],
  ),
  scenario(
    "dev11",
    "ambiguity",
    "¿Qué instrumento quiero aprender?",
    [],
    [
      ask("¿Qué instrumento quiero aprender?", [], [], { status: "not_found" }),
      ask("¿He elegido ya un instrumento?", [], [], { status: "not_found" }),
    ],
    { status: "no_memory" },
  ),
  scenario(
    "dev12",
    "correction",
    "Antes me gustaba el regaliz; ahora prefiero el mazapán.",
    [
      unit("old", ["regaliz"], "opinion"),
      unit("now", ["mazapan"], "opinion", day("2026-07-14")),
    ],
    [
      ask("¿Qué me gustaba antes?", ["old"], ["regaliz"]),
      ask("¿Qué prefiero ahora?", ["now"], ["mazapan"]),
    ],
  ),
];
