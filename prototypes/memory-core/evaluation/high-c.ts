import { ask as q, scenario as s, unit as u, day, unknown } from "./case.ts";

export const highC = [
  s(
    "i25",
    "time",
    "Mañana recogeré una partitura en la copistería. Quiero comprar un atril plegable.",
    [
      u(
        "score",
        ["recoger", "partitura", "copisteria"],
        "intention",
        day("2026-07-16"),
      ),
      u("stand", ["comprar", "atril", "plegable"]),
    ],
    [
      q("¿Qué día recogeré la partitura?", ["score"], ["16"]),
      q("¿Qué tipo de atril quiero comprar?", ["stand"], ["plegable"]),
    ],
    { at: "2026-07-14T23:30:00Z" },
  ),
  s(
    "i26",
    "time",
    "El 21 de noviembre de 2026 asistiré a una muestra de marionetas. Ese mismo día devolveré un proyector.",
    [
      u("show", ["muestra", "marionetas"], "intention", day("2026-11-21")),
      u("projector", ["devolver", "proyector"], "intention", day("2026-11-21")),
    ],
    [
      q(
        "¿Cuándo asistiré a la muestra de marionetas?",
        ["show"],
        ["21", "noviembre"],
      ),
      q("¿Qué día devolveré el proyector?", ["projector"], ["21", "noviembre"]),
    ],
  ),
  s(
    "i27",
    "time",
    "Quiero hacer un curso de cestería en octubre de 2027. La aguja curva está en el neceser.",
    [
      u("course", ["curso", "cesteria"], "intention", {
        precision: "month",
        value: "2027-10",
        end: null,
      }),
      u("needle", ["aguja", "curva", "neceser"], "fact"),
    ],
    [
      q("¿En qué mes quiero hacer cestería?", ["course"], ["octubre", "2027"]),
      q("¿Qué día exacto empieza el curso?", [], [], {
        status: "not_found",
        contextLabels: ["course"],
      }),
      q("¿Dónde está la aguja curva?", ["needle"], ["neceser"]),
    ],
  ),
  s(
    "i28",
    "time",
    "Mi ahijada cumple años el 2 de septiembre. Quiero regalarle un caleidoscopio.",
    [
      u("birthday", ["ahijada", "cumple", "2", "septiembre"], "fact", {
        precision: "month_day",
        value: "--09-02",
        end: null,
      }),
      u("gift", ["regalar", "ahijada", "caleidoscopio"]),
    ],
    [
      q("¿Cuándo cumple años mi ahijada?", ["birthday"], ["2", "septiembre"]),
      q("¿Qué quiero regalar a mi ahijada?", ["gift"], ["caleidoscopio"]),
    ],
  ),
  s(
    "i29",
    "time",
    "Ayer terminé de esmaltar una bandeja. Mañana quiero esmaltar una jarra.",
    [
      u("tray", ["esmalt", "bandeja"], "fact", day("2026-07-12")),
      u("jug", ["esmaltar", "jarra"], "intention", day("2026-07-14")),
    ],
    [
      q("¿Qué terminé de esmaltar ayer?", ["tray"], ["bandeja"]),
      q("¿Qué quiero esmaltar mañana?", ["jug"], ["jarra"]),
    ],
    { at: "2026-07-14T01:30:00Z", zone: "America/Los_Angeles" },
  ),
  s(
    "i30",
    "time",
    "Quiero probar el torno el 6 de mayo de 2027. El guante térmico está en la balda alta.",
    [
      u("wheel", ["probar", "torno"], "intention", day("2027-05-06")),
      u("glove", ["guante", "termico", "balda", "alta"], "fact"),
    ],
    [
      q("¿Qué día quiero probar el torno?", ["wheel"], ["6", "mayo"]),
      q("¿Dónde está el guante térmico?", ["glove"], ["balda", "alta"]),
    ],
  ),
  s(
    "i31",
    "duplicate",
    "Tengo pendiente aprender encaje de bolillos. Quiero restaurar una veleta.",
    [u("lace", ["encaje", "bolillos"]), u("vane", ["restaurar", "veleta"])],
    [
      q(
        "¿Qué tipo de encaje tengo pendiente aprender?",
        ["lace"],
        ["bolillos"],
      ),
      q("¿Qué quiero restaurar?", ["vane"], ["veleta"]),
    ],
    {
      repeat: { text: "Sigo queriendo aprender encaje de bolillos.", count: 2 },
    },
  ),
  s(
    "i32",
    "duplicate",
    "Mi compañero Baltasar me dijo que quiere estudiar meteorología. Yo quiero aprender esmalte al fuego.",
    [
      u(
        "weather",
        ["baltasar", "estudiar", "meteorologia"],
        "quotation",
        unknown,
        { attribution: "baltasar|companero" },
      ),
      u("enamel", ["aprender", "esmalte", "fuego"]),
    ],
    [
      q(
        "¿Qué quiere estudiar Baltasar según me dijo?",
        ["weather"],
        ["meteorologia"],
      ),
      q("¿Qué técnica quiero aprender yo?", ["enamel"], ["esmalte", "fuego"]),
    ],
    {
      repeat: {
        text: "Baltasar me ha repetido que quiere estudiar meteorología.",
        count: 2,
      },
    },
  ),
  s(
    "i33",
    "duplicate",
    "Puse el abrecartas en el estuche granate. La lupa está sobre el aparador.",
    [
      u("opener", ["abrecartas", "estuche", "granate"], "fact"),
      u("lens", ["lupa", "aparador"], "fact"),
    ],
    [
      q("¿Dónde puse el abrecartas?", ["opener"], ["estuche", "granate"]),
      q("¿Dónde está la lupa?", ["lens"], ["aparador"]),
    ],
    {
      repeat: { text: "El abrecartas sigue en el estuche granate.", count: 2 },
    },
  ),
  s(
    "i34",
    "duplicate",
    "El sirope de lavanda no me gusta. Me encanta el zumo de granada.",
    [
      u("syrup", ["sirope", "lavanda"], "opinion", unknown, {
        polarity: "negative",
      }),
      u("juice", ["zumo", "granada"], "opinion"),
    ],
    [
      q("¿Me gusta el sirope de lavanda?", ["syrup"], ["no|desagrad|disgust"]),
      q("¿Qué zumo me encanta?", ["juice"], ["granada"]),
    ],
    { repeat: { text: "Sigue sin gustarme el sirope de lavanda.", count: 2 } },
  ),
  s(
    "i35",
    "duplicate",
    "El 17 de junio de 2027 tengo una clase de acordeón. Quiero cambiar las cuerdas de la guitarra.",
    [
      u("lesson", ["clase", "acordeon"], "intention", day("2027-06-17")),
      u("strings", ["cambiar", "cuerdas", "guitarra"]),
    ],
    [
      q("¿Cuándo tengo la clase de acordeón?", ["lesson"], ["17", "junio"]),
      q("¿Qué quiero cambiar de la guitarra?", ["strings"], ["cuerdas"]),
    ],
    {
      repeat: {
        text: "Sigue pendiente la clase de acordeón del 17 de junio de 2027.",
        count: 2,
      },
    },
  ),
  s(
    "i36",
    "duplicate",
    "Quiero ver el documental Islas de Cristal. He guardado una entrada en el tarjetero.",
    [
      u("film", ["documental", "islas", "cristal"]),
      u("ticket", ["entrada", "tarjetero"], "fact"),
    ],
    [
      q("¿Qué documental quiero ver?", ["film"], ["islas", "cristal"]),
      q("¿Dónde guardé la entrada?", ["ticket"], ["tarjetero"]),
    ],
    { repeat: { text: "Aún tengo pendiente Islas de Cristal.", count: 2 } },
  ),
];
