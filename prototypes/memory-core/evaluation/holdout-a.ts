import { ask, day, scenario, unit } from "./case.ts";
export const holdoutA = [
  scenario(
    "v01",
    "independent",
    "Quiero construir una cometa hexagonal. También tengo ganas de aprender caligrafía coreana.",
    [
      unit("kite", ["cometa", "hexagonal"]),
      unit("writing", ["caligrafia", "coreana"]),
    ],
    [
      ask("¿Qué forma quiero darle a la cometa?", ["kite"], ["hexagonal"]),
      ask("¿Qué tipo de caligrafía quiero aprender?", ["writing"], ["coreana"]),
    ],
  ),
  scenario(
    "v02",
    "independent",
    "Dejé la brújula en el cajón del recibidor. La manta de lana está en el sofá.",
    [
      unit("compass", ["brujula", "cajon", "recibidor"], "fact"),
      unit("blanket", ["manta", "lana", "sofa"], "fact"),
    ],
    [
      ask("¿Dónde dejé la brújula?", ["compass"], ["cajon", "recibidor"]),
      ask("¿Dónde está la manta de lana?", ["blanket"], ["sofa"]),
    ],
  ),
  scenario(
    "v03",
    "independent",
    "No me gusta la bebida de avena. Tengo pendiente escuchar el disco Nubes de Cobre.",
    [
      unit("drink", ["avena"], "opinion", undefined, { polarity: "negative" }),
      unit("album", ["nubes", "cobre"]),
    ],
    [
      ask("¿Me gusta la bebida de avena?", ["drink"], ["no"]),
      ask("¿Qué disco tengo pendiente?", ["album"], ["nubes", "cobre"]),
    ],
  ),
  scenario(
    "v04",
    "independent",
    "He comprado un flexo articulado. Me gustaría diseñar una lámpara de papel.",
    [
      unit("purchase", ["flexo", "articulado"], "fact"),
      unit("design", ["lampara", "papel"]),
    ],
    [
      ask("¿Qué flexo compré?", ["purchase"], ["articulado"]),
      ask("¿De qué quiero hacer una lámpara?", ["design"], ["papel"]),
    ],
  ),
  scenario(
    "v05",
    "independent",
    "El 12 de septiembre de 2026 tengo un taller de percusión. El 19 de septiembre de 2026 quiero visitar un faro.",
    [
      unit("workshop", ["percusion"], "intention", day("2026-09-12")),
      unit("lighthouse", ["faro"], "intention", day("2026-09-19")),
    ],
    [
      ask("¿Qué día tengo percusión?", ["workshop"], ["12"]),
      ask("¿Qué día quiero visitar el faro?", ["lighthouse"], ["19"]),
    ],
  ),
  scenario(
    "v06",
    "independent",
    "Se me ha ocurrido una mochila con panel solar flexible. Quiero aprender a reparar cremalleras.",
    [
      unit("idea", ["mochila", "solar", "flexible"], "thought"),
      unit("learn", ["reparar", "cremalleras"]),
    ],
    [
      ask(
        "¿Cómo era mi idea para una mochila?",
        ["idea"],
        ["solar", "flexible"],
      ),
      ask("¿Qué quiero aprender a reparar?", ["learn"], ["cremalleras"]),
    ],
  ),
  scenario(
    "v07",
    "shared",
    "En el centro cultural quiero aprender serigrafía y practicar encuadernación japonesa.",
    [
      unit("print", ["centro", "cultural", "serigrafia"]),
      unit("bind", ["centro", "cultural", "encuadernacion", "japonesa"]),
    ],
    [
      ask(
        "¿Dónde quiero aprender serigrafía?",
        ["print"],
        ["centro", "cultural"],
      ),
      ask("¿Qué encuadernación quiero practicar?", ["bind"], ["japonesa"]),
    ],
  ),
  scenario(
    "v08",
    "shared",
    "Con Lucía quiero fabricar un terrario y cocinar una lasaña de espinacas.",
    [
      unit("terrarium", ["lucia", "terrario"]),
      unit("lasagna", ["lucia", "lasana", "espinacas"]),
    ],
    [
      ask("¿Con quién quiero fabricar el terrario?", ["terrarium"], ["lucia"]),
      ask("¿Qué lasaña quiero cocinar con Lucía?", ["lasagna"], ["espinacas"]),
    ],
  ),
  scenario(
    "v09",
    "shared",
    "En la exposición vi una máscara de bronce y compré un catálogo naranja.",
    [
      unit("mask", ["exposicion", "mascara", "bronce"], "fact"),
      unit("catalog", ["exposicion", "catalogo", "naranja"], "fact"),
    ],
    [
      ask("¿De qué era la máscara que vi?", ["mask"], ["bronce"]),
      ask(
        "¿Qué compré en la exposición?",
        ["catalog"],
        ["catalogo", "naranja"],
      ),
    ],
  ),
  scenario(
    "v10",
    "shared",
    "Mi tía Celia me contó que quiere aprender italiano y viajar a Palermo.",
    [
      unit("language", ["celia", "italiano"], "quotation", undefined, {
        attribution: "celia",
      }),
      unit("trip", ["celia", "palermo"], "quotation", undefined, {
        attribution: "celia",
      }),
    ],
    [
      ask(
        "¿Qué idioma quiere aprender mi tía Celia?",
        ["language"],
        ["italiano"],
      ),
      ask("¿A qué ciudad quiere viajar?", ["trip"], ["palermo"], {
        previous: "¿Qué idioma quiere aprender mi tía Celia?",
      }),
    ],
  ),
  scenario(
    "v11",
    "shared",
    "El sábado 18 de julio de 2026 quiero podar el limonero y pintar la barandilla.",
    [
      unit("tree", ["podar", "limonero"], "intention", day("2026-07-18")),
      unit("rail", ["pintar", "barandilla"], "intention", day("2026-07-18")),
    ],
    [
      ask("¿Qué día quiero podar el limonero?", ["tree"], ["18"]),
      ask("¿Qué día quiero pintar la barandilla?", ["rail"], ["18"]),
    ],
  ),
  scenario(
    "v12",
    "shared",
    "Guardé tres ovillos en la cesta y dejé otros dos ovillos en la mesa.",
    [
      unit("basket", ["tres|3", "ovillos", "cesta"], "fact"),
      unit("table", ["dos|2", "ovillos", "mesa"], "fact"),
    ],
    [
      ask("¿Cuántos ovillos guardé en la cesta?", ["basket"], ["tres|3"]),
      ask("¿Cuántos ovillos hay en la mesa?", ["table"], ["dos|2"]),
    ],
  ),
];
