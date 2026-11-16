import {
  answerSchema,
  reviewSchema,
  InterpretationError,
} from "./contracts.ts";
import type { StructuredModel } from "./contracts.ts";
import type { Harness } from "../fixtures/harness.ts";
import { calendar } from "./calendar.ts";
import {
  answerInstructions,
  answerReviewInstructions,
  queryScopeInstructions,
} from "./prompts.ts";

export async function query(
  model: StructuredModel,
  h: Harness,
  question: string,
  at: string,
  zone: string,
  previousQuestion?: string,
) {
  const ids = Object.keys(h.store.read().units);
  if (ids.length > 32) throw new InterpretationError("QUERY_CATALOG_LIMIT");
  const packet = ids.length ? h.engine.evidence(h.owner, ids) : null;
  const epoch = h.store.read().epoch;
  const input = {
    question,
    previousQuestion: previousQuestion ?? null,
    calendar: calendar(at, zone),
    evidence: packet?.items.map((item, index) => ({ index, ...item })) ?? [],
  };
  const answer = await model.call(
    "answer",
    `${answerInstructions}\n${queryScopeInstructions}`,
    input,
    answerSchema,
    1500,
  );
  if (
    new Set(answer.evidence).size !== answer.evidence.length ||
    answer.evidence.some((i) => !ids[i]) ||
    (answer.status === "answered" && answer.evidence.length === 0)
  )
    throw new InterpretationError("ANSWER_EVIDENCE");
  const review = await model.call(
    "answer_review",
    answerReviewInstructions,
    { ...input, answer },
    reviewSchema,
    1000,
  );
  if (!review.accepted || review.issues.length)
    throw new InterpretationError(
      `ANSWER_REVIEW_${review.issues.join("_") || "REJECTED"}`,
    );
  if (packet) h.engine.revalidate(h.owner, packet);
  else if (epoch !== h.store.read().epoch)
    throw new InterpretationError("ANSWER_STALE");
  return { ...answer, ids: answer.evidence.map((i) => ids[i]!) };
}
