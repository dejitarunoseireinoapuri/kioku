import { duplicateSelectionSchema } from "#memory-core/forget-format";
import type { Memory, Snapshot } from "#memory-core/domain";
import { snapshotVersion } from "#memory-core/domain";
import { AccountError } from "../account/contracts.js";
import type { QueryLease } from "../query/contracts.js";
import type {
  ChangeInput,
  ChangeIntelligence,
  SourceBundle,
  SourceControlStore,
} from "./contracts.js";
import { scopeVersion } from "./retirement.js";
import { separateForgetEvidence } from "./forget-evidence.js";
import { forgetLimits, withoutVectors } from "./forget-contracts.js";
import type { MemoryInventory, ForgetReplacement } from "./forget-contracts.js";

const clarify =
  "No puedo comprobar todas las copias de ese dato con seguridad. No he borrado nada. Concreta el dato o la persona.";
export class ForgetRepeatedMemory {
  private readonly store: SourceControlStore;
  private readonly now: () => number;
  constructor(store: SourceControlStore, now = Date.now) {
    this.store = store;
    this.now = now;
  }

  async execute(
    uid: string,
    input: ChangeInput,
    seed: SourceBundle,
    work: QueryLease,
    intelligence: ChangeIntelligence,
    reauthorize: () => Promise<void>,
  ) {
    if (
      !intelligence.selectDuplicateFacts ||
      !intelligence.reviewDuplicateFacts
    )
      throw new AccountError("unavailable");
    const deadline = this.now() + 160_000;
    const inTime = () => {
      if (this.now() >= deadline) throw new AccountError("unavailable");
    };
    const inventory = await this.store.inventory(uid, work);
    const targets = seed.memories.filter((memory) =>
      input.memoryIds.includes(memory.id),
    );
    if (
      !targets.length ||
      targets.length !== input.memoryIds.length ||
      new Set(input.memoryIds).size !== input.memoryIds.length
    )
      throw new AccountError("invalid-argument");
    const selected = new Set<string>(),
      replacements: ForgetReplacement[] = [];
    for (const batch of inventoryBatches(inventory.snapshot, targets)) {
      inTime();
      const data = {
        targets: withoutVectors(targets),
        sources: batch.sources,
        memories: withoutVectors(batch.memories),
      };
      const selection = duplicateSelectionSchema.parse(
        await intelligence.selectDuplicateFacts(data),
      );
      inTime();
      if (selection.unresolved || selection.question)
        return this.noChange(
          uid,
          work,
          reauthorize,
          selection.question &&
            !/[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}/iu.test(
              selection.question,
            )
            ? selection.question
            : "No he olvidado nada. No puedo separar ese dato con seguridad.",
        );
      const ids = new Set(selection.memoryIds);
      if (
        ids.size !== selection.memoryIds.length ||
        [...ids].some((id) => !batch.memories.some((m) => m.id === id)) ||
        targets.some(
          (target) =>
            batch.memories.some((m) => m.id === target.id) &&
            !ids.has(target.id),
        ) ||
        new Set(selection.evidence.map((item) => item.memoryId)).size !==
          selection.evidence.length ||
        selection.evidence.some((item) => {
          const memory = batch.memories.find((m) => m.id === item.memoryId);
          return (
            !memory ||
            !batch.memories.some(
              (m) => m.sourceId === memory.sourceId && ids.has(m.id),
            )
          );
        })
      ) {
        throw new AccountError("failed-precondition");
      }
      const changes = batch.sources.flatMap((source) => {
        const memories = batch.memories.filter((m) => m.sourceId === source.id);
        const matched = memories.filter((memory) => ids.has(memory.id));
        return matched.length
          ? [
              separateForgetEvidence(
                source,
                memories,
                matched.map((m) => m.id),
                selection.evidence.filter((item) =>
                  memories.some((m) => m.id === item.memoryId),
                ),
              ),
            ]
          : [];
      });
      const reviewInput = {
        ...data,
        selectedIds: [...ids],
        retainedSources: changes.flatMap((c) => c.replacement.sources),
        retainedMemories: withoutVectors(
          changes.flatMap((c) => c.replacement.memories),
        ),
        evidence: selection.evidence,
      };
      if (JSON.stringify(reviewInput).length > forgetLimits.batchCharacters)
        throw new AccountError("resource-exhausted");
      const review = await intelligence.reviewDuplicateFacts(reviewInput);
      inTime();
      if (review.allowed !== true) return this.noChange(uid, work, reauthorize);
      for (const change of changes) {
        const bundle = inventoryBundle(
          inventory,
          change.source.id,
          seed.scope.expiresAtMs,
        );
        if (
          bundle.source.id === seed.source.id &&
          scopeVersion(bundle.scope) !== input.expectedVersion
        )
          throw new AccountError("failed-precondition");
        replacements.push({
          bundle,
          snapshot: change.replacement,
          selectedIds: change.removed.map((item) => item.id),
          evidence: selection.evidence.filter((item) =>
            bundle.memories.some((m) => m.id === item.memoryId),
          ),
        });
      }
      for (const id of ids) selected.add(id);
      if (replacements.length > forgetLimits.affectedSources)
        throw new AccountError("resource-exhausted");
    }
    if (targets.some((target) => !selected.has(target.id)))
      throw new AccountError("failed-precondition");
    await reauthorize();
    inTime();
    return this.store.forget(
      uid,
      input,
      inventory,
      replacements,
      work,
      deadline,
    );
  }
  private async noChange(
    uid: string,
    work: QueryLease,
    reauthorize: () => Promise<void>,
    question = clarify,
  ) {
    await reauthorize();
    return this.store.noChange(uid, work, question);
  }
}

export function inventoryBatches(
  snapshot: Snapshot,
  targets: Memory[] = [],
): Snapshot[] {
  const batches: Snapshot[] = [];
  let sources: Snapshot["sources"] = [],
    memories: Memory[] = [];
  for (const source of snapshot.sources) {
    const items = snapshot.memories.filter((m) => m.sourceId === source.id);
    const batchCost = (entries: Snapshot["sources"], units: Memory[]) =>
      JSON.stringify({
        targets: withoutVectors(targets),
        sources: entries,
        memories: withoutVectors(units),
        selectedIds: units.map((m) => m.id),
        retainedSources: entries,
        retainedMemories: withoutVectors(units),
        evidence: units.map((m) => ({
          memoryId: m.id,
          quote: m.quote,
          timeQuote: m.time.quote,
          attributionEvidence: m.attributionEvidence,
        })),
      }).length +
      entries.length * 512;
    const cost = batchCost([source], items);
    if (cost > forgetLimits.batchCharacters)
      throw new AccountError("resource-exhausted");
    if (
      batchCost([...sources, source], [...memories, ...items]) >
        forgetLimits.batchCharacters ||
      memories.length + items.length > 64
    ) {
      batches.push({ version: snapshotVersion, sources, memories });
      sources = [];
      memories = [];
    }
    sources.push(source);
    memories.push(...items);
  }
  if (sources.length)
    batches.push({ version: snapshotVersion, sources, memories });
  if (batches.length > forgetLimits.batches)
    throw new AccountError("resource-exhausted");
  return batches;
}

function inventoryBundle(
  inventory: MemoryInventory,
  id: string,
  expiresAtMs: number,
): SourceBundle {
  const source = inventory.snapshot.sources.find((s) => s.id === id)!;
  const memories = inventory.snapshot.memories.filter((m) => m.sourceId === id);
  const sourceVersion = inventory.versions.find(
    (v) => v.collection === "sources" && v.id === id,
  )!.version;
  return {
    source,
    memories,
    memoryEpoch: inventory.memoryEpoch,
    scope: {
      scope: "entireSource",
      sourceId: id,
      sourceVersion,
      expiresAtMs,
      memories: memories.map((m) => ({
        id: m.id,
        version: inventory.versions.find(
          (v) => v.collection === "memories" && v.id === m.id,
        )!.version,
      })),
    },
  };
}
