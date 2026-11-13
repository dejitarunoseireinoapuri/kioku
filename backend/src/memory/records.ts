import { createHash } from "node:crypto";
import { z } from "zod";
import { sourceSchema } from "#memory-core/domain";
import { AccountError } from "../account/contracts.js";
import type {
  CaptureInput,
  CaptureResult,
  ClarificationInput,
} from "./contracts.js";

export const pendingSchema = z.strictObject({
  turn: sourceSchema,
  clarification: z.string().max(2000).nullable(),
  revision: z.number().int().min(1).max(3),
  rootHash: z.string().regex(/^[a-f0-9]{64}$/),
});
export const recordSchema = z.object({
  inputHash: z.string().regex(/^[a-f0-9]{64}$/),
  state: z.enum([
    "processing",
    "needsClarification",
    "saved",
    "ignored",
    "failed",
    "continued",
    "needsRetelling",
  ]),
  nonce: z.uuid(),
  attempts: z.number().int().min(1).max(3),
  expiresAtMs: z.number().int().positive(),
  pending: pendingSchema.nullable(),
  question: z.string().max(500).nullable(),
  sourceId: z.uuid().nullable(),
  memoryCount: z.number().int().min(0).max(8),
  continuationId: z.uuid().nullable(),
});
export type CaptureRecord = z.infer<typeof recordSchema>;
export function inputHash(
  uid: string,
  input: CaptureInput | ClarificationInput,
): string {
  // The random request ID and owner are part of the digest; it is never a global text fingerprint.
  return createHash("sha256")
    .update(JSON.stringify([uid, input]))
    .digest("hex");
}
export function readRecord(value: unknown): CaptureRecord {
  const parsed = recordSchema.safeParse(value);
  if (!parsed.success) throw new AccountError("failed-precondition");
  return parsed.data;
}
export function recordResult(
  id: string,
  record: CaptureRecord,
  now: number,
): CaptureResult {
  const common = { apiVersion: 1 as const, operationId: id };
  if (record.state === "saved" && record.sourceId) {
    return {
      ...common,
      status: "saved",
      sourceId: record.sourceId,
      memoryCount: record.memoryCount,
    };
  }
  if (record.expiresAtMs <= now) return { ...common, status: "expired" };
  if (
    record.state === "needsClarification" &&
    record.pending &&
    record.question
  ) {
    return {
      ...common,
      status: "needsClarification",
      clarificationId: id,
      revision: record.pending.revision,
      question: record.question,
    };
  }
  return {
    ...common,
    status:
      record.state === "continued"
        ? "processing"
        : (record.state as
            | "processing"
            | "failed"
            | "ignored"
            | "needsRetelling"),
  };
}
