import { ask, day, scenario, unit, unknown } from "./case.ts";

export const groupingDuplicate = [
  scenario(
    "g31",
    "duplicate",
    "Quiero visitar las salinas de Añana. Quiero escribir un haiku sobre la niebla.",
    [
      unit("salt", ["visitar", "salinas", "anana"]),
      unit("poem", ["escribir", "haiku", "niebla"]),
    ],
    [
      ask("¿Qué salinas quiero visitar?", ["salt"], ["anana"]),
      ask("¿Sobre qué quiero escribir un haiku?", ["poem"], ["niebla"]),
    ],
    {
      repeat: {
        text: "Tengo pendiente la visita a las salinas de Añana.",
        count: 2,
      },
    },
  ),
  scenario(
    "g32",
    "duplicate",
    "El mando del proyector está en el cajón inferior. El manual está sobre la impresora.",
    [
      unit("remote", ["mando", "proyector", "cajon", "inferior"], "fact"),
      unit("manual", ["manual", "impresora"], "fact"),
    ],
    [
      ask(
        "¿Dónde está el mando del proyector?",
        ["remote"],
        ["cajon", "inferior"],
      ),
      ask("¿Dónde está el manual?", ["manual"], ["impresora"]),
    ],
    {
      repeat: {
        text: "El mando del proyector sigue en el cajón inferior.",
        count: 2,
      },
    },
  ),
  scenario(
    "g33",
    "duplicate",
    "No me gusta el refresco de pepino. Me encanta la infusión de hibisco.",
    [
      unit("soda", ["refresco", "pepino"], "opinion", unknown, {
        polarity: "negative",
      }),
      unit("tea", ["infusion", "hibisco"], "opinion"),
    ],
    [
      ask("¿Me gusta el refresco de pepino?", ["soda"], ["no", "gusta"]),
      ask("¿Qué infusión me encanta?", ["tea"], ["hibisco"]),
    ],
    { repeat: { text: "El refresco de pepino me desagrada.", count: 2 } },
  ),
  scenario(
    "g34",
    "duplicate",
    "Tengo pendiente el documental Mareas Invisibles. Quiero arreglar el cierre de la mochila.",
    [
      unit("documentary", ["documental", "mareas", "invisibles"]),
      unit("zip", ["arreglar", "cierre", "mochila"]),
    ],
    [
      ask(
        "¿Qué documental tengo pendiente?",
        ["documentary"],
        ["mareas", "invisibles"],
      ),
      ask("¿Qué tengo que arreglar de la mochila?", ["zip"], ["cierre"]),
    ],
    {
      repeat: { text: "Todavía tengo pendiente Mareas Invisibles.", count: 2 },
    },
  ),
  scenario(
    "g35",
    "duplicate",
    "El 21 de agosto de 2026 tengo visita al planetario. Quiero renovar el pasaporte.",
    [
      unit(
        "planetarium",
        ["visita", "planetario"],
        "intention",
        day("2026-08-21"),
      ),
      unit("passport", ["renovar", "pasaporte"]),
    ],
    [
      ask(
        "¿Cuándo tengo la visita al planetario?",
        ["planetarium"],
        ["21", "agosto"],
      ),
      ask("¿Qué documento quiero renovar?", ["passport"], ["pasaporte"]),
    ],
    {
      repeat: {
        text: "La visita al planetario sigue prevista para el 21 de agosto de 2026.",
        count: 2,
      },
    },
  ),
  scenario(
    "g36",
    "duplicate",
    "Olimpia me dijo que quiere aprender alfarería. Yo quiero restaurar una radio antigua.",
    [
      unit(
        "pottery",
        ["olimpia", "aprender", "alfareria"],
        "quotation",
        unknown,
        { attribution: "olimpia" },
      ),
      unit("radio", ["restaurar", "radio", "antigua"]),
    ],
    [
      ask(
        "¿Qué quiere aprender Olimpia según me contó?",
        ["pottery"],
        ["alfareria"],
      ),
      ask("¿Qué aparato quiero restaurar?", ["radio"], ["radio"]),
    ],
    {
      repeat: {
        text: "Olimpia volvió a decirme que quiere aprender alfarería.",
        count: 2,
      },
    },
  ),
];
