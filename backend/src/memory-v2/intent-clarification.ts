import type { Route } from "./route-contracts.js";

/** Only standalone follow-ups with no current anchor are resolved without interpretation. */
export function unanchoredQuestion(input: Route, epoch: number): string | null {
  if (input.mode !== "ask") return null;
  const context = input.memoryEpoch === epoch ? input.context : null;
  if (context && (context.questions.length || context.sourceIds.length))
    return null;
  const text = input.text
    .trim()
    .toLocaleLowerCase("es")
    .replace(/[¿?¡!.…]+/gu, "")
    .trim();
  return new Set([
    "y ahora",
    "y entonces",
    "y después",
    "y despues",
    "y eso",
    "y lo demás",
    "y lo demas",
  ]).has(text)
    ? "¿Sobre qué quieres preguntar ahora?"
    : null;
}

export const clarificationInstructions = `Antes de emitir ask, comprueba si la consulta identifica un tema
o si puede resolverse usando las preguntas del contexto vigente. Una referencia sin antecedente claro
(por ejemplo una continuación como «¿y ahora?» tras perder el contexto) requiere clarify y una pregunta
breve que solicite el tema que falta. No supongas planes, personas ni hechos a partir de IDs opacos.
No envíes a buscar recuerdos una consulta que aún no especifica qué quiere saber el propietario.
Una pregunta completa, incluida una pregunta amplia como «¿Qué quiero hacer?», sí permite ask.
Si el contexto vigente resuelve la continuación, permite ask. No pidas aclaración por el mero hecho
de que la respuesta pueda depender de recuerdos. No respondas con hechos ni autorices escrituras.`;
