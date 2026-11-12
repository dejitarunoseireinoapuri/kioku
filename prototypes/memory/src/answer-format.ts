import { z } from "zod";
import { MemoryError, answerSchema } from "./domain.ts";
import type { Answer, Candidate } from "./domain.ts";
import {
  providerProposalSchema,
  attachSelectedMemories,
  unsupportedAnswer,
} from "./answer-guard.ts";
import type { Proposal, AnswerScope } from "./answer-guard.ts";

/** Foreign evidence cannot be selected, and source IDs never require a second model choice. */
export function answerFormat(candidates: Candidate[]) {
  const ids = candidates.map(({ memory }) => memory.id);
  const allowed = z.enum(
    (ids.length ? ids : ["no_evidence"]) as [string, ...string[]],
  );
  const schema = providerProposalSchema.extend({
    evidenceIds: z.array(allowed).max(8),
  });
  function materialize(input: unknown) {
    const selected = schema.parse(input);
    return {
      scope: selected.scope,
      proposal: attachSelectedMemories(selected, candidates),
    };
  }
  return { schema, materialize };
}

/** The verifier must independently agree on question scope; keywords are never authority. */
export function constrainScope(
  proposal: Proposal,
  candidates: Candidate[],
  scope: AnswerScope,
  verifiedScope: AnswerScope,
): Answer | null {
  if (scope !== verifiedScope) return unsupportedAnswer("quoted_as_personal");
  const selected = candidates
    .filter(({ memory }) => proposal.memoryIds.includes(memory.id))
    .map((c) => c.memory);
  const quoted = selected.filter((memory) => memory.provenance === "quoted");
  if (scope === "memory")
    return quoted.length ? unsupportedAnswer("quoted_as_personal") : null;
  if (proposal.status !== "answered") return null;
  if (
    !quoted.length ||
    (scope === "mixed" && quoted.length === selected.length)
  )
    return unsupportedAnswer("quoted_as_personal");
  if (scope === "mixed") return null;
  if (quoted.length !== selected.length)
    return unsupportedAnswer("quoted_as_personal");
  const literal = [...new Set(quoted.map((memory) => memory.quote))].join(
    " / ",
  );
  if (literal.length > 2300) throw new MemoryError("ANSWER_QUOTE_LIMIT");
  return answerSchema.parse({
    status: "answered",
    answer: `El contenido citado decía: «${literal}». Es una cita, no un dato personal confirmado.`,
    sourceIds: [...new Set(quoted.map((memory) => memory.sourceId))],
  });
}
