import { z } from "zod";

export const memoryKinds = ["fact", "intention", "opinion", "thought"] as const;
export const itemSchema = z.strictObject({
  text: z.string().min(1).max(1600),
  quote: z.string().min(1).max(2000),
  kind: z.enum(memoryKinds),
  entities: z.array(z.string().min(1).max(100)).max(12),
  occurredOn: z.iso.date().nullable(),
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
  version: z.literal(1),
  sources: z.array(sourceSchema),
  memories: z.array(memorySchema),
});
export type Item = z.infer<typeof itemSchema>;
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
