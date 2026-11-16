import { z } from "zod";
import { CoreError } from "./errors.ts";

export const limits = Object.freeze({
  inputCharacters: 8000,
  unitsPerTurn: 8,
  fragmentsPerTurn: 128,
  affectedUnits: 32,
  occurrences: 128,
  writes: 400,
  changeBytes: 2 * 1024 * 1024,
  catalogUnits: 256,
  catalogDocuments: 4096,
  planMilliseconds: 5 * 60_000,
  receiptMilliseconds: 7 * 24 * 60 * 60_000,
});

const key = z.string().regex(/^[a-z][a-z0-9_-]{0,31}$/u);
const text = z
  .string()
  .min(1)
  .max(2000)
  .refine((s) => Boolean(s.trim()));
export const referenceSchema = z.strictObject({
  id: z.uuid(),
  revision: z.number().int().positive(),
});
export const contentSchema = z.strictObject({
  text,
  proposition: text,
  subject: z.string().min(1).max(200),
  kind: z.enum(["fact", "intention", "opinion", "thought", "quotation"]),
  polarity: z.enum(["positive", "negative"]),
  attribution: z.string().min(1).max(200).nullable(),
  condition: text.nullable(),
});
export const eventTimeSchema = z.strictObject({
  precision: z.enum([
    "unknown",
    "day",
    "month",
    "year",
    "month_day",
    "interval",
  ]),
  value: z.string().max(10).nullable(),
  end: z.string().max(10).nullable(),
});
const timeDraft = z.strictObject({
  ...eventTimeSchema.shape,
  fragment: z.number().int().nonnegative().nullable(),
});
const unitDraft = z.strictObject({
  key,
  content: contentSchema,
  time: timeDraft,
  existing: referenceSchema.nullable(),
});
const target = z.union([z.strictObject({ key }), referenceSchema]);
export const relationKind = z.enum([
  "requires",
  "possibleSameAs",
  "evolvesFrom",
]);
export const draftSchema = z.strictObject({
  text: z
    .string()
    .min(1)
    .max(limits.inputCharacters)
    .refine((s) => Boolean(s.trim())),
  zone: z.string().min(1).max(80),
  units: z.array(unitDraft).min(1).max(limits.unitsPerTurn),
  fragments: z
    .array(
      z.strictObject({
        start: z.number().int().nonnegative(),
        end: z.number().int().positive(),
        role: z.enum(["primary", "context", "time", "separator", "replaced"]),
        owners: z.array(key).max(limits.unitsPerTurn),
      }),
    )
    .min(1)
    .max(limits.fragmentsPerTurn),
  relations: z
    .array(
      z.strictObject({
        kind: relationKind,
        from: key,
        to: target,
      }),
    )
    .max(32),
});
export const captureSchema = z.strictObject({
  kind: z.literal("capture"),
  requestId: z.uuid(),
  draft: draftSchema,
});
export const correctionSchema = z.strictObject({
  kind: z.literal("correct"),
  requestId: z.uuid(),
  target: referenceSchema,
  preserveTime: z.boolean(),
  retainedEvidence: z
    .array(
      z.strictObject({
        fragmentId: z.uuid(),
        start: z.number().int().nonnegative(),
        end: z.number().int().positive(),
      }),
    )
    .max(limits.fragmentsPerTurn)
    .default([]),
  removeRelations: z.array(z.uuid()).max(32).default([]),
  draft: draftSchema,
});
export const forgetSchema = z.strictObject({
  kind: z.literal("forget"),
  requestId: z.uuid(),
  targets: z.array(referenceSchema).min(1).max(limits.affectedUnits),
  excludeMatches: z.array(referenceSchema).max(limits.affectedUnits),
});
export const enrichmentSchema = z.strictObject({
  kind: z.literal("enrich"),
  requestId: z.uuid(),
  target: referenceSchema,
  draft: draftSchema,
});
export const commandSchema = z.discriminatedUnion("kind", [
  captureSchema,
  correctionSchema,
  forgetSchema,
  enrichmentSchema,
]);

export type Content = z.infer<typeof contentSchema>;
export type EventTime = z.infer<typeof eventTimeSchema>;
export type Reference = z.infer<typeof referenceSchema>;
export type Draft = z.infer<typeof draftSchema>;
export type Command = z.infer<typeof commandSchema>;
export type RelationKind = z.infer<typeof relationKind>;

export function parseId(input: unknown): string {
  const result = z.uuid().safeParse(input);
  if (!result.success) throw new CoreError("invalid_input");
  return result.data;
}

export function parseReferences(input: unknown): Reference[] {
  const result = z
    .array(referenceSchema)
    .min(1)
    .max(limits.affectedUnits)
    .safeParse(input);
  if (
    !result.success ||
    new Set(result.data.map((ref) => ref.id)).size !== result.data.length
  ) {
    throw new CoreError("invalid_input");
  }
  return result.data;
}

export function parseCommand(input: unknown): Command {
  const result = commandSchema.safeParse(input);
  if (!result.success) throw new CoreError("invalid_input");
  return result.data;
}
