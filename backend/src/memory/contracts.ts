import { z } from "zod";
import { AccountError } from "../account/contracts.js";
import type { Turn, Snapshot, Extraction } from "#memory-core/domain";

const text = z
  .string()
  .min(1)
  .max(8000)
  .refine((value) => Boolean(value.trim()));
const zone = z
  .string()
  .min(1)
  .max(80)
  .refine((value) => {
    try {
      new Intl.DateTimeFormat("es", { timeZone: value });
      return true;
    } catch {
      return false;
    }
  });
export const captureInput = z.strictObject({
  apiVersion: z.literal(1),
  requestId: z.uuid(),
  mode: z.literal("tell"),
  channel: z.literal("text"),
  text,
  zone,
});
export const clarificationInput = z.strictObject({
  apiVersion: z.literal(1),
  requestId: z.uuid(),
  clarificationId: z.uuid(),
  expectedRevision: z.number().int().min(1).max(3),
  text: text.max(2000),
});
export const operationInput = z.strictObject({
  apiVersion: z.literal(1),
  requestId: z.uuid(),
});
export const sourceInput = z.strictObject({
  apiVersion: z.literal(1),
  sourceId: z.uuid(),
});
export type CaptureInput = z.infer<typeof captureInput>;
export type ClarificationInput = z.infer<typeof clarificationInput>;
export type CaptureResult =
  | {
      apiVersion: 1;
      status: "saved";
      operationId: string;
      sourceId: string;
      memoryCount: number;
    }
  | {
      apiVersion: 1;
      status: "needsClarification";
      operationId: string;
      clarificationId: string;
      revision: number;
      question: string;
    }
  | {
      apiVersion: 1;
      status:
        | "ignored"
        | "processing"
        | "failed"
        | "expired"
        | "needsRetelling";
      operationId: string;
    };
export interface PendingCapture {
  turn: Turn;
  clarification: string | null;
  revision: number;
  rootHash: string;
}
export interface CaptureLease {
  requestId: string;
  nonce: string;
  pending: PendingCapture;
}
export type CaptureWork = { lease: CaptureLease } | { result: CaptureResult };
export interface CaptureStore {
  begin(
    uid: string,
    input: CaptureInput | ClarificationInput,
  ): Promise<CaptureWork>;
  finish(
    uid: string,
    lease: CaptureLease,
    extraction: Extraction,
    snapshot: Snapshot,
  ): Promise<CaptureResult>;
  fail(uid: string, lease: CaptureLease): Promise<void>;
  operation(uid: string, id: string): Promise<CaptureResult>;
  source(
    uid: string,
    id: string,
  ): Promise<{ sourceId: string; text: string; receivedAt: string }>;
}
export function parseInput<T>(schema: z.ZodType<T>, input: unknown): T {
  const parsed = schema.safeParse(input);
  if (!parsed.success) throw new AccountError("invalid-argument");
  const content =
    "text" in Object(parsed.data) ? (parsed.data as { text: string }).text : "";
  if (/sk-[A-Za-z0-9_-]{20,}/u.test(content))
    throw new AccountError("invalid-argument");
  return parsed.data;
}
