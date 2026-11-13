import { z } from "zod";
import type { Snapshot } from "#memory-core/domain";

export const queryInput = z.strictObject({
  apiVersion: z.literal(1),
  requestId: z.uuid(),
  text: z
    .string()
    .min(1)
    .max(2000)
    .refine((text) => Boolean(text.trim())),
});
export type QueryInput = z.infer<typeof queryInput>;
export interface QueryLease {
  requestId: string;
  nonce: string;
}
export interface EvidenceVersion {
  collection: "sources" | "memories";
  id: string;
  version: string;
}
export interface QueryEvidence {
  snapshot: Snapshot;
  versions: EvidenceVersion[];
}
export interface QueryResult {
  apiVersion: 1;
  operationId: string;
  status:
    | "answered"
    | "notFound"
    | "needsClarification"
    | "processing"
    | "repeatRequired";
  text: string;
  sources: { sourceId: string; receivedAt: string }[];
}
export interface QueryStore {
  begin(uid: string, input: QueryInput): Promise<QueryLease | QueryResult>;
  retrieve(
    uid: string,
    question: string,
    vector: number[],
  ): Promise<QueryEvidence>;
  finish(
    uid: string,
    lease: QueryLease,
    evidence: QueryEvidence,
  ): Promise<void>;
  fail(uid: string, lease: QueryLease): Promise<void>;
}
export function queryStatus(
  id: string,
  status: "processing" | "repeatRequired",
): QueryResult {
  return { apiVersion: 1, operationId: id, status, text: "", sources: [] };
}
