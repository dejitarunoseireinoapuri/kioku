import { ask, day, scenario, unit } from "./case.ts";
// New reserved stories: never supplied as examples to the model.
export const freshA = [
  scenario(
    "n01",
    "independent",
    "Mañana quiero barnizar la estantería pequeña. Hoy anoté el número 318 de mi casillero.",
    [
      unit("shelf", ["barnizar", "estanteria"], "intention", day("2026-07-15")),
      unit("locker", ["318", "casillero"], "fact", day("2026-07-14")),
    ],
    [
      ask("¿Qué quiero barnizar mañana?", ["shelf"], ["estanteria"]),
      ask("¿Qué número tiene mi casillero?", ["locker"], ["318"]),
    ],
  ),
  scenario(
    "n02",
    "independent",
    "Me gustaría visitar la exposición de autómatas. Dejé el billete del tranvía debajo del reloj de pared.",
    [
      unit("expo", ["exposicion", "automatas"]),
      unit("ticket", ["billete", "tranvia", "reloj"], "fact"),
    ],
    [
      ask("¿Qué exposición me gustaría visitar?", ["expo"], ["automatas"]),
      ask("¿Dónde está el billete del tranvía?", ["ticket"], ["reloj"]),
    ],
  ),
  scenario(
    "n03",
    "independent",
    "Anoche probé una galleta de romero que me pareció salada. Tengo pendiente coser un botón a la chaqueta beige.",
    [
      unit(
        "taste",
        ["galleta", "romero", "salada"],
        "opinion",
        day("2026-07-13"),
      ),
      unit("button", ["boton", "chaqueta", "beige"]),
    ],
    [
      ask("¿Qué me pareció la galleta de romero?", ["taste"], ["salada"]),
      ask("¿Qué tengo pendiente con la chaqueta beige?", ["button"], ["boton"]),
    ],
  ),
  scenario(
    "n04",
    "independent",
    "Se me ocurrió un juego de cartas sobre minerales. Compré una regla de aluminio de treinta centímetros.",
    [
      unit("idea", ["juego", "cartas", "minerales"], "thought"),
      unit("ruler", ["regla", "aluminio", "treinta|30"], "fact"),
    ],
    [
      ask("¿Sobre qué sería mi juego de cartas?", ["idea"], ["minerales"]),
      ask("¿Cuánto mide la regla que compré?", ["ruler"], ["treinta|30"]),
    ],
  ),
  scenario(
    "n05",
    "independent",
    "El 19 de julio de 2026 tengo una revisión del audífono. El 27 de julio de 2026 quiero aprender a hacer velas.",
    [
      unit("check", ["audifono"], "intention", day("2026-07-19")),
      unit("candles", ["velas"], "intention", day("2026-07-27")),
    ],
    [
      ask("¿Cuándo tengo la revisión del audífono?", ["check"], ["19"]),
      ask("¿Qué quiero aprender el 27 de julio?", ["candles"], ["velas"]),
    ],
  ),
  scenario(
    "n06",
    "independent",
    "Pedí dos rollos de hilo encerado y guardé el recibo detrás de la foto del velero.",
    [
      unit("thread", ["dos|2", "hilo", "encerado"], "fact"),
      unit("receipt", ["recibo", "foto", "velero"], "fact"),
    ],
    [
      ask("¿Cuántos rollos de hilo encerado pedí?", ["thread"], ["dos|2"]),
      ask("¿Dónde guardé el recibo?", ["receipt"], ["foto", "velero"]),
    ],
  ),
  scenario(
    "n07",
    "shared",
    "En la feria de Rocaluz probé sidra seca y compré una jarra de estaño.",
    [
      unit("drink", ["rocaluz", "sidra", "seca"], "fact"),
      unit("jug", ["rocaluz", "jarra", "estano"], "fact"),
    ],
    [
      ask("¿Qué bebida probé en Rocaluz?", ["drink"], ["sidra"]),
      ask("¿Qué compré en esa feria?", ["jug"], ["jarra"], {
        previous: "¿Qué bebida probé en Rocaluz?",
      }),
    ],
  ),
  scenario(
    "n08",
    "shared",
    "Durante el curso de Nerea, aprendí a lijar bambú y reservé una sesión de lacado.",
    [
      unit("skill", ["nerea", "lijar", "bambu"], "fact"),
      unit("booking", ["nerea", "reserv", "lacado"], "fact"),
    ],
    [
      ask("¿Qué aprendí en el curso de Nerea?", ["skill"], ["bambu"]),
      ask("¿Qué sesión reservé en ese curso?", ["booking"], ["lacado"], {
        previous: "¿Qué aprendí en el curso de Nerea?",
      }),
    ],
  ),
  scenario(
    "n09",
    "shared",
    "El domingo 12 de julio de 2026, en Puerto Cobre, fotografié un molino y alquilé una bicicleta plegable.",
    [
      unit("photo", ["puerto cobre", "molino"], "fact", day("2026-07-12")),
      unit(
        "rental",
        ["puerto cobre", "bicicleta", "plegable"],
        "fact",
        day("2026-07-12"),
      ),
    ],
    [
      ask("¿Qué fotografié en Puerto Cobre?", ["photo"], ["molino"]),
      ask(
        "¿Qué alquilé allí el 12 de julio?",
        ["rental"],
        ["bicicleta", "plegable"],
        { previous: "¿Qué fotografié en Puerto Cobre?" },
      ),
    ],
  ),
  scenario(
    "n10",
    "shared",
    "Con mi tía, en el paseo de los álamos, recogí piñas y dibujé una fuente circular.",
    [
      unit("cones", ["tia", "alamos", "pinas"], "fact"),
      unit("drawing", ["tia", "alamos", "fuente", "circular"], "fact"),
    ],
    [
      ask("¿Qué recogí con mi tía?", ["cones"], ["pinas"]),
      ask("¿Qué dibujé en el paseo de los álamos?", ["drawing"], ["fuente"]),
    ],
  ),
  scenario(
    "n11",
    "shared",
    "Para mi maqueta del puerto quiero comprar cartón gris y también pintar dos grúas amarillas.",
    [
      unit("card", ["maqueta", "puerto", "carton", "gris"]),
      unit("cranes", ["maqueta", "puerto", "gruas", "amarillas"]),
    ],
    [
      ask(
        "¿Qué cartón necesito para la maqueta del puerto?",
        ["card"],
        ["gris"],
      ),
      ask("¿De qué color quiero pintar sus grúas?", ["cranes"], ["amarill"], {
        previous: "¿Qué cartón necesito para la maqueta del puerto?",
      }),
    ],
  ),
  scenario(
    "n12",
    "shared",
    "En casa de Celia reparé una bisagra y medí una cortina de 140 centímetros.",
    [
      unit("hinge", ["celia", "bisagra"], "fact"),
      unit("curtain", ["celia", "cortina", "140"], "fact"),
    ],
    [
      ask("¿Qué reparé en casa de Celia?", ["hinge"], ["bisagra"]),
      ask("¿Cuánto medía la cortina de Celia?", ["curtain"], ["140"]),
    ],
  ),
];
