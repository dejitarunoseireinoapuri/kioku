import type { Snapshot, Memory } from "#memory-core/domain";
import type { ForgetEvidence } from "#memory-core/forget-format";
import type { QueryLease, EvidenceVersion } from "../query/contracts.js";
import type { ChangeInput, ChangeResult, SourceBundle } from "./contracts.js";

export const forgetLimits = {
  sources: 128,
  memories: 512,
  characters: 180_000,
  batchCharacters: 48_000,
  batches: 16,
  affectedSources: 32,
  writes: 400,
} as const;
export interface MemoryInventory {
  snapshot: Snapshot;
  versions: EvidenceVersion[];
  memoryEpoch: number;
  ownerTextSourceIds?: string[];
}
export interface ForgetReplacement {
  bundle: SourceBundle;
  snapshot: Snapshot;
  selectedIds: string[];
  evidence?: ForgetEvidence[];
}
export interface ForgetStore {
  inventory(uid: string, lease: QueryLease): Promise<MemoryInventory>;
  forget(
    uid: string,
    input: ChangeInput,
    inventory: MemoryInventory,
    replacements: ForgetReplacement[],
    lease: QueryLease,
    deadlineMs: number,
  ): Promise<ChangeResult>;
}
export interface ForgetIntelligence {
  selectDuplicateFacts(data: unknown): Promise<{
    memoryIds: string[];
    evidence: ForgetEvidence[];
    unresolved: boolean;
    question: string | null;
  }>;
  reviewDuplicateFacts(data: unknown): Promise<{ allowed: boolean }>;
}
export function withoutVectors(memories: Memory[]) {
  return memories.map(({ vector: _vector, ...memory }) => memory);
}
