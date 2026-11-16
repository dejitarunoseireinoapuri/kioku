import { ask, scenario, unit, unknown } from "./case.ts";

export const groupingCondition = [
  scenario(
    "g13",
    "condition",
    "Si deja de hacer viento, quiero estrenar la cometa. Tengo que comprar cuerda para el tendedero.",
    [
      unit("kite", ["viento", "estrenar", "cometa"], "intention", unknown, {
        condition: "deja|viento",
      }),
      unit("rope", ["comprar", "cuerda", "tendedero"]),
    ],
    [
      ask("¿Cuándo quiero estrenar la cometa?", ["kite"], ["viento"]),
      ask("¿Para qué tengo que comprar cuerda?", ["rope"], ["tendedero"]),
    ],
  ),
  scenario(
    "g14",
    "condition",
    "Si el faro abre, quiero subir; si está cerrado, pasearé por el espigón.",
    [
      unit(
        "outing",
        ["faro", "subir", "cerrado", "espigon"],
        "intention",
        unknown,
        { condition: "faro|abre" },
      ),
    ],
    [
      ask("¿Qué quiero hacer si abre el faro?", ["outing"], ["subir"]),
      ask("¿Qué haré si el faro está cerrado?", ["outing"], ["espigon"]),
    ],
  ),
  scenario(
    "g15",
    "condition",
    "Quiero encargar las cortinas cuando mida la ventana. He dejado la cinta métrica en el escritorio.",
    [
      unit(
        "curtains",
        ["encargar", "cortinas", "ventana"],
        "intention",
        unknown,
        { condition: "mid|ventana" },
      ),
      unit("tape", ["cinta", "metrica", "escritorio"], "fact"),
    ],
    [
      ask(
        "¿Qué tiene que pasar antes de encargar las cortinas?",
        ["curtains"],
        ["med|mid", "ventana"],
      ),
      ask("¿Dónde está la cinta métrica?", ["tape"], ["escritorio"]),
    ],
  ),
  scenario(
    "g16",
    "condition",
    "Mi hermana quiere adoptar un galgo si le permiten llevarlo al trabajo. Yo quiero visitar una protectora.",
    [
      unit(
        "dog",
        ["hermana", "adoptar", "galgo", "trabajo"],
        "intention",
        unknown,
        { condition: "permit|trabajo" },
      ),
      unit("shelter", ["visitar", "protectora"]),
    ],
    [
      ask(
        "¿Qué condición tiene mi hermana para adoptar un galgo?",
        ["dog"],
        ["trabajo"],
      ),
      ask("¿Qué lugar quiero visitar yo?", ["shelter"], ["protectora"]),
    ],
  ),
  scenario(
    "g17",
    "condition",
    "No quiero barnizar la mesa si sigue húmeda. Quiero cambiar los tiradores del armario.",
    [
      unit("table", ["barnizar", "mesa", "humeda"], "intention", unknown, {
        condition: "humed",
        polarity: "negative",
      }),
      unit("handles", ["cambiar", "tiradores", "armario"]),
    ],
    [
      ask("¿Cuándo no quiero barnizar la mesa?", ["table"], ["humeda"]),
      ask("¿Qué quiero cambiar del armario?", ["handles"], ["tiradores"]),
    ],
  ),
  scenario(
    "g18",
    "condition",
    "Si consigo entradas, iré al festival de títeres. He comprado una libreta cuadriculada.",
    [
      unit(
        "festival",
        ["entradas", "festival", "titeres"],
        "intention",
        unknown,
        { condition: "consig|entradas" },
      ),
      unit("notebook", ["comprado", "libreta", "cuadriculada"], "fact"),
    ],
    [
      ask(
        "¿Qué necesito para ir al festival de títeres?",
        ["festival"],
        ["entradas"],
      ),
      ask("¿Qué tipo de libreta he comprado?", ["notebook"], ["cuadriculada"]),
    ],
  ),
];
