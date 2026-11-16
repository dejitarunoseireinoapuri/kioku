import { ask, day, scenario, unit } from "./case.ts";
export const holdoutC = [
  scenario(
    "v25",
    "time",
    "Ayer visité el museo del juguete.",
    [unit("museum", ["museo", "juguete"], "fact", day("2026-07-13"))],
    [
      ask("¿Qué museo visité ayer?", ["museum"], ["juguete"]),
      ask("¿Qué museo visité hoy?", [], [], { contextLabels: ["museum"] }),
    ],
  ),
  scenario(
    "v26",
    "time",
    "Mañana quiero hacer una ruta por las salinas.",
    [unit("route", ["ruta", "salinas"], "intention", day("2026-07-16"))],
    [
      ask("¿Qué día quiero hacer la ruta por las salinas?", ["route"], ["16"]),
      ask("¿Ya hice esa ruta?", [], [], {
        previous: "¿Qué día quiero hacer la ruta por las salinas?",
        contextLabels: ["route"],
      }),
    ],
    { at: "2026-07-14T23:15:00Z" },
  ),
  scenario(
    "v27",
    "time",
    "El mes que viene tengo un curso de astronomía.",
    [
      unit("course", ["astronomia"], "intention", {
        precision: "month",
        value: "2026-08",
        end: null,
      }),
    ],
    [
      ask("¿En qué mes tengo astronomía?", ["course"], ["agosto"]),
      ask("¿En qué día exacto empieza astronomía?", [], [], {
        contextLabels: ["course"],
      }),
    ],
  ),
  scenario(
    "v28",
    "time",
    "El cumpleaños de Saúl es el 6 de marzo.",
    [
      unit("birthday", ["saul", "cumple.?anos"], "fact", {
        precision: "month_day",
        value: "--03-06",
        end: null,
      }),
    ],
    [
      ask("¿Cuándo cumple años Saúl?", ["birthday"], ["6", "marzo"]),
      ask("¿En qué año nació Saúl?", [], [], { contextLabels: ["birthday"] }),
    ],
  ),
  scenario(
    "v29",
    "time",
    "Del 7 al 10 de octubre de 2026 quiero asistir al encuentro de marionetas.",
    [
      unit("meeting", ["marionetas"], "intention", {
        precision: "interval",
        value: "2026-10-07",
        end: "2026-10-10",
      }),
    ],
    [
      ask(
        "¿Qué fechas tiene el encuentro de marionetas?",
        ["meeting"],
        ["7", "10", "octubre"],
      ),
      ask("¿Ya asistí al encuentro de marionetas?", [], [], {
        contextLabels: ["meeting"],
      }),
    ],
  ),
  scenario(
    "v30",
    "time",
    "Mañana quiero fotografiar el amanecer desde el puente.",
    [unit("dawn", ["amanecer", "puente"], "intention", day("2026-10-25"))],
    [
      ask("¿Qué día quiero fotografiar el amanecer?", ["dawn"], ["25"]),
      ask("¿Desde dónde quiero fotografiarlo?", ["dawn"], ["puente"], {
        previous: "¿Qué día quiero fotografiar el amanecer?",
      }),
    ],
    { at: "2026-10-24T20:30:00Z" },
  ),
  scenario(
    "v31",
    "duplicate",
    "Guardé el manual de cerámica en el estante del despacho.",
    [unit("manual", ["manual", "ceramica", "estante", "despacho"], "fact")],
    [
      ask(
        "¿Dónde está el manual de cerámica?",
        ["manual"],
        ["estante", "despacho"],
      ),
      ask("¿En qué habitación está?", ["manual"], ["despacho"], {
        previous: "¿Dónde está el manual de cerámica?",
      }),
    ],
    {
      repeat: {
        text: "El manual de cerámica sigue en el estante del despacho.",
        count: 1,
      },
    },
  ),
  scenario(
    "v32",
    "duplicate",
    "Tengo pendiente leer la novela El tranvía de cristal.",
    [unit("novel", ["tranvia", "cristal"])],
    [
      ask(
        "¿Qué novela tengo pendiente leer?",
        ["novel"],
        ["tranvia", "cristal"],
      ),
      ask("¿Ya he leído El tranvía de cristal?", [], [], {
        contextLabels: ["novel"],
      }),
    ],
    {
      repeat: {
        text: "Sigo teniendo pendiente la novela El tranvía de cristal.",
        count: 1,
      },
    },
  ),
  scenario(
    "v33",
    "duplicate",
    "Me gusta el pan de algarroba.",
    [unit("bread", ["gusta", "algarroba"], "opinion")],
    [
      ask("¿Me gusta el pan de algarroba?", ["bread"], ["si|gusta"]),
      ask("¿Me gusta el pan de centeno?", []),
    ],
    { repeat: { text: "El pan de algarroba me gusta.", count: 1 } },
  ),
  scenario(
    "v34",
    "duplicate",
    "El 28 de julio de 2026 tengo cita con la podóloga.",
    [unit("appointment", ["podologa"], "intention", day("2026-07-28"))],
    [
      ask("¿Qué día tengo podóloga?", ["appointment"], ["28"]),
      ask("¿Ya fui a esa cita?", [], [], {
        previous: "¿Qué día tengo podóloga?",
        contextLabels: ["appointment"],
      }),
    ],
    {
      repeat: {
        text: "Mi cita con la podóloga es el 28 de julio de 2026.",
        count: 1,
      },
    },
  ),
  scenario(
    "v35",
    "duplicate",
    "Diana me dijo que recomienda la novela Mar de Ceniza.",
    [
      unit("advice", ["diana", "mar", "ceniza"], "quotation", undefined, {
        attribution: "diana",
      }),
    ],
    [
      ask("¿Qué novela me recomendó Diana?", ["advice"], ["mar", "ceniza"]),
      ask("¿He leído Mar de Ceniza?", [], [], { contextLabels: ["advice"] }),
    ],
    {
      repeat: { text: "Diana me recomendó la novela Mar de Ceniza.", count: 1 },
    },
  ),
  scenario(
    "v36",
    "duplicate",
    "Tengo la idea de un paraguas con una luz en el mango.",
    [unit("idea", ["paraguas", "luz", "mango"], "thought")],
    [
      ask("¿Qué idea tuve para un paraguas?", ["idea"], ["luz", "mango"]),
      ask("¿He fabricado ese paraguas?", [], [], {
        previous: "¿Qué idea tuve para un paraguas?",
        contextLabels: ["idea"],
      }),
    ],
    {
      repeat: {
        text: "Mi idea es un paraguas que lleve una luz en el mango.",
        count: 1,
      },
    },
  ),
];
