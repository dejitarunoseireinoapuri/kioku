import type {
  Content,
  EventTime,
  Reference,
  RelationKind,
} from "./contracts.ts";

export interface Unit {
  id: string;
  revision: number;
  membershipRevision: number;
  content: Content;
  time: EventTime;
  timeEvidenceId: string | null;
  recordedAt: number;
  updatedAt: number;
}
export interface Fragment {
  id: string;
  sourceId: string;
  start: number;
  end: number;
  text: string;
  role: "primary" | "context" | "time" | "separator";
  owners: string[];
}
export interface SourceEnvelope {
  id: string;
  kind: "capture" | "correction" | "enrichment";
  recordedAt: number;
  zone: string;
  length: number;
}
export interface Occurrence {
  id: string;
  unitId: string;
  sourceId: string;
  fragmentIds: string[];
}
export interface Relation {
  id: string;
  from: string;
  to: string;
  kind: RelationKind;
}
export interface Projection {
  unitId: string;
  revision: number;
  terms: string[];
}
export interface Receipt {
  requestId: string;
  kind: "capture" | "correct" | "forget" | "enrich";
  status: "committed";
  refs: Reference[];
  epoch: number;
  expiresAt: number;
}
export interface Admission {
  digest: string;
  epoch: number;
  planId: string | null;
}
export interface Revocation {
  operationId: string;
  epoch: number;
  revision: number;
}
export interface Snapshot {
  schemaVersion: 2;
  ownerId: string;
  epoch: number;
  units: Record<string, Unit>;
  sources: Record<string, SourceEnvelope>;
  fragments: Record<string, Fragment>;
  occurrences: Record<string, Occurrence>;
  relations: Record<string, Relation>;
  projections: Record<string, Projection>;
  revocations: Record<string, Revocation>;
  admissions: Record<string, Admission>;
  receipts: Record<string, Receipt>;
}
export interface Runtime {
  now(): number;
  id(): string;
  digest(value: string): string;
}
export interface MemoryStore {
  read(): Snapshot;
  commit(expectedEpoch: number, next: Snapshot): void;
}

export function emptySnapshot(ownerId: string): Snapshot {
  return {
    schemaVersion: 2,
    ownerId,
    epoch: 0,
    units: {},
    sources: {},
    fragments: {},
    occurrences: {},
    relations: {},
    projections: {},
    revocations: {},
    admissions: {},
    receipts: {},
  };
}
