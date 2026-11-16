import { ask, day, scenario, unit } from "./case.ts";
export const finalDuplicate = [
  scenario(
    "f31",
    "duplicate",
    "Tengo pendiente leer Luces del Pantano, una novela. Quiero comprar una funda para el lector.",
    [
      unit("novel", ["luces del pantano", "novela"]),
      unit("cover", ["funda", "lector"]),
    ],
    [
      ask("¿Qué novela tengo pendiente?", ["novel"], ["luces del pantano"]),
      ask("¿Qué quiero comprar para el lector?", ["cover"], ["funda"]),
    ],
    {
      repeat: {
        text: "La novela que sigo queriendo leer es Luces del Pantano.",
        count: 2,
      },
    },
  ),
  scenario(
    "f32",
    "duplicate",
    "Guardé el candado plateado en el cajón de las herramientas. Mi casco está en la cesta de la bicicleta.",
    [
      unit("lock", ["candado", "plateado", "cajon", "herramientas"], "fact"),
      unit("helmet", ["casco", "cesta", "bicicleta"], "fact"),
    ],
    [
      ask(
        "¿Dónde está el candado plateado?",
        ["lock"],
        ["cajon", "herramientas"],
      ),
      ask("¿Dónde está mi casco?", ["helmet"], ["cesta", "bicicleta"]),
    ],
    {
      repeat: {
        text: "El candado plateado sigue en el cajón de las herramientas.",
        count: 2,
      },
    },
  ),
  scenario(
    "f33",
    "duplicate",
    "No me gusta el olor a anís. Me gustan las velas de lavanda.",
    [
      unit("anise", ["anis"], "opinion", undefined, { polarity: "negative" }),
      unit("lavender", ["velas", "lavanda"], "opinion"),
    ],
    [
      ask("¿Me gusta el olor a anís?", ["anise"], ["no"]),
      ask("¿Qué velas me gustan?", ["lavender"], ["lavanda"]),
    ],
    { repeat: { text: "El olor a anís no me gusta.", count: 2 } },
  ),
  scenario(
    "f34",
    "duplicate",
    "Bernardo me dijo que el taller de mosaico admite 16 alumnos. Yo quiero visitar la biblioteca del puerto.",
    [
      unit(
        "workshop",
        ["bernardo", "mosaico", "16", "alumnos"],
        "quotation",
        undefined,
        { attribution: "bernardo" },
      ),
      unit("library", ["biblioteca", "puerto"]),
    ],
    [
      ask(
        "¿Cuántos alumnos admite el taller según Bernardo?",
        ["workshop"],
        ["16"],
      ),
      ask("¿Qué biblioteca quiero visitar?", ["library"], ["puerto"]),
    ],
    {
      repeat: {
        text: "Lo que me dijo Bernardo del taller de mosaico era que admite 16 alumnos.",
        count: 2,
      },
    },
  ),
  scenario(
    "f35",
    "duplicate",
    "El 22 de agosto de 2026 tengo una cita con la óptica. Quiero reparar la cremallera del abrigo.",
    [
      unit("optician", ["cita", "optica"], "intention", day("2026-08-22")),
      unit("zip", ["cremallera", "abrigo"]),
    ],
    [
      ask("¿Cuándo tengo cita con la óptica?", ["optician"], ["22", "agosto"]),
      ask("¿Qué cremallera quiero reparar?", ["zip"], ["abrigo"]),
    ],
    {
      repeat: {
        text: "La cita con la óptica es el 22 de agosto de 2026.",
        count: 2,
      },
    },
  ),
  scenario(
    "f36",
    "duplicate",
    "El 3 de julio de 2026 entregué las fotos del castillo a Celia. Quiero ordenar los negativos.",
    [
      unit("photos", ["fotos", "castillo", "celia"], "fact", day("2026-07-03")),
      unit("negatives", ["ordenar", "negativos"]),
    ],
    [
      ask(
        "¿A quién entregué las fotos del castillo el 3 de julio?",
        ["photos"],
        ["celia"],
      ),
      ask("¿Qué quiero ordenar?", ["negatives"], ["negativos"]),
    ],
    {
      repeat: {
        text: "Las fotos del castillo se las entregué a Celia el 3 de julio de 2026.",
        count: 2,
      },
    },
  ),
];
