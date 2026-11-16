import type { EventTime, Content } from "../src/contracts.ts";
export type Family =
  | "independent"
  | "shared"
  | "condition"
  | "attribution"
  | "time"
  | "duplicate"
  | "similar"
  | "correction"
  | "ambiguity"
  | "forget";
export interface GoldUnit {
  label: string;
  terms: string[];
  kind: Content["kind"] | Content["kind"][];
  time: EventTime;
  condition: string | null;
  attribution: string | null;
  polarity: Content["polarity"];
  forbidden?: string[];
}
export interface GoldQuery {
  contextLabels?: string[];
  text: string;
  labels: string[];
  terms: string[];
  forbidden?: string[];
  status?: "answered" | "not_found" | "clarify";
  previous?: string;
}
export interface Scenario {
  id: string;
  family: Family;
  text: string;
  at: string;
  zone: string;
  status: "ready" | "clarify" | "no_memory";
  units: GoldUnit[];
  queries: GoldQuery[];
  clarification?: string;
  clarificationAt?: string;
  clarificationZone?: string;
  repeat?: { text: string; count: number };
  correction?: {
    label: string;
    text: string;
    expected: GoldUnit;
    query: GoldQuery;
  };
  forget: string[];
  after: GoldQuery[];
}
export const unknown: EventTime = {
  precision: "unknown",
  value: null,
  end: null,
};
export const day = (value: string): EventTime => ({
  precision: "day",
  value,
  end: null,
});
export function unit(
  label: string,
  terms: string[],
  kind: GoldUnit["kind"] = "intention",
  time: EventTime = unknown,
  extra: Partial<GoldUnit> = {},
): GoldUnit {
  return {
    label,
    terms,
    kind,
    time,
    condition: null,
    attribution: null,
    polarity: "positive",
    ...extra,
  };
}
export function ask(
  text: string,
  labels: string[],
  terms: string[] = [],
  extra: Partial<GoldQuery> = {},
): GoldQuery {
  return { text, labels, terms, ...extra };
}
export function scenario(
  id: string,
  family: Family,
  text: string,
  units: GoldUnit[],
  queries: GoldQuery[],
  extra: Partial<Scenario> = {},
): Scenario {
  const first = units[0];
  return {
    id,
    family,
    text,
    units,
    queries,
    at: "2026-07-14T18:00:00Z",
    zone: "Europe/Madrid",
    status: "ready",
    forget: first ? [first.label] : [],
    after: queries.map((q) => ({
      ...q,
      contextLabels: (q.contextLabels ?? []).filter(
        (label) => label !== first?.label,
      ),
      labels: q.labels.filter((label) => label !== first?.label),
      terms: q.labels.includes(first?.label ?? "") ? [] : q.terms,
      status: q.labels.includes(first?.label ?? "")
        ? "not_found"
        : (q.status ?? (q.labels.length ? "answered" : "not_found")),
    })),
    ...extra,
  };
}
