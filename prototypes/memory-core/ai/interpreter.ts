import { draftSchema } from "../src/contracts.ts";
import type { Draft } from "../src/contracts.ts";
import type { Unit } from "../src/model.ts";
import { validateDraft } from "../src/evidence.ts";
import { InterpretationError, reviewSchema } from "./contracts.ts";
import type { Input, Interpretation, StructuredModel } from "./contracts.ts";
import { calendar } from "./calendar.ts";
import { interpretInstructions, reviewInstructions } from "./prompts.ts";
import { materializeRetention } from "./retention.ts";
import { interventions } from "./interventions.ts";
import {
  expandInterpretation,
  indexedInterpretationSchema,
  indexedText,
} from "./indexed-evidence.ts";

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
    units: proposal.units.map((unit) => {
      if (unit.existing === null) return unit;
      const existing = reference(unit.existing);
      const canonical = candidates[unit.existing]!;
      for (const field of [
        "kind",
        "polarity",
        "subject",
        "attribution",
        "condition",
      ] as const) {
        if (unit.content[field] !== canonical.content[field])
          throw new InterpretationError("REPEAT_ANCHOR_MISMATCH");
      }
      const { fragment: ignored, ...time } = unit.time;
      void ignored;
      if (
        time.precision !== "unknown" &&
        JSON.stringify(time) !== JSON.stringify(canonical.time)
      )
        throw new InterpretationError("REPEAT_TIME_MISMATCH");
      return {
        ...unit,
        existing,
        content: canonical.content,
        time: { ...canonical.time, fragment: unit.time.fragment },
      };
    }),
    fragments,
    ...(input.interventions
      ? {
          interventions: interventions(input)!.map(
            ({ calendar: ignored, ...turn }) => {
              void ignored;
              return turn;
            },
          ),
        }
      : {}),
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
  validateDraft(
    draft,
    input.mode === "correction" || Boolean(draft.interventions),
  );
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
    if (
      input.mode === "correction" &&
      (!input.target || !input.evidence?.length || input.evidence.length > 128)
    )
      throw new InterpretationError("CORRECTION_EVIDENCE_REQUIRED");
    const data = {
      ...input,
      tokens: indexedText(input.text),
      calendar: calendar(input.at, input.zone),
      interventions: interventions(input),
      candidates: candidates.map((unit, index) => ({ index, ...unit })),
      evidence: input.evidence?.map(({ fragment, source }, index) => ({
        index,
        literal: fragment.text,
        tokens: indexedText(fragment.text),
        role: fragment.role,
        recordedAt: source.recordedAt,
        zone: source.zone,
      })),
    };
    const wire = await this.model.call(
      "interpret",
      interpretInstructions,
      data,
      indexedInterpretationSchema,
      7000,
    );
    const proposal = expandInterpretation(wire, input);
    if (
      (proposal.status === "clarify") !== Boolean(proposal.question) ||
      (proposal.status !== "ready" &&
        (proposal.units.length ||
          proposal.segments.length ||
          proposal.relations.length ||
          proposal.retention.length ||
          proposal.preserveTime))
    ) {
      throw new InterpretationError("INTERPRETATION_STATE");
    }
    const draft =
      proposal.status === "ready"
        ? materialize(proposal, input, candidates)
        : null;
    const retainedEvidence = materializeRetention(proposal, input);
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
    return { proposal, draft, retainedEvidence };
  }
}
