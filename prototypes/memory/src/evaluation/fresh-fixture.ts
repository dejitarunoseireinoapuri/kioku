import type { ExpectedItem, QuerySpec, Scenario } from "./fixture.ts";
import type { MemoryTime } from "../domain.ts";
import { unknownTime } from "../temporal.ts";

type Facets = NonNullable<ExpectedItem["facets"]>;
export function gold(
  terms: string[],
  options: Partial<Facets> = {},
): ExpectedItem {
  const facets: Facets = {
    kinds: ["fact"],
    provenance: "personal",
    attribution: null,
    eventStatuses: ["unspecified"],
    time: unknownTime,
    ...options,
  };
  return {
    terms,
    kind: facets.kinds[0]!,
    date: facets.time.precision === "day" ? facets.time.value : null,
    facets,
  };
}
export function time(
  precision: MemoryTime["precision"],
  value: string | null,
  end: string | null = null,
): MemoryTime {
  return { precision, value, end, quote: null };
}
type Options = {
  receivedAt?: string;
  zone?: string;
  status?: Scenario["status"];
  clarification?: string;
  withdraw?: boolean;
};
export function entry(
  id: string,
  category: string,
  text: string,
  items: ExpectedItem[],
  queries: QuerySpec[],
  options: Options = {},
): Scenario {
  return {
    turn: {
      id,
      text,
      receivedAt: options.receivedAt ?? "2026-11-11T18:00:00+01:00",
      zone: options.zone ?? "Europe/Madrid",
    },
    partition: "validation",
    category,
    items,
    queries,
    status: options.status ?? "saved",
    clarification: options.clarification ?? null,
    withdraw: options.withdraw ?? false,
  };
}
export function ask(
  question: string,
  sources: string[],
  groups: string[][],
  options: Partial<
    Pick<
      QuerySpec,
      | "status"
      | "critical"
      | "allowAbstention"
      | "citationGroups"
      | "at"
      | "forbidden"
    >
  > = {},
): QuerySpec {
  return { question, sources, groups, status: "answered", ...options };
}
export function absent(question: string): QuerySpec {
  return ask(question, [], [], { status: "not_found", critical: true });
}
export function ambiguous(question: string, sources: string[]): QuerySpec {
  return ask(question, sources, [], {
    status: "needs_clarification",
    critical: true,
    citationGroups: [],
  });
}
