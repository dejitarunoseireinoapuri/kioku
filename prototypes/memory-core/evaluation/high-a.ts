import { ask as q, scenario as s, unit as u } from "./case.ts";

export const highA = [
  s(
    "i01",
    "independent",
    "Tengo pendiente encuadernar mi diario; además, quiero montar una cometa hexagonal.",
    [
      u("diary", ["encuadernar", "diario"]),
      u("kite", ["montar", "cometa", "hexagonal"]),
    ],
    [
      q("¿Qué quiero encuadernar?", ["diary"], ["diario"]),
      q(
        "¿Qué forma tiene la cometa que quiero montar?",
        ["kite"],
        ["hexagonal"],
      ),
    ],
  ),
  s(
    "i02",
    "independent",
    "La brújula está dentro del termo vacío. Me apetece aprender a tocar el oboe.",
    [
      u("compass", ["brujula", "termo", "vacio"], "fact"),
      u("oboe", ["aprender", "oboe"]),
    ],
    [
      q("¿Dónde está la brújula?", ["compass"], ["termo"]),
      q("¿Qué instrumento me apetece aprender?", ["oboe"], ["oboe"]),
    ],
  ),
  s(
    "i03",
    "independent",
    "El jabón de enebro me parece empalagoso y por eso no me gusta. Tengo que barnizar un taburete.",
    [
      u("soap", ["jabon", "enebro", "empalagoso"], "opinion", undefined, {
        polarity: "negative",
      }),
      u("stool", ["barnizar", "taburete"]),
    ],
    [
      q("¿Por qué no me gusta el jabón de enebro?", ["soap"], ["empalagoso"]),
      q("¿Qué tengo que barnizar?", ["stool"], ["taburete"]),
    ],
  ),
  s(
    "i04",
    "independent",
    "He inventado una idea: una maceta que gira siguiendo las nubes. También he comprado un dedal de cobre.",
    [
      u("idea", ["maceta", "gira", "nubes"], "thought"),
      u("thimble", ["comprado", "dedal", "cobre"], "fact"),
    ],
    [
      q("¿Qué hace la maceta de mi idea?", ["idea"], ["gira", "nubes"]),
      q("¿De qué material es el dedal que compré?", ["thimble"], ["cobre"]),
    ],
  ),
  s(
    "i05",
    "independent",
    "Guardé tres botones de nácar en una lata. Quiero aprender a reparar relojes de péndulo. Mi paraguas es naranja.",
    [
      u("buttons", ["tres|3", "botones", "nacar", "lata"], "fact"),
      u("clocks", ["aprender", "reparar", "relojes", "pendulo"]),
      u("umbrella", ["paraguas", "naranja"], "fact"),
    ],
    [
      q("¿Cuántos botones de nácar guardé?", ["buttons"], ["tres|3"]),
      q("¿Qué relojes quiero aprender a reparar?", ["clocks"], ["pendulo"]),
      q("¿De qué color es mi paraguas?", ["umbrella"], ["naranja"]),
    ],
  ),
  s(
    "i06",
    "independent",
    "Quiero probar el helado de romero de la heladería Nébula. Ya terminé el rompecabezas del faro.",
    [
      u("ice", ["probar", "helado", "romero", "nebula"]),
      u("puzzle", ["termine|terminado", "rompecabezas", "faro"], "fact"),
    ],
    [
      q("¿Dónde quiero probar helado de romero?", ["ice"], ["nebula"]),
      q("¿Qué rompecabezas terminé?", ["puzzle"], ["faro"]),
    ],
  ),
  s(
    "i07",
    "shared",
    "He colocado cuatro tarros en la alacena y seis en la despensa.",
    [
      u("cupboard", ["tarros", "cuatro|4", "alacena"], "fact", undefined, {
        evidenceTerms: ["colocado"],
      }),
      u("pantry", ["tarros", "seis|6", "despensa"], "fact", undefined, {
        evidenceTerms: ["colocado"],
      }),
    ],
    [
      q("¿Cuántos tarros coloqué en la alacena?", ["cupboard"], ["cuatro|4"]),
      q("¿Cuántos coloqué en la despensa?", ["pantry"], ["seis|6"]),
    ],
  ),
  s(
    "i08",
    "shared",
    "Mi prima Malena me contó que desea estudiar oceanografía y aprender a tejer con telar.",
    [
      u("study", ["malena", "oceanografia"], "quotation", undefined, {
        attribution: "malena|prima",
      }),
      u("loom", ["malena", "tejer", "telar"], "quotation", undefined, {
        attribution: "malena|prima",
      }),
    ],
    [
      q(
        "¿Qué quiere estudiar Malena según me contó?",
        ["study"],
        ["oceanografia"],
      ),
      q("¿Con qué quiere aprender a tejer?", ["loom"], ["telar"]),
    ],
  ),
  s(
    "i09",
    "shared",
    "Durante la feria de otoño compré una linterna violeta y encargué un cuenco de gres.",
    [
      u(
        "light",
        ["feria", "otono", "compre|comprado", "linterna", "violeta"],
        "fact",
      ),
      u("bowl", ["feria", "otono", "encarg", "cuenco", "gres"], "fact"),
    ],
    [
      q(
        "¿De qué color era la linterna que compré en la feria?",
        ["light"],
        ["violeta"],
      ),
      q(
        "¿Qué encargué durante la feria de otoño?",
        ["bowl"],
        ["cuenco", "gres"],
      ),
    ],
  ),
  s(
    "i10",
    "shared",
    "La sopa de hinojo huele bien, pero no la he probado.",
    [
      u("smell", ["sopa", "hinojo", "huele", "bien"], "opinion"),
      u("taste", ["sopa", "hinojo", "no", "probado"], "fact", undefined, {
        polarity: "negative",
      }),
    ],
    [
      q("¿Qué pienso del olor de la sopa de hinojo?", ["smell"], ["bien"]),
      q("¿He probado esa sopa?", ["taste"], ["no"]),
    ],
  ),
  s(
    "i11",
    "shared",
    "En el baúl de viaje hay una bufanda a rayas y unos guantes de seda.",
    [
      u("scarf", ["baul", "viaje", "bufanda", "rayas"], "fact"),
      u("gloves", ["baul", "viaje", "guantes", "seda"], "fact"),
    ],
    [
      q("¿Dónde está la bufanda a rayas?", ["scarf"], ["baul"]),
      q("¿De qué material son los guantes del baúl?", ["gloves"], ["seda"]),
    ],
  ),
  s(
    "i12",
    "shared",
    "Para la excursión al glaciar quiero llevar crampones. La excursión será el 9 de marzo de 2027.",
    [
      u("trip", ["excursion", "glaciar"], "intention", {
        precision: "day",
        value: "2027-03-09",
        end: null,
      }),
      u("gear", ["llevar", "crampones", "excursion", "glaciar"], "intention", {
        precision: "day",
        value: "2027-03-09",
        end: null,
      }),
    ],
    [
      q("¿Cuándo será la excursión al glaciar?", ["trip"], ["9", "marzo"]),
      q("¿Qué quiero llevar a esa excursión?", ["gear"], ["crampones"]),
    ],
    {
      expectedRelations: [{ kind: "requires", from: "gear", to: "trip" }],
      forgetClosure: ["gear"],
      after: [
        q("¿Cuándo será la excursión al glaciar?", []),
        q("¿Qué quería llevar a esa excursión?", []),
      ],
    },
  ),
];
