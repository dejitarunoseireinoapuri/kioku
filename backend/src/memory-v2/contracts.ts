import { z } from "zod";
import { captureInput as legacyCapture } from "../memory/contracts.js";

const id = z.uuid();
export const envelopeSchema = z
  .strictObject({
    apiVersion: z.literal(2),
    operation: z.enum([
      "state",
      "submit",
      "clarify",
      "operation",
      "source",
      "details",
      "query",
      "change",
      "route",
      "apply",
    ]),
    generation: id.optional(),
    payload: z.record(z.string(), z.unknown()).optional(),
  })
  .refine((v) =>
    v.operation === "state"
      ? !v.generation && !v.payload
      : Boolean(v.generation && v.payload),
  );
export type V2Envelope = z.infer<typeof envelopeSchema>;
export const safeText = z
  .string()
  .min(1)
  .max(8000)
  .refine((s) => Boolean(s.trim()) && !/sk-[A-Za-z0-9_-]{20,}/u.test(s));
export const submitSchema = z.strictObject({
  apiVersion: z.literal(2),
  requestId: id,
  mode: z.literal("tell"),
  channel: z.literal("text"),
  text: safeText,
  zone: legacyCapture.shape.zone,
  expectedEpoch: z.number().int().nonnegative().optional(),
});
export const clarificationSchema = z.strictObject({
  apiVersion: z.literal(2),
  requestId: id,
  clarificationId: id,
  expectedRevision: z.number().int().min(1).max(3),
  text: safeText.max(2000),
});
export const operationSchema = z.strictObject({
  apiVersion: z.literal(2),
  requestId: id,
});
export const sourceSchema = z.strictObject({
  apiVersion: z.literal(2),
  sourceId: id,
});
export const detailsSchema = z.strictObject({
  apiVersion: z.literal(2),
  sourceId: id.optional(),
});
export const querySchema = z.strictObject({
  apiVersion: z.literal(2),
  requestId: id,
  text: safeText.max(2000),
  zone: legacyCapture.shape.zone,
});
export const changeSchema = z
  .strictObject({
    apiVersion: z.literal(2),
    requestId: id,
    sourceId: id,
    expectedVersion: z.string().regex(/^[a-f0-9]{64}$/u),
    memoryIds: z.array(id).min(1).max(8),
    action: z.enum(["correct", "forget"]),
    correction: safeText.max(2000).nullable(),
    zone: legacyCapture.shape.zone,
    continueManagement: z.boolean().optional(),
    forgetScope: z.enum(["source", "allOccurrences"]).optional(),
  })
  .refine(
    (v) =>
      new Set(v.memoryIds).size === v.memoryIds.length &&
      (v.action === "forget"
        ? v.correction === null
        : v.memoryIds.length === 1 && v.correction !== null),
  );
export type Submit = z.infer<typeof submitSchema>;
export type Clarify = z.infer<typeof clarificationSchema>;
export type Change = z.infer<typeof changeSchema>;

export type V2Reply = Record<string, unknown>;
export interface PendingTurn {
  text: string;
  at: string;
  zone: string;
  clarification?: { original: string; question: string };
  interventions?: { text: string; at: string; zone: string }[];
}
export interface WorkLease {
  requestId: string;
  nonce: string;
  generation: string;
  epoch: number;
  expiresAt: number;
  turn: PendingTurn | null;
}
