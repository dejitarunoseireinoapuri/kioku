import { ask, scenario, unit, unknown } from "./case.ts";

export const scopeA = [
  scenario(
    "h01",
    "independent",
    "La crema de apio me sabe demasiado ácida y me desagrada. He limpiado la lámpara del pasillo.",
    [
      unit("cream", ["crema", "apio", "acida"], "opinion", unknown, {
        polarity: "negative",
      }),
      unit("lamp", ["limpiado", "lampara", "pasillo"], "fact"),
    ],
    [
      ask("¿Por qué me desagrada la crema de apio?", ["cream"], ["acida"]),
      ask("¿Qué lámpara he limpiado?", ["lamp"], ["pasillo"]),
    ],
  ),
  scenario(
    "h02",
    "independent",
    "El colchón de la buhardilla me parece firme y cómodo. Quiero cambiar las cortinas del comedor.",
    [
      unit("mattress", ["colchon", "buhardilla", "firme", "comodo"], "opinion"),
      unit("curtains", ["cambiar", "cortinas", "comedor"]),
    ],
    [
      ask(
        "¿Qué pienso del colchón de la buhardilla?",
        ["mattress"],
        ["firme", "comodo"],
      ),
      ask("¿Dónde quiero cambiar las cortinas?", ["curtains"], ["comedor"]),
    ],
  ),
  scenario(
    "h03",
    "independent",
    "La bisagra del portón chirría. Ya he solicitado que la engrasen.",
    [
      unit("noise", ["bisagra", "porton", "chirri"], "fact"),
      unit("request", ["solicitado", "engras", "bisagra|porton"], "fact"),
    ],
    [
      ask("¿Qué problema tiene la bisagra del portón?", ["noise"], ["chirri"]),
      ask("¿Qué he solicitado para la bisagra?", ["request"], ["engras"]),
    ],
  ),
  scenario(
    "h04",
    "independent",
    "Me agrada el aroma del té de jazmín, pero su regusto me parece desagradable.",
    [
      unit("aroma", ["aroma", "te", "jazmin", "agrada"], "opinion"),
      unit(
        "taste",
        ["te", "jazmin", "regusto", "desagradable"],
        "opinion",
        unknown,
        { polarity: "negative" },
      ),
    ],
    [
      ask("¿Qué pienso del aroma del té de jazmín?", ["aroma"], ["agrad"]),
      ask("¿Qué pienso de su regusto?", ["taste"], ["desagradable"]),
    ],
  ),
  scenario(
    "h05",
    "independent",
    "He remendado la cometa roja. Tengo pendiente fabricar un móvil de papel.",
    [
      unit("kite", ["remendado", "cometa", "roja"], "fact"),
      unit("mobile", ["movil", "papel"]),
    ],
    [
      ask("¿De qué color era la cometa que remendé?", ["kite"], ["roja"]),
      ask("¿He fabricado ya el móvil de papel?", [], [], {
        status: "not_found",
        contextLabels: ["mobile"],
      }),
    ],
  ),
  scenario(
    "h06",
    "independent",
    "La caja de herramientas pesa once kilos. Quiero prestarle una escalera a Gaspar.",
    [
      unit("box", ["caja", "herramientas", "once|11", "kilos"], "fact"),
      unit("ladder", ["prestar", "escalera", "gaspar"]),
    ],
    [
      ask("¿Cuánto pesa la caja de herramientas?", ["box"], ["once|11"]),
      ask("¿A quién quiero prestar una escalera?", ["ladder"], ["gaspar"]),
    ],
  ),
  scenario(
    "h07",
    "shared",
    "Durante la feria de artesanía compré un broche de cobre y una cesta de mimbre.",
    [
      unit(
        "brooch",
        ["feria", "artesania", "broche", "cobre"],
        "fact",
        unknown,
        { evidenceTerms: ["compre"] },
      ),
      unit(
        "basket",
        ["feria", "artesania", "cesta", "mimbre"],
        "fact",
        unknown,
        { evidenceTerms: ["compre"] },
      ),
    ],
    [
      ask(
        "¿Qué broche compré y en qué ocasión?",
        ["brooch"],
        ["cobre", "feria"],
      ),
      ask("¿De qué era la cesta comprada en la feria?", ["basket"], ["mimbre"]),
    ],
  ),
  scenario(
    "h08",
    "shared",
    "He colocado seis tazas en la vitrina y cuatro en la alacena.",
    [
      unit("display", ["tazas", "seis|6", "vitrina"], "fact", unknown, {
        evidenceTerms: ["colocado"],
      }),
      unit("pantry", ["tazas", "cuatro|4", "alacena"], "fact", unknown, {
        evidenceTerms: ["colocado"],
      }),
    ],
    [
      ask("¿Cuántas tazas coloqué en la vitrina?", ["display"], ["seis|6"]),
      ask("¿Cuántas coloqué en la alacena?", ["pantry"], ["cuatro|4"]),
    ],
  ),
  scenario(
    "h09",
    "shared",
    "En el almacén de mi prima guardé el taburete plegable y el atril metálico.",
    [
      unit(
        "stool",
        ["almacen", "prima", "taburete", "plegable"],
        "fact",
        unknown,
        { evidenceTerms: ["guarde"] },
      ),
      unit(
        "stand",
        ["almacen", "prima", "atril", "metalico"],
        "fact",
        unknown,
        { evidenceTerms: ["guarde"] },
      ),
    ],
    [
      ask(
        "¿Dónde guardé el taburete plegable?",
        ["stool"],
        ["almacen", "prima"],
      ),
      ask("¿Dónde guardé el atril metálico?", ["stand"], ["almacen", "prima"]),
    ],
  ),
  scenario(
    "h10",
    "shared",
    "El caldo de nabo me parece delicioso. No he cocinado ese caldo.",
    [
      unit("taste", ["caldo", "nabo", "delicioso"], "opinion"),
      unit("cooking", ["caldo", "nabo", "cocinado"], "fact", unknown, {
        polarity: "negative",
      }),
    ],
    [
      ask("¿Qué me parece el caldo de nabo?", ["taste"], ["delicioso"]),
      ask("¿He cocinado el caldo de nabo?", ["cooking"], ["no"]),
    ],
  ),
  scenario(
    "h11",
    "shared",
    "Con la monitora de cerámica quiero aprender esmaltes y practicar el torno.",
    [
      unit("glaze", ["monitora", "ceramica", "aprender", "esmaltes"]),
      unit("wheel", ["monitora", "ceramica", "practicar", "torno"]),
    ],
    [
      ask(
        "¿Con quién quiero aprender esmaltes?",
        ["glaze"],
        ["monitora", "ceramica"],
      ),
      ask("¿Qué quiero practicar con la monitora?", ["wheel"], ["torno"]),
    ],
  ),
  scenario(
    "h12",
    "shared",
    "En el taller del barrio pinté dos macetas y barnicé una balda.",
    [
      unit("pots", ["taller", "barrio", "pint", "dos|2", "macetas"], "fact"),
      unit("shelf", ["taller", "barrio", "barnic", "balda"], "fact"),
    ],
    [
      ask(
        "¿Cuántas macetas pinté en el taller del barrio?",
        ["pots"],
        ["dos|2"],
      ),
      ask("¿Qué barnicé en el taller?", ["shelf"], ["balda"]),
    ],
  ),
];
