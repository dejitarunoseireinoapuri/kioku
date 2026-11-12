import { entry as base } from "./fresh-fixture.ts";
export { gold, time, ask, absent, ambiguous } from "./fresh-fixture.ts";
export const evaluationAt4 = "2026-11-26T12:00:00+01:00";
export function entry(...args: Parameters<typeof base>) {
  const value = base(...args);
  return {
    ...value,
    turn: {
      ...value.turn,
      receivedAt: args[5]?.receivedAt ?? "2026-11-19T18:30:00+01:00",
    },
    queries: value.queries.map((q) => ({ ...q, at: q.at ?? evaluationAt4 })),
  };
}
