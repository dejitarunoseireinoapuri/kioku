import { ask, day, scenario, unit } from "./case.ts";
export const finalSimilar = [
  scenario(
    "f37",
    "similar",
    "Mi profesor Íñigo quiere visitar un observatorio. Mi primo Íñigo quiere visitar una reserva de bisontes.",
    [
      unit("teacher", ["profesor", "inigo", "observatorio"]),
      unit("cousin", ["primo", "inigo", "reserva", "bisontes"]),
    ],
    [
      ask(
        "¿Qué quiere visitar mi profesor Íñigo?",
        ["teacher"],
        ["observatorio"],
      ),
      ask("¿Qué quiere visitar mi primo Íñigo?", ["cousin"], ["bisontes"]),
    ],
  ),
  scenario(
    "f38",
    "similar",
    "El 2 de julio de 2026 fui al cine Prisma. El 9 de julio de 2026 volví al cine Prisma.",
    [
      unit("first", ["cine", "prisma"], "fact", day("2026-07-02")),
      unit("second", ["cine", "prisma"], "fact", day("2026-07-09")),
    ],
    [
      ask("¿Fui al cine Prisma el 2 de julio?", ["first"], ["si|fuiste"]),
      ask("¿Fui al cine Prisma el 9 de julio?", ["second"], ["si|fuiste"]),
    ],
  ),
  scenario(
    "f39",
    "similar",
    "Quiero repetir la visita al acuario del puerto. Ayer visité ese acuario.",
    [
      unit("plan", ["acuario", "puerto", "repetir"]),
      unit("visit", ["acuario", "puerto"], "fact", day("2026-07-13")),
    ],
    [
      ask("¿Qué visita quiero repetir?", ["plan"], ["acuario", "puerto"]),
      ask("¿Qué visité ayer?", ["visit"], ["acuario"]),
    ],
  ),
  scenario(
    "f40",
    "similar",
    "Quiero cenar en el restaurante El Remanso. Ya vi la película El Remanso.",
    [
      unit("restaurant", ["cenar", "restaurante", "remanso"]),
      unit("film", ["pelicula", "remanso"], "fact"),
    ],
    [
      ask("¿En qué restaurante quiero cenar?", ["restaurant"], ["remanso"]),
      ask(
        "¿Ya he visto la película El Remanso?",
        ["film"],
        ["si|viste|has visto"],
      ),
    ],
  ),
  scenario(
    "f41",
    "similar",
    "No quiero hacer escalada en hielo. Mi amigo Darío sí quiere hacer escalada en hielo.",
    [
      unit("self", ["no", "escalada", "hielo"], "intention", undefined, {
        polarity: "negative",
      }),
      unit("friend", ["dario", "escalada", "hielo"]),
    ],
    [
      ask("¿Quiero hacer escalada en hielo?", ["self"], ["no"]),
      ask("¿Quién sí quiere hacer escalada en hielo?", ["friend"], ["dario"]),
    ],
  ),
  scenario(
    "f42",
    "similar",
    "La mochila granate está en el altillo. La mochila mostaza está detrás de la puerta del despacho.",
    [
      unit("garnet", ["mochila", "granate", "altillo"], "fact"),
      unit("mustard", ["mochila", "mostaza", "puerta", "despacho"], "fact"),
    ],
    [
      ask("¿Dónde está la mochila granate?", ["garnet"], ["altillo"]),
      ask(
        "¿Dónde está la mochila mostaza?",
        ["mustard"],
        ["puerta", "despacho"],
      ),
    ],
  ),
];
