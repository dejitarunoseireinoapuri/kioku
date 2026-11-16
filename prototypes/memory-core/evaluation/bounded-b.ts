import { ask as q, scenario as s, unit as u } from "./case.ts";

export const boundedB = [
  s(
    "j13",
    "condition",
    "Si consigo cartulina impermeable, construiré una cometa. Tengo pendiente limpiar el clarinete.",
    [
      u(
        "kite",
        ["cartulina", "impermeable", "construir", "cometa"],
        "intention",
        undefined,
        { condition: "(?:consig|consegu).*cartulina.*impermeable" },
      ),
      u("clarinet", ["limpiar", "clarinete"]),
    ],
    [
      q(
        "¿Qué necesito conseguir para construir la cometa?",
        ["kite"],
        ["cartulina", "impermeable"],
      ),
      q(
        "¿Qué instrumento tengo pendiente limpiar?",
        ["clarinet"],
        ["clarinete"],
      ),
    ],
  ),
  s(
    "j14",
    "condition",
    "Cuando Berta repare la prensa imprimiré las invitaciones. Quiero esmaltar una jabonera.",
    [
      u(
        "print",
        ["berta", "prensa", "imprimir", "invitaciones"],
        "intention",
        undefined,
        { condition: "(?:berta.*repar|repar.*prensa)" },
      ),
      u("dish", ["esmaltar", "jabonera"]),
    ],
    [
      q(
        "¿Qué tiene que pasar para que imprima las invitaciones?",
        ["print"],
        ["berta", "prensa"],
      ),
      q("¿Qué quiero esmaltar?", ["dish"], ["jabonera"]),
    ],
  ),
  s(
    "j15",
    "condition",
    "Si no llueve, estrenaré las botas de senderismo. No quiero teñir mi bufanda.",
    [
      u(
        "boots",
        ["no", "lluev|llov", "estrenar", "botas"],
        "intention",
        undefined,
        { condition: "no.*(?:lluev|llov)" },
      ),
      u("scarf", ["tenir", "bufanda"], "intention", undefined, {
        polarity: "negative",
      }),
    ],
    [
      q(
        "¿Con qué condición estrenaré las botas?",
        ["boots"],
        ["no", "lluev|llov"],
      ),
      q("¿Quiero teñir mi bufanda?", ["scarf"], ["no"]),
    ],
  ),
  s(
    "j16",
    "condition",
    "No quiero barnizar la mesa mientras haya humedad. Me gustaría hacer una maqueta de tranvía.",
    [
      u("table", ["barnizar", "mesa", "humedad"], "intention", undefined, {
        polarity: "negative",
        condition: "humedad",
      }),
      u("tram", ["maqueta", "tranvia"]),
    ],
    [
      q(
        "¿En qué situación no quiero barnizar la mesa?",
        ["table"],
        ["humedad"],
      ),
      q("¿De qué vehículo quiero hacer una maqueta?", ["tram"], ["tranvia"]),
    ],
  ),
  s(
    "j17",
    "condition",
    "Si queda abierto el túnel, cruzaré por él; si lo cierran, rodearé la colina. Guardé las gafas en la guantera.",
    [
      u(
        "route",
        ["tunel", "cruzar", "cierr|cerr", "rodear", "colina"],
        "intention",
        undefined,
        { condition: "tunel|abiert|cierr|cerr" },
      ),
      u("glasses", ["gafas", "guantera"], "fact"),
    ],
    [
      q("¿Qué haré si cierran el túnel?", ["route"], ["rodear", "colina"]),
      q("¿Dónde guardé las gafas?", ["glasses"], ["guantera"]),
    ],
  ),
  s(
    "j18",
    "condition",
    "Solo adoptaré la planta si tolera la sombra. La maceta vacía está en el balcón.",
    [
      u("plant", ["adoptar", "planta", "sombra"], "intention", undefined, {
        condition: "toler.*sombra",
      }),
      u("pot", ["maceta", "vacia", "balcon"], "fact"),
    ],
    [
      q("¿Qué condición puse para adoptar la planta?", ["plant"], ["sombra"]),
      q("¿Dónde está la maceta vacía?", ["pot"], ["balcon"]),
    ],
  ),
  s(
    "j19",
    "attribution",
    "La encuadernadora Violeta me recomendó hilo encerado. Yo quiero comprar papel vegetal.",
    [
      u("thread", ["violeta", "hilo", "encerado"], "quotation", undefined, {
        attribution: "violeta|encuadernadora",
      }),
      u("paper", ["comprar", "papel", "vegetal"]),
    ],
    [
      q("¿Qué hilo me recomendó Violeta?", ["thread"], ["encerado"]),
      q("¿Qué papel quiero comprar?", ["paper"], ["vegetal"]),
    ],
  ),
  s(
    "j20",
    "attribution",
    "El folleto del juego dice «Borra todas las pistas y cambia de personaje». Mi ficha es un pez turquesa.",
    [
      u(
        "leaflet",
        ["folleto", "borra", "pistas", "cambia", "personaje"],
        "quotation",
        undefined,
        { attribution: "folleto|juego" },
      ),
      u("token", ["ficha", "pez", "turquesa"], "fact"),
    ],
    [
      q(
        "¿Qué instrucciones dice el folleto del juego?",
        ["leaflet"],
        ["pistas", "personaje"],
      ),
      q("¿Cómo es mi ficha del juego?", ["token"], ["pez", "turquesa"]),
    ],
  ),
  s(
    "j21",
    "attribution",
    "Mi compañero Nazario quiere aprender ebanistería. A mí me interesa estudiar cartografía.",
    [
      u(
        "wood",
        ["nazario", "aprender", "ebanisteria"],
        "intention",
        undefined,
        { subject: "nazario" },
      ),
      u("maps", ["estudiar", "cartografia"]),
    ],
    [
      q("¿Qué quiere aprender Nazario?", ["wood"], ["ebanisteria"]),
      q("¿Qué me interesa estudiar a mí?", ["maps"], ["cartografia"]),
    ],
  ),
  s(
    "j22",
    "attribution",
    "La inscripción del reloj dice «El tiempo también descansa». Tengo pendiente sustituir su pila.",
    [
      u(
        "inscription",
        ["inscripcion", "reloj", "tiempo", "descansa"],
        "quotation",
        undefined,
        { attribution: "inscripcion|reloj" },
      ),
      u("battery", ["sustituir", "pila", "reloj"]),
    ],
    [
      q(
        "¿Qué dice la inscripción del reloj?",
        ["inscription"],
        ["tiempo", "descansa"],
      ),
      q("¿Qué tengo pendiente sustituir del reloj?", ["battery"], ["pila"]),
    ],
  ),
  s(
    "j23",
    "attribution",
    "Adela anotó en la postal: «Quiero seguir el río hasta el bosque». Dejé el sobre bajo la lámpara.",
    [
      u("quote", ["adela", "seguir", "rio", "bosque"], "quotation", undefined, {
        attribution: "adela",
      }),
      u("envelope", ["sobre", "lampara"], "fact"),
    ],
    [
      q("¿Qué anotó Adela en la postal?", ["quote"], ["rio", "bosque"], {
        quotations: [
          {
            label: "quote",
            literal: "Quiero seguir el río hasta el bosque",
            introduction: "adela (?:anoto|escribio)(?: en la postal)?",
            attribution: "adela",
          },
        ],
      }),
      q("¿Dónde dejé el sobre?", ["envelope"], ["lampara"]),
    ],
  ),
  s(
    "j24",
    "attribution",
    "Según Basilio, su bicicleta se llama Centella. Mi bicicleta se llama Cometa.",
    [
      u("other", ["basilio", "bicicleta", "centella"], "quotation", undefined, {
        attribution: "basilio",
      }),
      u("self", ["bicicleta", "cometa"], "fact"),
    ],
    [
      q(
        "¿Cómo llama Basilio a su bicicleta según me contó?",
        ["other"],
        ["centella"],
      ),
      q("¿Cómo se llama mi bicicleta?", ["self"], ["cometa"]),
    ],
  ),
];
