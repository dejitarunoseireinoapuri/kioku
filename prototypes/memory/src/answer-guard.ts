import { z } from "zod";
import type { Answer, Candidate, Source } from "./domain.ts";
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

/** Quoted content has no authority to establish the owner's personal facts. */
export function constrainAnswer(
  proposal: Proposal,
  candidates: Candidate[],
  sources: Source[],
  question: string,
): Answer | null {
  const selected = candidates
    .filter(({ memory }) => proposal.memoryIds.includes(memory.id))
    .map(({ memory }) => memory);
  if (proposal.status !== "answered") return null;
  const words = question
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
  const asksQuote =
    /\b(texto|cartel|nota|foro|anuncio|lei|leido|decia|citaba|ponia|citado|documento)\b/u.test(
      words,
    );
  if (selected.some((memory) => memory.provenance === "quoted")) {
    if (!asksQuote) return unsupportedAnswer("quoted_as_personal");
    if (selected.every((memory) => memory.provenance === "quoted")) {
      const quotes = [...new Set(selected.map((memory) => memory.quote))]
        .slice(0, 2)
        .join(" / ")
        .slice(0, 2000);
      return {
        status: "answered",
        answer: `El texto citado decía: «${quotes}». Es contenido citado, no un dato personal confirmado.`,
        sourceIds: [...new Set(selected.map((memory) => memory.sourceId))],
      };
    }
  }
  if (/favorit|preferid|prefier|mas te gusta|mas me gusta/u.test(words)) {
    const cited = sources.filter((source) =>
      proposal.sourceIds.includes(source.id),
    );
    if (
      !cited.some((source) =>
        /favorit|preferid|prefier|preferi|preferí/iu.test(source.text),
      )
    ) {
      return unsupportedAnswer("unsupported_claim");
    }
  }
  return null;
}
