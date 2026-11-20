import { z } from "zod";

const envelope = z.strictObject({
  pregunta_actual: z.string().min(1).max(2000),
  preguntas_anteriores_solo_contexto: z
    .array(z.string().min(1).max(2000))
    .max(4),
});

/** Decode only the validated legacy query envelope; previous questions remain context, not evidence. */
export function queryInput(text: string, previousQuestion?: string) {
  let question = text;
  let previousQuestions = previousQuestion ? [previousQuestion] : [];
  try {
    const parsed = envelope.safeParse(JSON.parse(text));
    if (parsed.success) {
      question = parsed.data.pregunta_actual;
      previousQuestions = parsed.data.preguntas_anteriores_solo_contexto;
    }
  } catch {
    // An ordinary question is not JSON.
  }
  return { question: normalizeQuestion(question), previousQuestions };
}

/** Strip a closed set of request wrappers without rewriting names, negation, dates or quoted data. */
export function normalizeQuestion(question: string): string {
  const original = question.trim();
  const request =
    /^(?:por\s+favor[,;]?\s+)?(?:dime|cu[eé]ntame|recu[eé]rdame|mu[eé]strame|expl[ií]came|quiero\s+saber|me\s+gustar[ií]a\s+saber)\s+([\s\S]+)$/iu.exec(
      original,
    );
  let body = request?.[1] ?? original;
  if (request) body = body.replace(/^lo\s+que\b/iu, "qué");
  const interrogative =
    /^¿?(?:qu[eé]|cu[aá]l(?:es)?|cu[aá]nt[oa]s?|cu[aá]ndo|d[oó]nde|c[oó]mo|qui[eé]n(?:es)?|(?:a|con|de|para)\s+(?:qui[eé]n|qu[eé]|cu[aá]ndo))(?=\s|[?]|$)/iu;
  if (!interrogative.test(body)) return original;
  body = body
    .replace(/^¿/u, "")
    .replace(/[?]\s*$/u, "")
    .trim();
  return `¿${body.charAt(0).toLocaleUpperCase("es")}${body.slice(1)}?`;
}
