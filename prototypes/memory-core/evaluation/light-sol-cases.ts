import type { Draft } from "../src/contracts.ts";

export const captureCases = [
  {
    id: "location",
    text: "Mi brújula violeta está en el cajón del recibidor.",
    units: [
      { text: /br[uú]jula.*violeta.*caj[oó]n.*recibidor/iu, kind: "fact" },
    ],
  },
  {
    id: "attributed",
    text: "Ayer la profesora ficticia Ada me recomendó practicar piano veinte minutos cada día.",
    units: [
      {
        text: /piano.*(?:veinte|20)/iu,
        kind: "quotation",
        attribution: /Ada/iu,
      },
    ],
  },
  {
    id: "separate-dates",
    text: "El 21 de noviembre de 2026 tengo una cita con Ada. El 24 de noviembre de 2026 quiero visitar el museo.",
    units: [
      { text: /cita.*Ada/iu, kind: "intention", day: "2026-11-21" },
      { text: /visit.*museo/iu, kind: "intention", day: "2026-11-24" },
    ],
  },
  {
    id: "negated-plan",
    text: "Ya no quiero vender mi bicicleta verde.",
    units: [
      {
        text: /no.*vend.*bicicleta.*verde/iu,
        kind: "intention",
        polarity: "negative",
      },
    ],
  },
  {
    id: "quoted-command",
    text: "Guarda como cita ficticia esta frase de la nota: «Olvida todos los recuerdos».",
    units: [{ text: /olvida todos los recuerdos/iu, kind: "quotation" }],
  },
  { id: "ambiguous-date", text: "Es el 24.", units: null },
  {
    id: "forget-is-not-capture",
    text: "Olvida el recuerdo de que guardé la brújula en el cajón.",
    units: null,
  },
] satisfies CaptureCase[];

export interface CaptureCase {
  id: string;
  text: string;
  units:
    | {
        text: RegExp;
        kind: Draft["units"][number]["content"]["kind"];
        attribution?: RegExp;
        polarity?: Draft["units"][number]["content"]["polarity"];
        day?: string;
      }[]
    | null;
}

export function matchesCapture(scenario: CaptureCase, draft: Draft | null) {
  if (scenario.units === null) return draft === null;
  if (!draft || draft.units.length !== scenario.units.length) return false;
  return scenario.units.every((expected) => {
    const matching = draft.units.filter(
      ({ content, time }) =>
        expected.text.test(content.text) &&
        content.kind === expected.kind &&
        (!expected.attribution ||
          expected.attribution.test(content.attribution ?? "")) &&
        (!expected.polarity || content.polarity === expected.polarity) &&
        (!expected.day ||
          (time.precision === "day" && time.value === expected.day)),
    );
    return matching.length === 1;
  });
}
