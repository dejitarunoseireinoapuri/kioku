import { z } from "zod";
import type { MemoryIntelligence, Snapshot } from "#memory-core/domain";
import type { QueryLease } from "../query/contracts.js";
import type { RetirementScope } from "./retirement.js";
import type { SelectiveChange } from "./selection.js";
import { captureInput } from "../memory/contracts.js";
import type { ForgetStore, ForgetIntelligence } from "./forget-contracts.js";

export const detailsInput = z.strictObject({
  apiVersion: z.literal(1),
  sourceId: z.uuid().optional(),
});
export const changeInput = z
  .strictObject({
    apiVersion: z.literal(1),
    requestId: z.uuid(),
    sourceId: z.uuid(),
    expectedVersion: z.string().regex(/^[a-f0-9]{64}$/u),
    memoryIds: z.array(z.string().max(40)).min(1).max(8),
    action: z.enum(["forget", "correct"]),
    correction: z.string().max(2000).nullable(),
    zone: captureInput.shape.zone,
    forgetScope: z.enum(["source", "allOccurrences"]).optional(),
    continueManagement: z.boolean().optional(),
  })
  .refine((input) =>
    input.action === "correct"
      ? Boolean(input.correction?.trim()) &&
        input.forgetScope !== "allOccurrences" &&
        input.memoryIds.length === 1 &&
        !/sk-[A-Za-z0-9_-]{20,}/u.test(input.correction ?? "")
      : input.correction === null,
  );
export type ChangeInput = z.infer<typeof changeInput>;
export interface SourceDetails {
  apiVersion: 1;
  sourceId: string;
  version: string;
  text: string;
  receivedAt: string;
  memoryEpoch: number;
  items: { id: string; text: string }[];
  sourceKind?: "retained" | "correction";
}
export interface ChangeResult {
  apiVersion: 1;
  operationId: string;
  status: "corrected" | "forgotten" | "processing" | "needsClarification";
  text: string;
  sources: { sourceId: string; receivedAt: string }[];
  memoryEpoch: number;
  changes?: { sourceId: string; sourceIds: string[] }[];
}
export interface SourceBundle {
  scope: RetirementScope;
  source: SelectiveChange["source"];
  memories: SelectiveChange["removed"];
  memoryEpoch: number;
  sourceKind?: "retained" | "correction";
  ownerTextVersion?: 1;
}
export interface ChangeIntelligence
  extends MemoryIntelligence,
    Partial<ForgetIntelligence> {
  reviewSourceChange(data: unknown): Promise<{
    authorized: boolean;
    unrelatedPreserved: boolean;
    noRemovedDataRemains: boolean;
  }>;
}
export interface SourceControlStore extends ForgetStore {
  details(uid: string, id: string): Promise<SourceDetails>;
  epoch(uid: string): Promise<number>;
  begin(uid: string, input: ChangeInput): Promise<QueryLease | ChangeResult>;
  bundle(uid: string, id: string): Promise<SourceBundle>;
  commit(
    uid: string,
    input: ChangeInput,
    scope: RetirementScope,
    snapshot: Snapshot,
    lease: QueryLease,
  ): Promise<ChangeResult>;
  noChange(uid: string, lease: QueryLease, text: string): Promise<ChangeResult>;
  fail(uid: string, lease: QueryLease): Promise<void>;
}
