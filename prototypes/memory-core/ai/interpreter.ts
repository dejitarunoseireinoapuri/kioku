import { draftSchema } from "../src/contracts.ts";
import type { Draft } from "../src/contracts.ts";
import type { Unit } from "../src/model.ts";
import { validateDraft } from "../src/evidence.ts";
import {
  InterpretationError,
  interpretationSchema,
  reviewSchema,
} from "./contracts.ts";
import type { Input, Interpretation, StructuredModel } from "./contracts.ts";
import { calendar } from "./calendar.ts";
import { interpretInstructions, reviewInstructions } from "./prompts.ts";

export function materialize(
  proposal: Interpretation,
  input: Input,
  candidates: Unit[],
): Draft {
  let offset = 0;
  const fragments = proposal.segments.map(({ literal, role, owners }) => {
    if (input.text.slice(offset, offset + literal.length) !== literal)
      throw new InterpretationError("SEGMENT_LITERAL");
    const start = offset;
    offset += literal.length;
    return { start, end: offset, role, owners };
  });
  if (offset !== input.text.length)
    throw new InterpretationError("SEGMENT_COVERAGE");
  const reference = (index: number) => {
    const unit = candidates[index];
    if (!unit) throw new InterpretationError("CANDIDATE_REFERENCE");
    return { id: unit.id, revision: unit.revision };
  };
  const draft = draftSchema.parse({
    text: input.text,
    zone: input.zone,
    units: proposal.units.map((unit) => ({
      ...unit,
      existing: unit.existing === null ? null : reference(unit.existing),
    })),
    fragments,
    relations: proposal.relations.map((relation) => {
      if ((relation.toKey === null) === (relation.toExisting === null))
        throw new InterpretationError("RELATION_REFERENCE");
      return {
        kind: relation.kind,
        from: relation.from,
        to:
          relation.toKey === null
            ? reference(relation.toExisting!)
            : { key: relation.toKey },
      };
    }),
  });
  validateDraft(draft, input.mode === "correction");
  return draft;
}

export class Interpreter {
  readonly model: StructuredModel;
  constructor(model: StructuredModel) {
    this.model = model;
  }
  async interpret(input: Input, candidates: Unit[]) {
    if (input.text.length > 8000 || candidates.length > 32)
      throw new InterpretationError("INPUT_LIMIT");
    const data = {
      ...input,
      calendar: calendar(input.at, input.zone),
      candidates,
    };
    const proposal = await this.model.call(
      "interpret",
      interpretInstructions,
      data,
      interpretationSchema,
      7000,
    );
    if (
      (proposal.status === "clarify") !== Boolean(proposal.question) ||
      (proposal.status !== "ready" &&
        (proposal.units.length ||
          proposal.segments.length ||
          proposal.relations.length ||
          proposal.preserveTime))
    ) {
      throw new InterpretationError("INTERPRETATION_STATE");
    }
    const draft =
      proposal.status === "ready"
        ? materialize(proposal, input, candidates)
        : null;
    const review = await this.model.call(
      "interpret_review",
      reviewInstructions,
      { ...data, proposal },
      reviewSchema,
      1400,
    );
    if (!review.accepted || review.issues.length)
      throw new InterpretationError(
        `REVIEW_${review.issues.join("_") || "REJECTED"}`,
      );
    return { proposal, draft };
  }
}
