/** Unbound references in a standalone turn have no safe referent to persist. */
export function requiredClarification(text: string): string | null {
  if (
    /^\s*(?:él|ella)\s+(?:me\s+)?(?:dijo|comentó|prestó|contó)(?=\s|[.,;:]|$)/iu.test(
      text,
    )
  ) {
    return "¿A quién te refieres?";
  }
  const incompleteDay = /\bel d[ií]a\s+(?:[1-9]|[12]\d|3[01])(?:[.,]|$)/iu.test(
    text,
  );
  const knownMonth =
    /enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre/iu.test(
      text,
    );
  const admittedUnknown = /no (?:sé|se|recuerdo)|desconozco/iu.test(text);
  if (incompleteDay && !knownMonth && !admittedUnknown)
    return "¿De qué mes y año es esa fecha?";
  return null;
}
