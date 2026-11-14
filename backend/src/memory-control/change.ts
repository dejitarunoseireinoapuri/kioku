import { randomUUID } from "node:crypto";
import { MemoryEngine } from "#memory-core/engine";
import { snapshotVersion } from "#memory-core/domain";
import type { Snapshot } from "#memory-core/domain";
import { AccountError } from "../account/contracts.js";
import type {
  ChangeInput,
  ChangeIntelligence,
  ChangeResult,
  SourceControlStore,
} from "./contracts.js";
import { correctionNotice, selectiveChange } from "./selection.js";
import { scopeVersion } from "./retirement.js";
import { ForgetRepeatedMemory } from "./forget.js";

export class ChangeMemory {
  private readonly store: SourceControlStore;
  private readonly now: () => number;
  constructor(store: SourceControlStore, now = Date.now) {
    this.store = store;
    this.now = now;
  }

  async execute(
    uid: string,
    input: ChangeInput,
    provider: () => Promise<ChangeIntelligence>,
    reauthorize: () => Promise<void>,
  ): Promise<ChangeResult> {
    const work = await this.store.begin(uid, input);
    if ("status" in work) return work;
    try {
      const bundle = await this.store.bundle(uid, input.sourceId);
      if (scopeVersion(bundle.scope) !== input.expectedVersion)
        throw new AccountError("failed-precondition");
      if (input.action === "forget" && input.forgetScope === "allOccurrences") {
        return await new ForgetRepeatedMemory(this.store).execute(
          uid,
          input,
          bundle,
          work,
          await provider(),
          reauthorize,
        );
      }
      const change = selectiveChange(
        bundle.source,
        bundle.memories,
        input.memoryIds,
      );
      let snapshot = change.replacement;
      if (input.action === "correct" || change.kept.length) {
        const intelligence = await provider();
        if (input.action === "correct") {
          let staged: Snapshot = {
            version: snapshotVersion,
            sources: [],
            memories: [],
          };
          const engine = new MemoryEngine(
            {
              load: async () => staged,
              save: async (next) => {
                staged = next;
              },
            },
            intelligence,
          );
          const extraction = await engine.tell({
            id: randomUUID(),
            text: input.correction!,
            zone: input.zone,
            receivedAt: new Date(this.now()).toISOString(),
          });
          if (extraction.status !== "saved") {
            await reauthorize();
            return await this.store.noChange(
              uid,
              work,
              extraction.clarification ??
                "Escribe el dato correcto en una frase completa.",
            );
          }
          snapshot = {
            version: snapshotVersion,
            sources: [
              ...snapshot.sources,
              ...staged.sources.map((source) => ({
                ...source,
                text: correctionNotice + source.text,
              })),
            ],
            memories: [
              ...snapshot.memories,
              ...staged.memories.map((memory) => ({
                ...memory,
                revision:
                  Math.max(...change.removed.map((item) => item.revision)) + 1,
              })),
            ],
          };
        }
        const review = await intelligence.reviewSourceChange({
          action: input.action,
          source: bundle.source,
          removed: change.removed.map((item) => ({ ...item, vector: [] })),
          kept: change.kept.map((item) => ({ ...item, vector: [] })),
          retainedSources: change.replacement.sources,
          correction: input.correction,
          correctedSources: snapshot.sources.filter(
            (source) =>
              !change.replacement.sources.some((kept) => kept.id === source.id),
          ),
        });
        if (
          !review.authorized ||
          !review.unrelatedPreserved ||
          !review.noRemovedDataRemains
        ) {
          await reauthorize();
          return await this.store.noChange(
            uid,
            work,
            "No puedo separar este dato con seguridad. Concreta qué quieres cambiar o escribe la corrección completa.",
          );
        }
      }
      await reauthorize();
      return await this.store.commit(uid, input, bundle.scope, snapshot, work);
    } catch (error) {
      if (
        input.forgetScope === "allOccurrences" &&
        error instanceof AccountError &&
        error.code === "resource-exhausted"
      ) {
        await reauthorize();
        return this.store.noChange(
          uid,
          work,
          "No puedo completar la comprobación dentro de los límites de esta operación. No he borrado nada.",
        );
      }
      await this.store.fail(uid, work).catch(() => undefined);
      throw error;
    }
  }
}
