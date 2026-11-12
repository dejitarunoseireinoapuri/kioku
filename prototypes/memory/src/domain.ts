import { z } from "zod";

export const memoryKinds = ["fact", "intention", "opinion", "thought"] as const;
export const timeSchema = z.strictObject({
  precision: z.enum([
    "unknown",
    "day",
    "month",
    "year",
    "month_day",
    "interval",
  ]),
  value: z.string().max(20).nullable(),
  end: z.string().max(20).nullable(),
  quote: z.string().max(300).nullable(),
});
export const itemSchema = z.strictObject({
  text: z.string().min(1).max(1600),
  quote: z.string().min(1).max(2000),
  kind: z.enum(memoryKinds),
  entities: z.array(z.string().min(1).max(100)).max(12),
  time: timeSchema,
  provenance: z.enum(["personal", "reported", "quoted"]),
  attribution: z.string().max(200).nullable(),
  attributionEvidence: z.string().max(600).nullable(),
  eventStatus: z.enum(["unspecified", "planned", "completed", "not_completed"]),
  lifecycle: z.enum(["current", "historical", "superseded"]),
});
export const extractionSchema = z.strictObject({
  status: z.enum(["saved", "needs_clarification", "ignored"]),
  clarification: z.string().max(500).nullable(),
  items: z.array(itemSchema).max(8),
});
export const answerSchema = z.strictObject({
  status: z.enum(["answered", "not_found", "needs_clarification"]),
  answer: z.string().min(1).max(2400),
  sourceIds: z.array(z.string().max(100)).max(8),
});
export const sourceSchema = z.strictObject({
  id: z.string(),
  text: z.string(),
  receivedAt: z.iso.datetime({ offset: true }),
  zone: z.string(),
});
export const memorySchema = itemSchema.extend({
  id: z.string(),
  sourceId: z.string(),
  revision: z.number().int().positive(),
  receivedAt: z.iso.datetime({ offset: true }),
  zone: z.string(),
  vector: z.array(z.number().finite()).min(1),
});
export const snapshotSchema = z.strictObject({
  version: z.literal(3),
  sources: z.array(sourceSchema),
  memories: z.array(memorySchema),
});
export type Item = z.infer<typeof itemSchema>;
export type MemoryTime = z.infer<typeof timeSchema>;
export type Extraction = z.infer<typeof extractionSchema>;
export type Answer = z.infer<typeof answerSchema>;
export type Source = z.infer<typeof sourceSchema>;
export type Memory = z.infer<typeof memorySchema>;
export type Snapshot = z.infer<typeof snapshotSchema>;
export type Candidate = { memory: Memory; score: number };
export type Turn = {
  id: string;
  text: string;
  receivedAt: string;
  zone: string;
};

export interface MemoryIntelligence {
  extract(turn: Turn, clarification: string | null): Promise<Extraction>;
  embed(texts: string[]): Promise<number[][]>;
  answer(
    question: string,
    at: string,
    candidates: Candidate[],
    sources: Source[],
  ): Promise<Answer>;
}

export interface MemoryRepository {
  load(): Promise<Snapshot>;
  save(snapshot: Snapshot): Promise<void>;
}

export class MemoryError extends Error {
  constructor(code: string) {
    super(code);
    this.name = "MemoryError";
  }
}
