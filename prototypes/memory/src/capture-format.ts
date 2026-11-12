import { z } from "zod";
import {
  itemSchema,
  extractionSchema,
  timeSchema,
  MemoryError,
} from "./domain.ts";

/** The model selects source IDs; only application code materializes literal evidence. */
export function captureFormat(text: string, clarification: string | null) {
  const parts: { id: string; text: string; channel: string }[] = [];
  for (const [channel, content] of [
    ["original", text],
    ["clarification", clarification],
  ] as const) {
    if (content === null) continue;
    for (const sentence of content.split(/(?<=[!?;\n])|(?<=\.)(?=\s|$)/u)) {
      let rest = sentence.trim();
      while (rest.length) {
        const space = rest.lastIndexOf(" ", 280);
        const end = rest.length <= 280 ? rest.length : space > 0 ? space : 280;
        const literal = rest.slice(0, end).trim();
        if (literal)
          parts.push({ id: `s${parts.length + 1}`, text: literal, channel });
        rest = rest.slice(end).trim();
        if (parts.length > 256) throw new MemoryError("EXTRACTION_PART_LIMIT");
      }
    }
  }
  if (!parts.length) throw new MemoryError("EXTRACTION_EMPTY_SOURCE");
  const ids = z.enum(parts.map((part) => part.id) as [string, ...string[]]);
  const schema = extractionSchema.omit({ items: true }).extend({
    items: z
      .array(
        itemSchema
          .omit({ quote: true, attributionEvidence: true, time: true })
          .extend({
            evidenceId: ids,
            attributionEvidenceId: ids.nullable(),
            time: timeSchema
              .omit({ quote: true })
              .extend({ evidenceId: ids.nullable() }),
          }),
      )
      .max(8),
  });
  const byId = new Map(parts.map((part) => [part.id, part.text]));
  function literal(id: string | null) {
    if (id === null) return null;
    const value = byId.get(id);
    if (!value) throw new MemoryError("EXTRACTION_EVIDENCE_ID_INVALID");
    return value;
  }
  function materialize(input: z.infer<typeof schema>) {
    const result = schema.parse(input);
    return extractionSchema.parse({
      ...result,
      items: result.items.map(
        ({ evidenceId, attributionEvidenceId, time, ...item }) => {
          const { evidenceId: timeId, ...date } = time;
          return {
            ...item,
            text:
              item.provenance === "quoted"
                ? `Texto citado${item.attribution ? ` (${item.attribution})` : ""}: «${literal(evidenceId)}»`
                : item.text,
            quote: literal(evidenceId),
            attributionEvidence: literal(attributionEvidenceId),
            time: { ...date, quote: literal(timeId) },
          };
        },
      ),
    });
  }
  return { parts, schema, materialize };
}
