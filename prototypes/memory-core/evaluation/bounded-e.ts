import { ask as q, scenario as s, unit as u, day } from "./case.ts";

export const boundedE = [
  s(
    "j49",
    "ambiguity",
    "Dejé el paraguas junto a eso. Quiero comprar una lupa.",
    [
      u("umbrella", ["paraguas", "jarron", "entrada"], "fact"),
      u("glass", ["comprar", "lupa"]),
    ],
    [
      q("¿Dónde dejé el paraguas?", ["umbrella"], ["jarron", "entrada"]),
      q("¿Qué quiero comprar?", ["glass"], ["lupa"]),
    ],
    {
      status: "clarify",
      clarification: "Con eso me refería al jarrón de la entrada.",
    },
  ),
  s(
    "j50",
    "ambiguity",
    "Quiero ordeanr el costurero. La aguja curva está en la lata redonda.",
    [
      u("sewing", ["ordenar|ordeanr", "costurero"]),
      u("needle", ["aguja", "curva", "lata", "redonda"], "fact"),
    ],
    [
      q("¿Qué quiero ordenar?", ["sewing"], ["costurero"]),
      q("¿Dónde está la aguja curva?", ["needle"], ["lata", "redonda"]),
    ],
  ),
  s(
    "j51",
    "ambiguity",
    "Mañana quiero llevarlo al taller. La paleta está en el cajón blanco.",
    [
      u(
        "frame",
        ["llevar", "marco", "cuadro", "taller"],
        "intention",
        day("2026-07-15"),
      ),
      u("palette", ["paleta", "cajon", "blanco"], "fact"),
    ],
    [
      q(
        "¿Qué fecha quiero llevar el marco al taller?",
        ["frame"],
        ["15", "julio"],
      ),
      q("¿Dónde está la paleta?", ["palette"], ["cajon", "blanco"]),
    ],
    {
      status: "clarify",
      clarification: "Me refería al marco del cuadro.",
      clarificationAt: "2026-07-18T18:00:00Z",
    },
  ),
  s(
    "j52",
    "ambiguity",
    "Quiero llevar eso a su casa. Tengo el bolso en la silla.",
    [
      u(
        "plant",
        ["llevar", "planta", "casa", "mar"],
        "intention",
        day("2026-07-20"),
      ),
      u("bag", ["bolso", "silla"], "fact"),
    ],
    [
      q(
        "¿Qué fecha quiero llevar la planta a casa de Mar?",
        ["plant"],
        ["20", "julio"],
      ),
      q("¿Dónde tengo el bolso?", ["bag"], ["silla"]),
    ],
    {
      status: "clarify",
      clarification: "Quería decir que mañana llevaré la planta a casa de Mar.",
      clarificationAt: "2026-07-19T18:00:00Z",
    },
  ),
  s(
    "j53",
    "ambiguity",
    "Fui con mi primo a buscar a su amigo. Después lo llevé a la estación.",
    [
      u("pickup", ["primo", "buscar", "amigo"], "fact"),
      u("station", ["primo", "llev", "estacion"], "fact", undefined, {
        forbidden: ["buscar", "amigo"],
      }),
    ],
    [
      q("¿Con quién fui a buscar a su amigo?", ["pickup"], ["primo"]),
      q("¿A quién llevé a la estación?", ["station"], ["primo"]),
    ],
    {
      status: "clarify",
      clarification: "Con lo me refería a mi primo.",
      after: [
        q("¿Con quién fui a buscar a su amigo?", [], [], {
          forbidden: ["buscar", "amigo"],
        }),
        q("¿A quién llevé a la estación?", ["station"], ["primo"], {
          forbidden: ["buscar", "amigo"],
        }),
      ],
    },
  ),
  s(
    "j54",
    "ambiguity",
    "¿Qué tamaño de violín me conviene?",
    [],
    [
      q("¿Tengo guardado qué tamaño de violín me conviene?", []),
      q("¿Qué violín he comprado?", []),
    ],
    { status: "no_memory" },
  ),
  s(
    "j55",
    "forget",
    "Nora me prestó un libro de hongos. Nora quiere aprender a remar.",
    [
      u("loan", ["nora", "prest", "libro", "hongos"], "fact"),
      u("rowing", ["nora", "aprender", "remar"], "intention", undefined, {
        subject: "nora",
        forbidden: ["prest", "libro", "hongos"],
      }),
    ],
    [
      q("¿Quién me prestó el libro de hongos?", ["loan"], ["nora"]),
      q("¿Qué quiere aprender Nora?", ["rowing"], ["remar"]),
    ],
    {
      after: [
        q("¿Quién me prestó el libro de hongos?", []),
        q("¿Qué quiere aprender Nora?", ["rowing"], ["remar"], {
          forbidden: ["hongos", "prest"],
        }),
      ],
    },
  ),
  s(
    "j56",
    "forget",
    "El bolígrafo está en la bandeja. El sacacorchos está en el cajón. El abanico está en la cesta.",
    [
      u("pen", ["boligrafo", "bandeja"], "fact"),
      u("opener", ["sacacorchos", "cajon"], "fact"),
      u("fan", ["abanico", "cesta"], "fact"),
    ],
    [
      q("¿Dónde está el bolígrafo?", ["pen"], ["bandeja"]),
      q("¿Dónde está el sacacorchos?", ["opener"], ["cajon"]),
      q("¿Dónde está el abanico?", ["fan"], ["cesta"]),
    ],
    {
      forget: ["opener"],
      after: [
        q("¿Dónde está el bolígrafo?", ["pen"], ["bandeja"]),
        q("¿Dónde está el sacacorchos?", []),
        q("¿Dónde está el abanico?", ["fan"], ["cesta"]),
      ],
    },
  ),
  s(
    "j57",
    "forget",
    "Quiero construir una veleta. Quiero pintar un biombo.",
    [u("vane", ["construir", "veleta"]), u("screen", ["pintar", "biombo"])],
    [
      q("¿Qué quiero construir?", ["vane"], ["veleta"]),
      q("¿Qué quiero pintar?", ["screen"], ["biombo"]),
    ],
    {
      forget: ["vane", "screen"],
      after: [q("¿Qué quiero construir?", []), q("¿Qué quiero pintar?", [])],
    },
  ),
  s(
    "j58",
    "forget",
    "En la merienda del club serví bizcocho de limón y preparé té de jazmín.",
    [
      u("cake", ["merienda", "club", "serv", "bizcocho", "limon"], "fact"),
      u("tea", ["merienda", "club", "prepar", "te", "jazmin"], "fact"),
    ],
    [
      q("¿Qué bizcocho serví en la merienda del club?", ["cake"], ["limon"]),
      q("¿Qué té preparé en esa merienda?", ["tea"], ["jazmin"]),
    ],
  ),
  s(
    "j59",
    "forget",
    "Dejé cuatro canicas en la bolsa roja y otras seis en la verde.",
    [
      u("red", ["dej", "cuatro|4", "canicas", "bolsa", "roja"], "fact"),
      u("green", ["dej", "seis|6", "canicas", "bolsa", "verde"], "fact"),
    ],
    [
      q("¿Cuántas canicas dejé en la bolsa roja?", ["red"], ["cuatro|4"]),
      q("¿Cuántas canicas dejé en la bolsa verde?", ["green"], ["seis|6"]),
    ],
  ),
  s(
    "j60",
    "forget",
    "Quedé con Silvia para visitar una imprenta. El estuche de plumas está sobre el aparador.",
    [
      u("agreement", ["silvia", "visitar", "imprenta"], "fact"),
      u("case", ["estuche", "plumas", "aparador"], "fact"),
    ],
    [
      q("¿Con quién acordé visitar una imprenta?", ["agreement"], ["silvia"]),
      q("¿Dónde está el estuche de plumas?", ["case"], ["aparador"]),
      q("¿He visitado ya la imprenta con Silvia?", []),
    ],
    {
      after: [
        q("¿Con quién acordé visitar una imprenta?", []),
        q("¿Dónde está el estuche de plumas?", ["case"], ["aparador"]),
        q("¿He visitado ya la imprenta con Silvia?", []),
      ],
    },
  ),
];
