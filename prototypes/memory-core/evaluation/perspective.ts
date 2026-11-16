import type { Unit } from "../src/model.ts";
import type { GoldQuery } from "./case.ts";

const normalize = (value: string) =>
  value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

/** Exempt only a predeclared, attributed literal backed by the cited current unit. */
export function validAnswerPerspective(
  answer: { text: string; ids: string[] },
  expected: GoldQuery,
  mapping: Map<string, Unit>,
) {
  const text = normalize(answer.text);
  const narration = text.replace(
    /«([^«»]*)»|“([^“”]*)”|"([^"\n]*)"/gu,
    (
      span: string,
      a: string | undefined,
      b: string | undefined,
      c: string | undefined,
      offset: number,
    ) => {
      const literal = a ?? b ?? c ?? "";
      const supported = (expected.quotations ?? []).some((quote) => {
        const unit = mapping.get(quote.label);
        return (
          expected.labels.includes(quote.label) &&
          unit?.content.kind === "quotation" &&
          unit.content.attribution !== null &&
          answer.ids.includes(unit.id) &&
          literal === normalize(quote.literal) &&
          new RegExp(`(?:${quote.introduction})\\s*:?\\s*$`, "u").test(
            text.slice(0, offset),
          )
        );
      });
      return supported ? " " : span;
    },
  );
  return !/\b(quiero|prefiero|he comprado|me gusta)\b/u.test(narration);
}
