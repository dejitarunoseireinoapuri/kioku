import { z } from "zod";
import { contentSchema, eventTimeSchema } from "../src/contracts.ts";
import type { Unit } from "../src/model.ts";

const key = z.string().regex(/^[a-z][a-z0-9_-]{0,31}$/u);
export const interpretationSchema = z.strictObject({
  status: z.enum(["ready", "clarify", "no_memory"]),
  question: z.string().max(500).nullable(),
  preserveTime: z.boolean(),
  units: z
    .array(
      z.strictObject({
        key,
        content: contentSchema,
        time: z.strictObject({
          ...eventTimeSchema.shape,
          fragment: z.number().int().nonnegative().nullable(),
        }),
        existing: z.number().int().nonnegative().nullable(),
      }),
    )
    .max(8),
  segments: z
    .array(
      z.strictObject({
        literal: z.string().min(1).max(8000),
        role: z.enum(["primary", "context", "time", "separator", "replaced"]),
        owners: z.array(key).max(8),
      }),
    )
    .max(128),
  relations: z
    .array(
      z.strictObject({
        kind: z.enum(["requires", "possibleSameAs", "evolvesFrom"]),
        from: key,
        toKey: key.nullable(),
        toExisting: z.number().int().nonnegative().nullable(),
      }),
    )
    .max(32),
});
export const reviewSchema = z.strictObject({
  accepted: z.boolean(),
  issues: z
    .array(
      z.enum([
        "coverage",
        "ownership",
        "identity",
        "modality",
        "time",
        "attribution",
        "condition",
        "clarification",
        "instruction",
        "scope",
      ]),
    )
    .max(10),
});
export const answerSchema = z.strictObject({
  status: z.enum(["answered", "not_found", "clarify"]),
  text: z.string().min(1).max(2000),
  evidence: z.array(z.number().int().nonnegative()).max(32),
});
export type Interpretation = z.infer<typeof interpretationSchema>;
export type Answer = z.infer<typeof answerSchema>;
export interface Input {
  text: string;
  at: string;
  zone: string;
  mode: "capture" | "correction";
  target?: Unit;
  clarification?: { original: string; question: string };
}
export interface StructuredModel {
  call<T>(
    stage: string,
    instructions: string,
    data: unknown,
    schema: z.ZodType<T>,
    outputLimit: number,
  ): Promise<T>;
}
export class InterpretationError extends Error {
  readonly code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
    this.name = "InterpretationError";
  }
}
