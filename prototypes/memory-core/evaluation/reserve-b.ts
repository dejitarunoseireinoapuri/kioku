import { ask, day, scenario, unit } from "./case.ts";
export const reserveB = [
  scenario(
    "r19",
    "attribution",
    "Dalia me contó que quiere aprender esgrima, y yo quiero aprender tapiz.",
    [
      unit("dalia", ["dalia", "esgrima"], "quotation", undefined, {
        attribution: "dalia",
      }),
      unit("tapestry", ["tapiz"]),
    ],
    [
      ask("¿Qué quiere aprender Dalia?", ["dalia"], ["esgrima"]),
      ask("¿Qué quiero aprender yo?", ["tapestry"], ["tapiz"]),
    ],
  ),
  scenario(
    "r20",
    "attribution",
    "Según mi primo, la sopa de chirivía es buenísima. Yo todavía no la he probado.",
    [
      unit("cousin", ["primo", "chirivia"], "quotation", undefined, {
        attribution: "primo",
      }),
      unit("self", ["no", "probado", "chirivia"], "fact", undefined, {
        polarity: "negative",
      }),
    ],
    [
      ask(
        "¿Qué opina mi primo de la sopa?",
        ["cousin"],
        ["buenisima|gusta|buena"],
      ),
      ask("¿He probado la sopa de chirivía?", ["self"], ["no"]),
    ],
  ),
  scenario(
    "r21",
    "attribution",
    "La guía dijo que la torre tiene 87 escalones. Yo conté 84, así que no estoy seguro de la cifra.",
    [
      unit("guide", ["guia", "87"], "quotation", undefined, {
        attribution: "guia",
      }),
      unit("count", ["84", "seguro|duda"], ["fact", "thought"]),
    ],
    [
      ask("¿Cuántos escalones dijo la guía?", ["guide"], ["87"]),
      ask("¿Cuántos conté yo?", ["count"], ["84"]),
    ],
  ),
  scenario(
    "r22",
    "attribution",
    "Roc me recomendó el libro Jardines de Humo, aunque a mí me apetece leer Mapas de Sal.",
    [
      unit(
        "recommend",
        ["roc", "jardines", "humo"],
        ["fact", "quotation"],
        undefined,
        { attribution: "roc" },
      ),
      unit("read", ["mapas", "sal"]),
    ],
    [
      ask("¿Qué libro recomendó Roc?", ["recommend"], ["jardines", "humo"]),
      ask("¿Cuál me apetece leer?", ["read"], ["mapas", "sal"]),
    ],
  ),
  scenario(
    "r23",
    "attribution",
    "Mi profesora opina que debería practicar escalas lentas. A mí me gustaría improvisar jazz.",
    [
      unit(
        "teacher",
        ["profesora", "escalas", "lentas"],
        "quotation",
        undefined,
        { attribution: "profesora" },
      ),
      unit("jazz", ["improvisar", "jazz"]),
    ],
    [
      ask("¿Qué recomienda mi profesora?", ["teacher"], ["escalas", "lentas"]),
      ask("¿Qué quiero hacer yo con la música?", ["jazz"], ["jazz"]),
    ],
  ),
  scenario(
    "r24",
    "attribution",
    "En la novela que leí, el narrador dice «el mar recuerda todo». La frase me dio una idea para un mural.",
    [
      unit("quote", ["mar", "recuerda", "todo"], "quotation", undefined, {
        attribution: "narrador",
      }),
      unit("mural", ["mural", "idea"], "thought"),
    ],
    [
      ask(
        "¿Qué decía el narrador sobre el mar?",
        ["quote"],
        ["recuerda", "todo"],
      ),
      ask("¿Para qué me dio una idea esa frase?", ["mural"], ["mural"]),
    ],
  ),
  scenario(
    "r25",
    "time",
    "Mañana tengo ensayo de percusión.",
    [unit("drums", ["ensayo", "percusion"], "intention", day("2026-07-16"))],
    [
      ask("¿Qué fecha es el ensayo de percusión?", ["drums"], ["16"]),
      ask("¿Qué tengo mañana?", ["drums"], ["percusion"]),
    ],
    { at: "2026-07-14T23:45:00Z" },
  ),
  scenario(
    "r26",
    "time",
    "Ayer visité el invernadero tropical.",
    [
      unit(
        "greenhouse",
        ["invernadero", "tropical"],
        "fact",
        day("2026-07-12"),
      ),
    ],
    [
      ask("¿Qué fecha visité el invernadero?", ["greenhouse"], ["12"]),
      ask("¿Qué vi ayer?", ["greenhouse"], ["invernadero"]),
    ],
    { at: "2026-07-14T01:10:00Z", zone: "America/Los_Angeles" },
  ),
  scenario(
    "r27",
    "time",
    "En septiembre de 2026 quiero hacer un curso de encuadernación.",
    [
      unit("binding", ["encuadernacion"], "intention", {
        precision: "month",
        value: "2026-09",
        end: null,
      }),
    ],
    [
      ask(
        "¿En qué mes quiero hacer encuadernación?",
        ["binding"],
        ["septiembre|09"],
      ),
      ask(
        "¿Qué curso quiero hacer en septiembre?",
        ["binding"],
        ["encuadernacion"],
      ),
    ],
  ),
  scenario(
    "r28",
    "time",
    "El cumpleaños de mi ahijada es el 29 de febrero.",
    [
      unit("birthday", ["ahijada", "29", "febrero"], "fact", {
        precision: "month_day",
        value: "--02-29",
        end: null,
      }),
    ],
    [
      ask("¿Cuándo cumple años mi ahijada?", ["birthday"], ["29", "febrero"]),
      ask(
        "¿De quién es el cumpleaños del 29 de febrero?",
        ["birthday"],
        ["ahijada"],
      ),
    ],
  ),
  scenario(
    "r29",
    "time",
    "Estaré en Sierra Bruma del 2 al 5 de agosto de 2026.",
    [
      unit("trip", ["sierra bruma"], "intention", {
        precision: "interval",
        value: "2026-08-02",
        end: "2026-08-05",
      }),
    ],
    [
      ask("¿Qué días estaré en Sierra Bruma?", ["trip"], ["2", "5", "agosto"]),
      ask("¿Dónde estaré el 3 de agosto?", ["trip"], ["sierra bruma"]),
    ],
  ),
  scenario(
    "r30",
    "time",
    "Mañana quiero fotografiar el amanecer en el embalse.",
    [unit("dawn", ["amanecer", "embalse"], "intention", day("2026-03-30"))],
    [
      ask("¿Qué día quiero fotografiar el amanecer?", ["dawn"], ["30"]),
      ask("¿Dónde quiero hacer las fotos mañana?", ["dawn"], ["embalse"]),
    ],
    { at: "2026-03-28T23:30:00Z", zone: "Europe/Madrid" },
  ),
  scenario(
    "r31",
    "duplicate",
    "El 22 de julio de 2026 quiero ver el documental Bosques de Cristal.",
    [unit("doc", ["bosques", "cristal"], "intention", day("2026-07-22"))],
    [
      ask("¿Qué documental tengo pendiente?", ["doc"], ["bosques", "cristal"]),
      ask("¿Cuándo lo quiero ver?", ["doc"], ["22"], {
        previous: "¿Qué documental tengo pendiente?",
      }),
    ],
    {
      repeat: {
        text: "Tengo pendiente Bosques de Cristal para el 22 de julio de 2026.",
        count: 1,
      },
    },
  ),
  scenario(
    "r32",
    "duplicate",
    "Guardé el cargador portátil en el bolsillo interior de la mochila gris.",
    [unit("charger", ["cargador", "interior", "mochila", "gris"], "fact")],
    [
      ask(
        "¿Dónde está el cargador portátil?",
        ["charger"],
        ["interior", "gris"],
      ),
      ask(
        "¿De qué color es la mochila donde dejé el cargador?",
        ["charger"],
        ["gris"],
      ),
    ],
    {
      repeat: {
        text: "El cargador portátil lo dejé dentro del bolsillo interior de mi mochila gris.",
        count: 1,
      },
    },
  ),
  scenario(
    "r33",
    "duplicate",
    "No me gusta la mermelada de higo porque me resulta demasiado dulce.",
    [
      unit("jam", ["higo", "dulce"], "opinion", undefined, {
        polarity: "negative",
      }),
    ],
    [
      ask("¿Me gusta la mermelada de higo?", ["jam"], ["no"]),
      ask("¿Por qué no me gusta?", ["jam"], ["dulce"], {
        previous: "¿Me gusta la mermelada de higo?",
      }),
    ],
    {
      repeat: {
        text: "La mermelada de higo no me agrada: me parece excesivamente dulce.",
        count: 1,
      },
    },
  ),
  scenario(
    "r34",
    "duplicate",
    "Mi cita en la óptica será el 24 de julio de 2026.",
    [unit("optician", ["optica"], "intention", day("2026-07-24"))],
    [
      ask("¿Cuándo tengo cita en la óptica?", ["optician"], ["24"]),
      ask("¿Qué cita tengo el día 24?", ["optician"], ["optica"]),
    ],
    {
      repeat: {
        text: "El 24 de julio de 2026 tengo la cita de la óptica.",
        count: 1,
      },
    },
  ),
  scenario(
    "r35",
    "duplicate",
    "Si termino la maqueta, quiero presentarla al concurso local.",
    [
      unit("model", ["maqueta", "concurso", "local"], "intention", undefined, {
        condition: "termin",
      }),
    ],
    [
      ask(
        "¿Qué quiero hacer con la maqueta si la termino?",
        ["model"],
        ["concurso"],
      ),
      ask(
        "¿De qué depende participar en el concurso?",
        ["model"],
        ["termin", "maqueta"],
      ),
    ],
    {
      repeat: {
        text: "Quiero llevar la maqueta al concurso local, pero solo si la acabo.",
        count: 1,
      },
    },
  ),
  scenario(
    "r36",
    "duplicate",
    "Sira me dijo que detesta el olor del anís.",
    [
      unit("anise", ["sira", "anis"], "quotation", undefined, {
        attribution: "sira",
        polarity: "negative",
      }),
    ],
    [
      ask("¿A quién no le gusta el olor del anís?", ["anise"], ["sira"]),
      ask("¿Qué olor detesta Sira?", ["anise"], ["anis"]),
    ],
    {
      repeat: {
        text: "Según me contó Sira, no soporta cómo huele el anís.",
        count: 1,
      },
    },
  ),
];
