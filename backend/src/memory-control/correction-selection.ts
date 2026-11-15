import { isDeepStrictEqual } from "node:util";
import { duplicateSelectionSchema } from "#memory-core/forget-format";
import type { ForgetEvidence } from "#memory-core/forget-format";
import type { Snapshot } from "#memory-core/domain";
import { AccountError } from "../account/contracts.js";
import type { ChangeIntelligence, SourceBundle } from "./contracts.js";
import { correctionNotice, selectiveChange } from "./selection.js";
import { separateForgetEvidence } from "./forget-evidence.js";
import { withoutVectors } from "./forget-contracts.js";

/** A correction replaces one fact; it never selects additional copies or facts to remove. */
export async function correctionSelection(
  bundle: SourceBundle,
  ids: string[],
  intelligence: ChangeIntelligence,
) {
  const selected = bundle.memories.filter((m) => ids.includes(m.id));
  if (ids.length !== 1 || selected.length !== 1)
    throw new AccountError("failed-precondition");
  try {
    return {
      change: selectiveChange(bundle.source, bundle.memories, ids),
      evidence: [],
    };
  } catch (error) {
    const shared = bundle.memories.some(
      (m) =>
        !ids.includes(m.id) &&
        selected.some(
          (s) => s.quote.includes(m.quote) || m.quote.includes(s.quote),
        ),
    );
    if (
      !(error instanceof AccountError) ||
      error.code !== "failed-precondition" ||
      !shared
    )
      throw error;
  }
  if (!intelligence.selectDuplicateFacts) return null;
  const plan = duplicateSelectionSchema.parse(
    await intelligence.selectDuplicateFacts({
      targets: withoutVectors(selected),
      sources: [bundle.source],
      memories: withoutVectors(bundle.memories),
    }),
  );
  if (
    plan.unresolved ||
    plan.question !== null ||
    plan.memoryIds.length !== 1 ||
    plan.memoryIds[0] !== ids[0]
  )
    return null;
  try {
    return {
      change: separateForgetEvidence(
        bundle.source,
        bundle.memories,
        ids,
        plan.evidence,
      ),
      evidence: plan.evidence,
    };
  } catch (error) {
    if (error instanceof AccountError && error.code === "failed-precondition")
      return null;
    throw error;
  }
}

/** Repeat the literal transformation against the current version before handing it to retirement. */
export function validateCorrectionRetention(
  bundle: SourceBundle,
  ids: string[],
  evidence: ForgetEvidence[],
  snapshot: Snapshot,
) {
  const expected = separateForgetEvidence(
    bundle.source,
    bundle.memories,
    ids,
    evidence,
  ).replacement;
  const retained = snapshot.sources.slice(0, expected.sources.length);
  const normalize = (value: Snapshot) => ({
    sources: value.sources.map(({ id: _id, ...source }) => source),
    memories: value.memories.map(
      ({ id: _id, sourceId: _sourceId, ...memory }) => memory,
    ),
  });
  if (
    snapshot.sources.length !== retained.length + 1 ||
    !snapshot.sources.at(-1)?.text.startsWith(correctionNotice) ||
    !isDeepStrictEqual(
      normalize(expected),
      normalize({
        version: snapshot.version,
        sources: retained,
        memories: snapshot.memories.filter((m) =>
          retained.some((s) => s.id === m.sourceId),
        ),
      }),
    )
  )
    throw new AccountError("failed-precondition");
}
