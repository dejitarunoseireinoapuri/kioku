import { z } from "zod";
import {
  contentSchema,
  eventTimeSchema,
  referenceSchema,
} from "#memory-v2/src/contracts";

const id = z.uuid();
const integer = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
export const runtimeSchema = z.object({
  schemaVersion: z.literal(2),
  status: z.enum(["active", "maintenance"]),
  generation: id,
  revision: integer,
});
export type V2Runtime = z.infer<typeof runtimeSchema>;
export const groupSchema = z.strictObject({
  id,
  unitIds: z.array(id).min(1).max(8),
  recordedAt: integer,
  changed: z.boolean(),
});
export type MemoryGroup = z.infer<typeof groupSchema>;
export const recordSchemas = {
  units: z.strictObject({
    id,
    revision: integer.min(1),
    membershipRevision: integer,
    content: contentSchema,
    time: eventTimeSchema,
    timeEvidenceId: id.nullable(),
    recordedAt: integer,
    updatedAt: integer,
  }),
  sources: z.strictObject({
    id,
    kind: z.enum(["capture", "correction", "enrichment"]),
    recordedAt: integer,
    zone: z.string().min(1).max(80),
    length: integer.max(8000),
  }),
  fragments: z.strictObject({
    id,
    sourceId: id,
    start: integer,
    end: integer,
    text: z.string().min(1).max(8000),
    role: z.enum(["primary", "context", "time", "separator"]),
    owners: z.array(id).min(1).max(8),
  }),
  occurrences: z.strictObject({
    id,
    unitId: id,
    sourceId: id,
    fragmentIds: z.array(id).min(1).max(128),
  }),
  relations: z.strictObject({
    id,
    from: id,
    to: id,
    kind: z.enum(["requires", "possibleSameAs", "evolvesFrom"]),
  }),
  projections: z.strictObject({
    unitId: id,
    revision: integer.min(1),
    terms: z.array(z.string().max(2000)).max(16000),
  }),
  revocations: z.strictObject({
    operationId: id,
    epoch: integer,
    revision: integer.min(1),
  }),
  admissions: z.strictObject({
    digest: z.string().regex(/^[a-f0-9]{64}$/u),
    epoch: integer,
    planId: id.nullable(),
  }),
  receipts: z.strictObject({
    requestId: id,
    kind: z.enum(["capture", "correct", "forget", "enrich"]),
    status: z.literal("committed"),
    refs: z.array(referenceSchema).max(32),
    epoch: integer,
    expiresAt: integer,
  }),
} as const;
export const canonicalTables = [
  "units",
  "sources",
  "fragments",
  "occurrences",
  "relations",
  "projections",
] as const;
export const tables = [
  ...canonicalTables,
  "revocations",
  "admissions",
  "receipts",
] as const;
export type Table = (typeof tables)[number];
export const collectionNames: Record<Table, string> = {
  units: "memoryV2Units",
  sources: "memoryV2Sources",
  fragments: "memoryV2Fragments",
  occurrences: "memoryV2Occurrences",
  relations: "memoryV2Relations",
  projections: "memoryV2Projections",
  revocations: "memoryV2Revocations",
  admissions: "memoryV2Admissions",
  receipts: "memoryV2Receipts",
};
