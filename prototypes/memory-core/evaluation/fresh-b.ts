import { ask, day, scenario, unit } from "./case.ts";
export const freshB = [
  scenario(
    "n13",
    "condition",
    "Si reparan el ascensor, mañana subiré al mirador del depósito.",
    [
      unit(
        "lookout",
        ["ascensor", "mirador", "deposito"],
        "intention",
        day("2026-07-15"),
        { condition: "repar.*ascensor" },
      ),
    ],
    [
      ask("¿De qué depende subir al mirador?", ["lookout"], ["ascensor"]),
      ask("¿Ya subí al mirador del depósito?", [], [], {
        contextLabels: ["lookout"],
      }),
    ],
  ),
  scenario(
    "n14",
    "condition",
    "Si hay plazas haré el taller de mosaicos; si se llena, aprenderé con un libro en casa.",
    [
      unit("options", ["plazas", "mosaicos", "libro"], "intention", undefined, {
        condition: "plazas|llena",
      }),
    ],
    [
      ask(
        "¿Qué haré si se llena el taller de mosaicos?",
        ["options"],
        ["libro"],
      ),
      ask("¿De qué depende hacer el taller?", ["options"], ["plazas"]),
    ],
  ),
  scenario(
    "n15",
    "condition",
    "Solo si no hace viento quiero estrenar el dron en la explanada.",
    [
      unit("drone", ["viento", "dron", "explanada"], "intention", undefined, {
        condition: "no.*viento",
      }),
    ],
    [
      ask("¿Cuándo me planteo estrenar el dron?", ["drone"], ["viento"]),
      ask("¿Dónde quiero estrenarlo?", ["drone"], ["explanada"], {
        previous: "¿Cuándo me planteo estrenar el dron?",
      }),
    ],
  ),
  scenario(
    "n16",
    "condition",
    "Si sigue costando 180 euros, no compraré el proyector.",
    [
      unit("projector", ["proyector", "180"], "intention", undefined, {
        condition: "180",
        polarity: "negative",
      }),
    ],
    [
      ask(
        "¿Con qué precio dije que no compraría el proyector?",
        ["projector"],
        ["180"],
      ),
      ask("¿He comprado ya el proyector?", [], [], {
        contextLabels: ["projector"],
      }),
    ],
  ),
  scenario(
    "n17",
    "condition",
    "Cuando termine de ordenar el archivo, quiero digitalizar las diapositivas.",
    [
      unit(
        "slides",
        ["archivo", "digitalizar", "diapositivas"],
        "intention",
        undefined,
        { condition: "ordenar|termine" },
      ),
    ],
    [
      ask(
        "¿Qué quiero hacer tras ordenar el archivo?",
        ["slides"],
        ["digitalizar", "diapositivas"],
      ),
      ask("¿He terminado de ordenar el archivo?", [], [], {
        contextLabels: ["slides"],
      }),
    ],
  ),
  scenario(
    "n18",
    "condition",
    "Si a Ivo le prestan el telescopio, observaremos Saturno el 2 de agosto de 2026.",
    [
      unit(
        "saturn",
        ["ivo", "telescopio", "saturno"],
        "intention",
        day("2026-08-02"),
        { condition: "prest.*telescopio" },
      ),
    ],
    [
      ask(
        "¿Qué necesitamos para observar Saturno?",
        ["saturn"],
        ["telescopio"],
      ),
      ask(
        "¿Qué día tenemos previsto observarlo?",
        ["saturn"],
        ["2", "agosto"],
        { previous: "¿Qué necesitamos para observar Saturno?" },
      ),
    ],
  ),
  scenario(
    "n19",
    "attribution",
    "Aina me contó que quiere estudiar grabado. Yo quiero estudiar restauración de muebles.",
    [
      unit("aina", ["aina", "grabado"], "quotation", undefined, {
        attribution: "aina",
      }),
      unit("self", ["restauracion", "muebles"]),
    ],
    [
      ask("¿Qué quiere estudiar Aina?", ["aina"], ["grabado"]),
      ask("¿Qué quiero estudiar yo?", ["self"], ["restauracion"]),
    ],
  ),
  scenario(
    "n20",
    "attribution",
    "Según mi hermana, la crema de castañas es deliciosa. Yo no la he probado aún.",
    [
      unit("sister", ["hermana", "castanas"], "quotation", undefined, {
        attribution: "hermana",
      }),
      unit("taste", ["no", "probado", "castanas"], "fact", undefined, {
        polarity: "negative",
      }),
    ],
    [
      ask(
        "¿Qué opina mi hermana de la crema de castañas?",
        ["sister"],
        ["deliciosa|gusta"],
      ),
      ask("¿He probado la crema de castañas?", ["taste"], ["no"]),
    ],
  ),
  scenario(
    "n21",
    "attribution",
    "El vigilante dijo que hay 62 asientos. Yo conté 59 y dudo de cuál es la cifra correcta.",
    [
      unit("guard", ["vigilante", "62"], "quotation", undefined, {
        attribution: "vigilante",
      }),
      unit("count", ["59", "dud|segur"], ["fact", "thought"]),
    ],
    [
      ask("¿Cuántos asientos dijo el vigilante que había?", ["guard"], ["62"]),
      ask("¿Cuántos asientos conté yo?", ["count"], ["59"]),
    ],
  ),
  scenario(
    "n22",
    "attribution",
    "Mi tutor me recomendó practicar sombras con carboncillo. A mí me apetece dibujar con tinta violeta.",
    [
      unit(
        "advice",
        ["tutor", "sombras", "carboncillo"],
        "quotation",
        undefined,
        { attribution: "tutor" },
      ),
      unit("ink", ["tinta", "violeta"]),
    ],
    [
      ask("¿Qué me recomendó mi tutor?", ["advice"], ["carboncillo"]),
      ask("¿Con qué me apetece dibujar?", ["ink"], ["tinta", "violeta"]),
    ],
  ),
  scenario(
    "n23",
    "attribution",
    "En el poema, la viajera dice «las piedras guardan canciones». Esa frase me inspiró una idea para una escultura.",
    [
      unit("quote", ["piedras", "canciones"], "quotation", undefined, {
        attribution: "viajera",
      }),
      unit("idea", ["idea", "escultura"], "fact"),
    ],
    [
      ask("¿Qué dice la viajera sobre las piedras?", ["quote"], ["canciones"]),
      ask("¿Para qué tuve una idea?", ["idea"], ["escultura"]),
    ],
  ),
  scenario(
    "n24",
    "attribution",
    "Noa me dijo que detesta la fragancia del cedro. A mí sí me gusta el cedro.",
    [
      unit("noa", ["noa", "cedro"], "quotation", undefined, {
        attribution: "noa",
        polarity: "negative",
      }),
      unit("self", ["gusta", "cedro"], "opinion"),
    ],
    [
      ask("¿Qué fragancia detesta Noa?", ["noa"], ["cedro"]),
      ask("¿Me gusta a mí el cedro?", ["self"], ["si|gusta"]),
    ],
  ),
];
