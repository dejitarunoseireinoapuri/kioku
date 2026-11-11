import type { Turn } from "../domain.ts";

// Entirely synthetic. Expectations stay in the evaluator and never enter model prompts.
export type ExpectedItem = {
  terms: string[];
  kind: "fact" | "intention" | "opinion" | "thought";
  date: string | null;
};
export type QuerySpec = {
  question: string;
  status: "answered" | "not_found" | "needs_clarification";
  sources: string[];
  groups: string[][];
  forbidden?: string[];
  critical?: boolean;
  allowAbstention?: boolean;
};
export type Scenario = {
  turn: Turn;
  partition: "tuning" | "validation";
  category: string;
  status: "saved" | "needs_clarification" | "ignored";
  clarification: string | null;
  items: ExpectedItem[];
  withdraw: boolean;
  queries: QuerySpec[];
};
export const item = (
  terms: string[],
  kind: ExpectedItem["kind"] = "fact",
  date: string | null = null,
): ExpectedItem => ({ terms, kind, date });
export const yes = (
  question: string,
  source: string,
  groups: string[][],
  critical = false,
  allowAbstention = false,
): QuerySpec => ({
  question,
  status: "answered",
  sources: [source],
  groups,
  critical,
  allowAbstention,
});
export const no = (question: string): QuerySpec => ({
  question,
  status: "not_found",
  sources: [],
  groups: [["no consta", "no tengo", "no hay", "no encuentro"]],
  critical: true,
});
export const unclear = (question: string): QuerySpec => ({
  question,
  status: "needs_clarification",
  sources: [],
  groups: [["cual", "quien", "que pablo", "a que"]],
  critical: true,
});

export function scenario(
  id: string,
  category: string,
  text: string,
  items: ExpectedItem[],
  queries: QuerySpec[],
  options: Partial<
    Pick<Scenario, "status" | "clarification" | "withdraw">
  > = {},
): Scenario {
  return {
    turn: {
      id,
      text,
      receivedAt: "2026-11-11T18:00:00+01:00",
      zone: "Europe/Madrid",
    },
    partition: id.startsWith("t") ? "tuning" : "validation",
    category,
    status: options.status ?? "saved",
    clarification: options.clarification ?? null,
    withdraw: options.withdraw ?? false,
    items,
    queries,
  };
}
