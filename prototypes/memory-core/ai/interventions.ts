import type { Input } from "./contracts.ts";
import { InterpretationError } from "./contracts.ts";
import { calendar } from "./calendar.ts";

/** Only the trusted admission layer supplies times; the model never chooses them. */
export function interventions(input: Input) {
  if (!input.interventions) return undefined;
  const turns = input.interventions;
  if (
    input.mode !== "capture" ||
    !input.clarification ||
    turns.length < 2 ||
    turns.length > 4 ||
    turns.map((t) => t.text).join("\n") !== input.text ||
    turns[0]!.text !== input.clarification.original
  )
    throw new InterpretationError("INTERVENTION_SCOPE");
  let offset = 0,
    previous = -1;
  return turns.map((turn, index) => {
    const recordedAt = Date.parse(turn.at);
    if (
      !turn.text.trim() ||
      !Number.isFinite(recordedAt) ||
      recordedAt < previous ||
      recordedAt > Date.parse(input.at)
    )
      throw new InterpretationError("INTERVENTION_TIME");
    previous = recordedAt;
    const start = offset;
    offset += turn.text.length + Number(index < turns.length - 1);
    return {
      start,
      end: offset,
      recordedAt,
      zone: turn.zone,
      calendar: calendar(turn.at, turn.zone),
    };
  });
}
