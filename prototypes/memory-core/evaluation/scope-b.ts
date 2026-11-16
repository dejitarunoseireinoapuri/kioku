import { ask, scenario, unit, unknown } from "./case.ts";

export const scopeB = [
  scenario(
    "h13",
    "condition",
    "Si abren la sala nueva, quiero apuntarme a encuadernación. También quiero comprar un dedal.",
    [
      unit(
        "binding",
        ["apuntar", "encuadernacion", "sala", "nueva"],
        "intention",
        unknown,
        { condition: "abr" },
      ),
      unit("thimble", ["comprar", "dedal"]),
    ],
    [
      ask(
        "¿Con qué condición quiero apuntarme a encuadernación?",
        ["binding"],
        ["abr", "sala"],
      ),
      ask("¿Qué utensilio quiero comprar?", ["thimble"], ["dedal"]),
    ],
  ),
  scenario(
    "h14",
    "condition",
    "Cuando termine el mural, llevaré el caballete al trastero. Quiero limpiar los pinceles.",
    [
      unit(
        "easel",
        ["termine|terminar", "mural", "caballete", "trastero"],
        "intention",
        unknown,
        { condition: "termin" },
      ),
      unit("brushes", ["limpiar", "pinceles"]),
    ],
    [
      ask(
        "¿Cuándo llevaré el caballete al trastero?",
        ["easel"],
        ["termin", "mural"],
      ),
      ask("¿Qué quiero limpiar?", ["brushes"], ["pinceles"]),
    ],
  ),
  scenario(
    "h15",
    "condition",
    "Si no hay niebla, quiero subir al mirador; si la hay, visitaré el archivo. He comprado una brújula.",
    [
      unit("outing", ["niebla", "mirador", "archivo"], "intention", unknown, {
        condition: "niebla",
      }),
      unit("compass", ["comprado", "brujula"], "fact"),
    ],
    [
      ask("¿Qué haré si hay niebla?", ["outing"], ["archivo"]),
      ask("¿Qué he comprado para orientarme?", ["compass"], ["brujula"]),
    ],
  ),
  scenario(
    "h16",
    "condition",
    "No quiero alquilar el estudio si no reparan la ventana. Quiero buscar un garaje.",
    [
      unit("studio", ["alquilar", "estudio", "ventana"], "intention", unknown, {
        polarity: "negative",
        condition: "no.*repar.*ventana",
      }),
      unit("garage", ["buscar", "garaje"]),
    ],
    [
      ask(
        "¿Quiero alquilar el estudio si no reparan la ventana?",
        ["studio"],
        ["no"],
      ),
      ask("¿Qué quiero buscar?", ["garage"], ["garaje"]),
    ],
  ),
  scenario(
    "h17",
    "condition",
    "Solo si me presta el molde, prepararé el bizcocho de avellana. Quiero moler café.",
    [
      unit("cake", ["molde", "bizcocho", "avellana"], "intention", unknown, {
        condition: "prest.*molde",
      }),
      unit("coffee", ["moler", "cafe"]),
    ],
    [
      ask(
        "¿Qué necesito para preparar el bizcocho de avellana?",
        ["cake"],
        ["prest", "molde"],
      ),
      ask("¿Qué quiero moler?", ["coffee"], ["cafe"]),
    ],
  ),
  scenario(
    "h18",
    "condition",
    "Quiero enviar el grabado si la tinta se seca. Ya he embalado el marco.",
    [
      unit(
        "print",
        ["enviar", "grabado", "tinta", "sec"],
        "intention",
        unknown,
        { condition: "tinta.*sec" },
      ),
      unit("frame", ["embalado", "marco"], "fact"),
    ],
    [
      ask(
        "¿Qué condición tiene el envío del grabado?",
        ["print"],
        ["tinta", "sec"],
      ),
      ask("¿Qué he embalado?", ["frame"], ["marco"]),
    ],
  ),
  scenario(
    "h19",
    "attribution",
    "En el invernadero un letrero dice «No cortes las flores». Quiero fotografiar la fuente.",
    [
      unit(
        "sign",
        ["invernadero", "letrero", "cortes", "flores"],
        "quotation",
        unknown,
        { attribution: "letrero|invernadero", polarity: "negative" },
      ),
      unit("fountain", ["fotografiar", "fuente"]),
    ],
    [
      ask(
        "¿Qué prohíbe el letrero del invernadero?",
        ["sign"],
        ["no", "cort", "flores"],
      ),
      ask("¿Qué quiero fotografiar?", ["fountain"], ["fuente"]),
    ],
  ),
  scenario(
    "h20",
    "attribution",
    "El lema del festival es «Escucha despacio y mira lejos». He guardado su programa en la mochila.",
    [
      unit(
        "motto",
        ["lema", "festival", "escucha", "despacio", "mira", "lejos"],
        "quotation",
        unknown,
        { attribution: "festival|lema" },
      ),
      unit("program", ["programa", "festival", "mochila"], "fact"),
    ],
    [
      ask("¿Cuál es el lema del festival?", ["motto"], ["escucha", "lejos"]),
      ask("¿Dónde guardé el programa del festival?", ["program"], ["mochila"]),
    ],
  ),
  scenario(
    "h21",
    "attribution",
    "Mi entrenador quiere aprender japonés. La conserje me dijo que quiere aprender sueco.",
    [
      unit("coach", ["entrenador", "aprender", "japones"]),
      unit(
        "caretaker",
        ["conserje", "aprender", "sueco"],
        "quotation",
        unknown,
        { attribution: "conserje" },
      ),
    ],
    [
      ask("¿Qué idioma quiere aprender mi entrenador?", ["coach"], ["japones"]),
      ask(
        "¿Qué idioma me dijo la conserje que quiere aprender?",
        ["caretaker"],
        ["sueco"],
      ),
    ],
  ),
  scenario(
    "h22",
    "attribution",
    "En la etiqueta pone «Si no llueve, abre el toldo». En la caja pone «Conserva el embalaje».",
    [
      unit(
        "label",
        ["etiqueta", "llueve", "abre", "toldo"],
        "quotation",
        unknown,
        { attribution: "etiqueta", condition: "lluev" },
      ),
      unit("box", ["caja", "conserva", "embalaje"], "quotation", unknown, {
        attribution: "caja",
      }),
    ],
    [
      ask(
        "¿Qué condición indica la etiqueta para abrir el toldo?",
        ["label"],
        ["no", "lluev"],
      ),
      ask("¿Qué dice la caja sobre el embalaje?", ["box"], ["conserv"]),
    ],
  ),
  scenario(
    "h23",
    "attribution",
    "La profesora dijo que no le gusta el zumo de remolacha. A mí me encanta la sopa de lentejas.",
    [
      unit("juice", ["profesora", "zumo", "remolacha"], "quotation", unknown, {
        attribution: "profesora",
        polarity: "negative",
      }),
      unit("soup", ["sopa", "lentejas"], "opinion"),
    ],
    [
      ask("¿Le gusta a la profesora el zumo de remolacha?", ["juice"], ["no"]),
      ask("¿Qué sopa me encanta a mí?", ["soup"], ["lentejas"]),
    ],
  ),
  scenario(
    "h24",
    "attribution",
    "Mi prima escribió en una postal: «Prefiero caminos lentos». Quiero enmarcar una fotografía del puerto.",
    [
      unit(
        "postcard",
        ["prima", "postal", "prefier", "caminos", "lentos"],
        "quotation",
        unknown,
        { attribution: "prima|postal" },
      ),
      unit("photo", ["enmarcar", "fotografia", "puerto"]),
    ],
    [
      ask(
        "¿Qué escribió mi prima en la postal?",
        ["postcard"],
        ["caminos", "lentos"],
        {
          quotations: [
            {
              label: "postcard",
              literal: "Prefiero caminos lentos",
              introduction:
                "(?:tu|la) prima (?:escribio|anoto)(?: en (?:una|la) postal)?",
            },
          ],
        },
      ),
      ask("¿Qué fotografía quiero enmarcar?", ["photo"], ["puerto"]),
    ],
  ),
];
