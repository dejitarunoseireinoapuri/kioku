import { ask, day, scenario, unit } from "./case.ts";

export const groupingAmbiguity = [
  scenario(
    "g49",
    "ambiguity",
    "Pasado mañana quiero hacer aquello en el jardín. Además, quiero renovar el felpudo.",
    [
      unit(
        "garden",
        ["plantar", "albahaca", "jardin"],
        "intention",
        day("2026-07-16"),
      ),
      unit("mat", ["renovar", "felpudo"]),
    ],
    [
      ask(
        "¿Qué quiero hacer en el jardín y qué día?",
        ["garden"],
        ["plantar", "albahaca", "16"],
      ),
      ask("¿Qué quiero renovar?", ["mat"], ["felpudo"]),
    ],
    {
      status: "clarify",
      clarification: "Con aquello me refería a plantar albahaca.",
      clarificationAt: "2026-07-20T08:00:00Z",
    },
  ),
  scenario(
    "g50",
    "ambiguity",
    "Hedejado los guantes de jardinería en el porche. Quiero pulir el pomo de latón.",
    [
      unit("gloves", ["guantes", "jardineria", "porche"], "fact"),
      unit("knob", ["pulir", "pomo", "laton"]),
    ],
    [
      ask("¿Dónde dejé los guantes de jardinería?", ["gloves"], ["porche"]),
      ask("¿Qué pomo quiero pulir?", ["knob"], ["laton"]),
    ],
  ),
  scenario(
    "g51",
    "ambiguity",
    "Mañana quiero zunfar con Tadeo. He comprado un gorro de lana.",
    [
      unit("activity", ["patinar", "tadeo"], "intention", day("2026-07-15"), {
        forbidden: ["zunfar"],
      }),
      unit("hat", ["comprado", "gorro", "lana"], "fact"),
    ],
    [
      ask(
        "¿Qué quería hacer con Tadeo y qué día?",
        ["activity"],
        ["patinar", "15"],
      ),
      ask("¿Qué gorro he comprado?", ["hat"], ["lana"]),
    ],
    {
      status: "clarify",
      clarification: "Zunfar era una errata: quería decir patinar.",
      clarificationAt: "2026-07-19T11:00:00Z",
    },
  ),
  scenario(
    "g52",
    "ambiguity",
    "Tengo un taller de velas el 30 de febrero de 2027. Quiero comprar moldes de silicona.",
    [
      unit("workshop", ["taller", "velas"], "intention", day("2027-02-28"), {
        forbidden: ["30"],
      }),
      unit("molds", ["comprar", "moldes", "silicona"]),
    ],
    [
      ask("¿Cuándo tengo el taller de velas?", ["workshop"], ["28", "febrero"]),
      ask("¿De qué material quiero comprar moldes?", ["molds"], ["silicona"]),
    ],
    {
      status: "clarify",
      clarification:
        "La fecha correcta del taller es el 28 de febrero de 2027.",
    },
  ),
  scenario(
    "g53",
    "ambiguity",
    "Fui con mi tía a recoger a su hermana. Luego la llevé al aeropuerto.",
    [
      unit("pickup", ["tia", "recoger", "hermana"], "fact"),
      unit("airport", ["tia", "llev", "aeropuerto"], "fact"),
    ],
    [
      ask("¿Con quién fui a recoger a su hermana?", ["pickup"], ["tia"]),
      ask("¿A quién llevé al aeropuerto?", ["airport"], ["tia"]),
    ],
    {
      status: "clarify",
      clarification: "A quien llevé al aeropuerto fue a mi tía.",
    },
  ),
  scenario(
    "g54",
    "ambiguity",
    "¿He probado alguna vez hacer vidrio soplado?",
    [],
    [
      ask("¿He probado el vidrio soplado?", [], [], { status: "not_found" }),
      ask("¿Qué taller de vidrio soplado he hecho?", [], [], {
        status: "not_found",
      }),
    ],
    { status: "no_memory" },
  ),
];
