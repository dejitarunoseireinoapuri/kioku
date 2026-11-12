import { z } from "zod";
import type { Answer, Candidate } from "./domain.ts";
import { MemoryError } from "./domain.ts";

export const proposalSchema = z.strictObject({
  status: z.enum(["answered", "not_found", "needs_clarification"]),
  answer: z.string().min(1).max(2400),
  sourceIds: z.array(z.string().max(100)).max(8),
  memoryIds: z.array(z.string().max(100)).max(8),
});
export const verificationSchema = z.strictObject({
  supported: z.boolean(),
  status: z.enum(["answered", "not_found", "needs_clarification"]),
  problem: z.enum([
    "none",
    "ambiguous_identity",
    "unsupported_claim",
    "wrong_time",
    "quoted_as_personal",
  ]),
});
export type Proposal = z.infer<typeof proposalSchema>;
export const answerScopes = ["memory", "quotation", "mixed"] as const;
export type AnswerScope = (typeof answerScopes)[number];
export const scopedVerificationSchema = verificationSchema.extend({
  scope: z.enum(answerScopes),
});
export const providerProposalSchema = proposalSchema
  .omit({ memoryIds: true, sourceIds: true })
  .extend({
    scope: z.enum(answerScopes),
    evidenceIds: z.array(z.string().max(100)).max(8),
  });

/** The model selects current evidence once; application code derives its source citations. */
export function attachSelectedMemories(
  proposal: z.infer<typeof providerProposalSchema>,
  candidates: Candidate[],
): Proposal {
  const allowed = new Map(candidates.map(({ memory }) => [memory.id, memory]));
  if (proposal.evidenceIds.some((id) => !allowed.has(id)))
    throw new MemoryError("ANSWER_MEMORY_INVALID");
  const memoryIds = [...new Set(proposal.evidenceIds)];
  return {
    status: proposal.status,
    answer: proposal.answer,
    sourceIds: [...new Set(memoryIds.map((id) => allowed.get(id)!.sourceId))],
    memoryIds,
  };
}

/** An explicit absence is not a successful lookup; a verifier cannot promote an abstention. */
export function normalizeAnswerStatus<T extends Answer>(
  answer: T,
): Omit<T, "status"> & Pick<Answer, "status"> {
  if (
    answer.status === "answered" &&
    /^\s*(?:no consta\b|no tengo (?:evidencia|informaci[oó]n|datos)\b|no hay (?:evidencia|informaci[oó]n|datos)\b)/iu.test(
      answer.answer,
    )
  )
    return { ...answer, status: "not_found" };
  return answer;
}

export function verifiedAnswer(
  answer: Answer,
  check: z.infer<typeof verificationSchema>,
): Answer {
  if (!check.supported) return unsupportedAnswer(check.problem);
  return normalizeAnswerStatus({
    ...answer,
    status:
      answer.status !== "answered" && check.status === "answered"
        ? answer.status
        : check.status,
  });
}

export function validateProposal(
  proposal: Proposal,
  candidates: Candidate[],
): Answer {
  const allowed = new Map(candidates.map(({ memory }) => [memory.id, memory]));
  if (proposal.memoryIds.some((id) => !allowed.has(id)))
    throw new MemoryError("ANSWER_MEMORY_INVALID");
  const evidence = proposal.memoryIds.map((id) => allowed.get(id)!);
  if (
    proposal.status === "answered" &&
    (evidence.length === 0 || proposal.sourceIds.length === 0)
  ) {
    throw new MemoryError("ANSWER_EVIDENCE_INVALID");
  }
  const sourceIds = new Set(evidence.map((memory) => memory.sourceId));
  if (proposal.sourceIds.some((id) => !sourceIds.has(id)))
    throw new MemoryError("ANSWER_CITATION_INVALID");
  return {
    status: proposal.status,
    answer: proposal.answer,
    sourceIds: proposal.sourceIds,
  };
}

export function unsupportedAnswer(problem: string): Answer {
  if (problem === "ambiguous_identity")
    return {
      status: "needs_clarification",
      answer: "¿A cuál de las personas o recuerdos te refieres?",
      sourceIds: [],
    };
  return {
    status: "not_found",
    answer: "No tengo evidencia suficiente para responder con ese dato.",
    sourceIds: [],
  };
}
