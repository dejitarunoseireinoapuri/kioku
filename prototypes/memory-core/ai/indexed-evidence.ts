import { z } from "zod";
import { interpretationSchema, InterpretationError } from "./contracts.ts";
import type { Input, Interpretation } from "./contracts.ts";

const end = z.number().int().nonnegative();
const owner = interpretationSchema.shape.units.element.shape.key;
const time = interpretationSchema.shape.units.element.shape.time;
export const indexedInterpretationSchema = interpretationSchema.extend({
  units: z
    .array(
      interpretationSchema.shape.units.element.extend({
        time: z.union([
          z.strictObject({
            precision: z.literal("unknown"),
            value: z.null(),
            end: z.null(),
            fragment: z.null(),
          }),
          time.extend({
            precision: z.enum([
              "day",
              "month",
              "year",
              "month_day",
              "interval",
            ]),
            value: z.string().min(1).max(10),
          }),
        ]),
      }),
    )
    .max(8),
  segments: z
    .array(
      z.union([
        z.strictObject({
          end,
          role: z.literal("primary"),
          owners: z.array(owner).length(1),
        }),
        z.strictObject({
          end,
          role: z.enum(["context", "time", "separator"]),
          owners: z.array(owner).min(1).max(8),
        }),
        z.strictObject({
          end,
          role: z.literal("replaced"),
          owners: z.array(owner).length(0),
        }),
      ]),
    )
    .max(128),
  retention: z
    .array(
      z.strictObject({
        index: z.number().int().nonnegative(),
        parts: z
          .array(z.strictObject({ end, keep: z.boolean() }))
          .min(1)
          .max(128),
      }),
    )
    .max(128),
});
export type IndexedInterpretation = z.infer<typeof indexedInterpretationSchema>;

/** Lossless, Unicode-safe tokens. The model chooses boundaries, never copies evidence. */
export function indexedText(text: string) {
  const tokens =
    text.match(/[\p{L}\p{M}]+|\p{N}+|\s+|[^\p{L}\p{M}\p{N}\s]/gu) ?? [];
  return tokens.map((literal, index) => ({ index, literal }));
}

function expand<T extends { end: number }>(text: string, parts: T[]) {
  const tokens = indexedText(text);
  let start = 0;
  const result = parts.map(({ end: last, ...part }) => {
    if (!Number.isSafeInteger(last) || last < start || last >= tokens.length)
      throw new InterpretationError("SEGMENT_BOUNDARY");
    const literal = tokens
      .slice(start, last + 1)
      .map((t) => t.literal)
      .join("");
    start = last + 1;
    return { ...part, literal };
  });
  if (start !== tokens.length)
    throw new InterpretationError("SEGMENT_COVERAGE");
  return result;
}

export function expandInterpretation(
  wire: IndexedInterpretation,
  input: Input,
): Interpretation {
  if (wire.status !== "ready") {
    if (wire.segments.length || wire.retention.length)
      throw new InterpretationError("INTERPRETATION_STATE");
    return interpretationSchema.parse(wire);
  }
  return interpretationSchema.parse({
    ...wire,
    segments: expand(input.text, wire.segments),
    retention: wire.retention.map(({ index, parts }) => {
      const evidence = input.evidence?.[index];
      if (!evidence) throw new InterpretationError("RETENTION_REFERENCE");
      return { index, parts: expand(evidence.fragment.text, parts) };
    }),
  });
}
