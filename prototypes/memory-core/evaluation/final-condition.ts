import { ask, scenario, unit } from "./case.ts";
export const finalCondition = [
  scenario(
    "f13",
    "condition",
    "Solo compraré el telescopio si cabe en el armario del recibidor.",
    [
      unit(
        "scope",
        ["telescopio", "armario", "recibidor"],
        "intention",
        undefined,
        { condition: "cabe|quepa|caber" },
      ),
    ],
    [
      ask(
        "¿De qué depende que compre el telescopio?",
        ["scope"],
        ["armario", "recibidor"],
      ),
      ask("¿Ya he comprado el telescopio?", [], [], { status: "not_found" }),
    ],
  ),
  scenario(
    "f14",
    "condition",
    "Cuando termine el curso de encuadernación, quiero hacer un álbum para mi abuela.",
    [
      unit(
        "album",
        ["curso", "encuadernacion", "album", "abuela"],
        "intention",
        undefined,
        { condition: "termin" },
      ),
    ],
    [
      ask(
        "¿Cuándo quiero hacer el álbum para mi abuela?",
        ["album"],
        ["termin", "curso", "encuadernacion"],
      ),
      ask("¿Qué día exacto haré el álbum?", [], [], { status: "not_found" }),
    ],
  ),
  scenario(
    "f15",
    "condition",
    "Si abren el refugio, iré por el sendero alto; si sigue cerrado, pasearé junto al río.",
    [
      unit(
        "outing",
        ["refugio", "sendero", "alto", "cerrado", "rio"],
        "intention",
        undefined,
        { condition: "refugio" },
      ),
    ],
    [
      ask("¿Qué haré si abren el refugio?", ["outing"], ["sendero", "alto"]),
      ask("¿Y si sigue cerrado?", ["outing"], ["rio"], {
        previous: "¿Qué haré si abren el refugio?",
      }),
    ],
  ),
  scenario(
    "f16",
    "condition",
    "A menos que cancele el profesor, pienso llevar mi flauta a la clase.",
    [
      unit(
        "flute",
        ["cancel", "profesor", "flauta", "clase"],
        "intention",
        undefined,
        { condition: "cancel" },
      ),
    ],
    [
      ask("¿Qué pensaba llevar a clase?", ["flute"], ["flauta"]),
      ask("¿Qué podría cambiar ese plan?", ["flute"], ["cancel", "profesor"], {
        previous: "¿Qué pensaba llevar a clase?",
      }),
    ],
  ),
  scenario(
    "f17",
    "condition",
    "Si la maleta pesa menos de 18 kilos, llevaré también mis botas de montaña.",
    [
      unit(
        "boots",
        ["maleta", "menos", "18", "kilos", "botas", "montana"],
        "intention",
        undefined,
        { condition: "menos.*18|18.*menos" },
      ),
    ],
    [
      ask(
        "¿Con qué condición llevaré las botas de montaña?",
        ["boots"],
        ["menos", "18", "kilos"],
      ),
      ask("¿Cuánto pesa realmente la maleta?", [], [], { status: "not_found" }),
    ],
  ),
  scenario(
    "f18",
    "condition",
    "Me gustaría cenar en La Higuera cuando mi hermana vuelva de su curso; aún no sé qué día volverá.",
    [
      unit(
        "dinner",
        ["higuera", "hermana", "curso", "no.*se|desconozco"],
        "intention",
        undefined,
        { condition: "vuelv|regres" },
      ),
    ],
    [
      ask(
        "¿Cuándo quería cenar en La Higuera?",
        ["dinner"],
        ["hermana", "curso", "vuelv|regres"],
      ),
      ask("¿Qué día exacto vuelve mi hermana?", [], [], {
        status: "not_found",
      }),
    ],
  ),
];
