import { z } from "zod";
import type { QueryEvidence, QueryLease } from "../query/contracts.js";
import type { ChangeIntelligence } from "../memory-control/contracts.js";
import type {
  MessageIntent,
  TargetSelection,
} from "#memory-core/conversation-format";
import { captureInput } from "../memory/contracts.js";

const safeInteger = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
export const routingInput = z
  .strictObject({
    apiVersion: z.literal(1),
    requestId: z.uuid(),
    mode: z.enum(["ask", "tell"]),
    text: z
      .string()
      .min(1)
      .max(8000)
      .refine((value) => Boolean(value.trim())),
    zone: captureInput.shape.zone,
    memoryEpoch: safeInteger,
    context: z.strictObject({
      questions: z.array(z.string().min(1).max(2000)).max(4),
      sourceIds: z.array(z.uuid()).max(6),
    }),
  })
  .refine(
    (value) =>
      (value.mode !== "ask" || value.text.length <= 2000) &&
      value.context.questions.reduce(
        (length, text) => length + text.length,
        0,
      ) <= 2000 &&
      !/sk-[A-Za-z0-9_-]{20,}/u.test(JSON.stringify(value)),
  );
const common = {
  memoryEpoch: safeInteger,
  receivedAt: z.iso.datetime(),
  expiresAtMs: safeInteger,
};
export const routingPlan = z.discriminatedUnion("action", [
  z.strictObject({ ...common, action: z.literal("ask") }),
  z.strictObject({ ...common, action: z.literal("tell") }),
  z.strictObject({
    ...common,
    action: z.literal("offer"),
    fact: z.string().min(1).max(2000),
    alsoAsk: z.boolean(),
  }),
  z.strictObject({
    ...common,
    action: z.enum(["correct", "forget"]),
    sourceId: z.uuid(),
    expectedVersion: z.string().regex(/^[a-f0-9]{64}$/u),
    memoryIds: z.array(z.string().min(1).max(40)).min(1).max(8),
    correction: z.string().min(1).max(2000).nullable(),
  }),
]);
export const decisionInput = z.strictObject({
  apiVersion: z.literal(1),
  requestId: z.uuid(),
  turn: routingInput,
  plan: routingPlan,
  decision: z.enum(["apply", "accept", "reject"]),
});
export type RoutingInput = z.infer<typeof routingInput>;
export type RoutingPlan = z.infer<typeof routingPlan>;
export type DecisionInput = z.infer<typeof decisionInput>;
export interface RoutingLease extends QueryLease {
  receivedAt: string;
}
export type RoutingResult =
  | { apiVersion: 1; operationId: string; status: "ready"; plan: RoutingPlan }
  | {
      apiVersion: 1;
      operationId: string;
      status: "needsClarification";
      text: string;
    }
  | {
      apiVersion: 1;
      operationId: string;
      status: "processing" | "repeatRequired";
    };
export interface RoutingIntelligence extends ChangeIntelligence {
  interpretMessage(data: unknown): Promise<MessageIntent>;
  selectMemoryTarget(data: unknown): Promise<TargetSelection>;
  reviewMessagePlan(data: unknown): Promise<{ allowed: boolean }>;
}
export interface RoutingStore {
  begin(
    uid: string,
    input: RoutingInput,
  ): Promise<RoutingLease | RoutingResult>;
  epoch(uid: string): Promise<number>;
  retrieve(uid: string, text: string, vector: number[]): Promise<QueryEvidence>;
  context(uid: string, sourceId: string): Promise<QueryEvidence>;
  issue(
    uid: string,
    lease: QueryLease,
    epoch: number,
    evidence: QueryEvidence,
    input: RoutingInput,
    plan: RoutingPlan | null,
  ): Promise<void>;
  fail(uid: string, lease: QueryLease): Promise<void>;
  bind(uid: string, input: DecisionInput): Promise<boolean>;
}
