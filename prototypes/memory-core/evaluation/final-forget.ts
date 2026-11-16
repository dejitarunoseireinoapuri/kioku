import { ask, scenario, unit } from "./case.ts";
export const finalForget = [
  scenario(
    "f55",
    "forget",
    "Para la fiesta aparté 7 platos hondos y 13 llanos.",
    [
      unit("deep", ["fiesta", "7", "platos", "hondos"], "fact", undefined, {
        evidenceTerms: ["aparte"],
      }),
      unit("flat", ["fiesta", "13", "platos", "llanos"], "fact", undefined, {
        evidenceTerms: ["aparte"],
      }),
    ],
    [
      ask("¿Cuántos platos hondos aparté para la fiesta?", ["deep"], ["7"]),
      ask("¿Cuántos platos llanos aparté para la fiesta?", ["flat"], ["13"]),
    ],
  ),
  scenario(
    "f56",
    "forget",
    "Puse seis sobres en la carpeta y dejé otros cuatro sobres en el archivador.",
    [
      unit("folder", ["\\b(?:seis|6)\\b", "sobres", "carpeta"], "fact"),
      unit("cabinet", ["\\b(?:cuatro|4)\\b", "sobres", "archivador"], "fact"),
    ],
    [
      ask(
        "¿Cuántos sobres hay en la carpeta?",
        ["folder"],
        ["\\b(?:seis|6)\\b"],
      ),
      ask(
        "¿Cuántos sobres hay en el archivador?",
        ["cabinet"],
        ["\\b(?:cuatro|4)\\b"],
      ),
    ],
  ),
  scenario(
    "f57",
    "forget",
    "Quiero ver el documental Mareas de Arena. Quiero probar el ramen de Casa Junco. También quiero arreglar el tocadiscos.",
    [
      unit("film", ["documental", "mareas de arena"]),
      unit("ramen", ["ramen", "casa junco"]),
      unit("record", ["arreglar", "tocadiscos"]),
    ],
    [
      ask("¿Qué documental quiero ver?", ["film"], ["mareas de arena"]),
      ask("¿Dónde quiero probar ramen?", ["ramen"], ["casa junco"]),
      ask("¿Qué aparato quiero arreglar?", ["record"], ["tocadiscos"]),
    ],
    {
      forget: ["ramen"],
      after: [
        ask("¿Qué documental quiero ver?", ["film"], ["mareas de arena"]),
        ask("¿Dónde quiero probar ramen?", [], [], { status: "not_found" }),
        ask("¿Qué aparato quiero arreglar?", ["record"], ["tocadiscos"]),
      ],
    },
  ),
  scenario(
    "f58",
    "forget",
    "Probé las galletas de algarroba: me parecieron ásperas y no me gustaron. No he probado las galletas de avena.",
    [
      unit(
        "carob",
        ["galletas", "algarroba", "asperas"],
        "opinion",
        undefined,
        { polarity: "negative" },
      ),
      unit("oats", ["no", "galletas", "avena"], "fact", undefined, {
        polarity: "negative",
      }),
    ],
    [
      ask(
        "¿Qué me parecieron las galletas de algarroba?",
        ["carob"],
        ["asperas"],
      ),
      ask("¿He probado las galletas de avena?", ["oats"], ["no"]),
    ],
  ),
  scenario(
    "f59",
    "forget",
    "Se me ocurrió la idea de una mochila con paneles solares. También cargué el reloj en la cocina.",
    [
      unit("idea", ["mochila", "paneles", "solares"], "thought"),
      unit("watch", ["reloj", "cocina"], "fact"),
    ],
    [
      ask("¿Qué idea tuve para una mochila?", ["idea"], ["paneles", "solares"]),
      ask("¿Dónde cargué el reloj?", ["watch"], ["cocina"]),
    ],
  ),
  scenario(
    "f60",
    "forget",
    "Mi hermana guardó el mantón negro en el cofre. Yo guardé la peineta roja en el neceser.",
    [
      unit("shawl", ["hermana", "manton", "negro", "cofre"], "fact"),
      unit("comb", ["peineta", "roja", "neceser"], "fact"),
    ],
    [
      ask("¿Dónde guardó mi hermana el mantón negro?", ["shawl"], ["cofre"]),
      ask("¿Dónde guardé la peineta roja?", ["comb"], ["neceser"]),
    ],
  ),
];
