import type { Command } from "../src/contracts.ts";
import { InterpretationError } from "./contracts.ts";
import type { Input, Interpretation } from "./contracts.ts";

/** The model selects literals; only server-held evidence supplies IDs and offsets. */
export function materializeRetention(proposal: Interpretation, input: Input) {
  const retained: Extract<Command, { kind: "correct" }>["retainedEvidence"] =
    [];
  if (input.mode !== "correction" || proposal.status !== "ready") {
    if (proposal.retention.length)
      throw new InterpretationError("RETENTION_SCOPE");
    return retained;
  }
  if (!input.target || !input.evidence?.length)
    throw new InterpretationError("CORRECTION_EVIDENCE_REQUIRED");
  const indexes = new Set(proposal.retention.map((p) => p.index));
  if (
    indexes.size !== proposal.retention.length ||
    indexes.size !== input.evidence.length
  )
    throw new InterpretationError("RETENTION_COVERAGE");
  for (const item of proposal.retention) {
    const original = input.evidence[item.index]?.fragment;
    if (!original?.owners.includes(input.target.id))
      throw new InterpretationError("RETENTION_REFERENCE");
    let offset = 0;
    for (const part of item.parts) {
      if (
        original.text.slice(offset, offset + part.literal.length) !==
        part.literal
      )
        throw new InterpretationError("RETENTION_LITERAL");
      const start = offset;
      offset += part.literal.length;
      if (part.keep)
        retained.push({ fragmentId: original.id, start, end: offset });
    }
    if (offset !== original.text.length)
      throw new InterpretationError("RETENTION_COVERAGE");
  }
  return retained;
}
