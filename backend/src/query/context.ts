import { z } from "zod";

const context = z.strictObject({
  pregunta_actual: z.string().min(1).max(2000),
  preguntas_anteriores_solo_contexto: z
    .array(z.string().min(1).max(2000))
    .max(4),
  memory_revision: z
    .number()
    .int()
    .nonnegative()
    .max(Number.MAX_SAFE_INTEGER)
    .optional(),
});

/** A mobile conversation from before a mutation must never become retrieval context. */
export function currentQueryText(text: string, revision: number): string {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return text;
  }
  const parsed = context.safeParse(value);
  if (!parsed.success) return text;
  if ((parsed.data.memory_revision ?? 0) !== revision)
    return parsed.data.pregunta_actual;
  return JSON.stringify({
    pregunta_actual: parsed.data.pregunta_actual,
    preguntas_anteriores_solo_contexto:
      parsed.data.preguntas_anteriores_solo_contexto,
  });
}
