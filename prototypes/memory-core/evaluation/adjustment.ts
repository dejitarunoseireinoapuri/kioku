import { ask, day, scenario, unit } from "./case.ts";
export const adjustment = [
  scenario(
    "a01",
    "ambiguity",
    "Mañana quiero flar. También quiero comprar lentejas.",
    [
      unit("activity", ["oboe"], "intention", day("2026-07-15"), {
        forbidden: ["flar"],
      }),
      unit("food", ["lentejas"]),
    ],
    [
      ask("¿Qué día quiero tocar el oboe?", ["activity"], ["15"]),
      ask("¿Qué quiero comprar?", ["food"], ["lentejas"]),
    ],
    {
      status: "clarify",
      clarification: "Flar quería decir tocar el oboe.",
      clarificationAt: "2026-07-17T10:00:00Z",
    },
  ),
  scenario(
    "a02",
    "ambiguity",
    "Quiero glanar con Eva.",
    [
      unit("activity", ["patinar", "eva"], "intention", day("2026-07-18"), {
        forbidden: ["glanar"],
      }),
    ],
    [
      ask("¿Qué día quiero patinar?", ["activity"], ["18"]),
      ask("¿Con quién quiero patinar?", ["activity"], ["eva"]),
    ],
    {
      status: "clarify",
      clarification: "Quiero patinar mañana con Eva.",
      clarificationAt: "2026-07-17T10:00:00Z",
    },
  ),
  scenario(
    "a03",
    "ambiguity",
    "Mañana quiero ir al pabellón a tridar.",
    [
      unit(
        "activity",
        ["pabellon", "esgrima"],
        "intention",
        day("2026-07-16"),
        { forbidden: ["tridar"] },
      ),
    ],
    [
      ask("¿Qué día quiero practicar esgrima?", ["activity"], ["16"]),
      ask("¿Dónde quiero practicarla?", ["activity"], ["pabellon"], {
        previous: "¿Qué día quiero practicar esgrima?",
      }),
    ],
    {
      at: "2026-07-14T22:30:00Z",
      status: "clarify",
      clarification: "Tridar quería decir practicar esgrima.",
      clarificationAt: "2026-07-17T01:00:00Z",
      clarificationZone: "America/Los_Angeles",
    },
  ),
];
