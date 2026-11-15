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
import { interpretCapture } from "../memory/interpretation.js";
import { correctionSelection } from "./correction-selection.js";
import type { ForgetEvidence } from "#memory-core/forget-format";

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
      let intelligence: ChangeIntelligence | undefined;
      let corrected: Snapshot | undefined;
      if (input.action === "correct") {
        if (
          input.memoryIds.length !== 1 ||
          !bundle.memories.some((m) => m.id === input.memoryIds[0])
        )
          throw new AccountError("failed-precondition");
        intelligence = await provider();
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
        const extraction = await interpretCapture(engine, {
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
            "No he modificado el recuerdo. " +
              (extraction.clarification ??
                "Escribe el dato correcto en una frase completa, con las palabras separadas."),
          );
        }
        corrected = staged;
      }
      const selection =
        input.action === "correct"
          ? await correctionSelection(bundle, input.memoryIds, intelligence!)
          : {
              change: selectiveChange(
                bundle.source,
                bundle.memories,
                input.memoryIds,
              ),
              evidence: [],
            };
      if (!selection) {
        await reauthorize();
        return this.store.noChange(
          uid,
          work,
          "No he modificado el recuerdo. No puedo cambiar este dato sin alterar otro recuerdo relacionado.",
        );
      }
      const change = selection.change;
      const evidence: ForgetEvidence[] = selection.evidence;
      let snapshot = change.replacement;
      if (corrected) {
        snapshot = {
          version: snapshotVersion,
          sources: [
            ...snapshot.sources,
            ...corrected.sources.map((source) => ({
              ...source,
              text: correctionNotice + source.text,
            })),
          ],
          memories: [
            ...snapshot.memories,
            ...corrected.memories.map((memory) => ({
              ...memory,
              revision:
                Math.max(...change.removed.map((item) => item.revision)) + 1,
            })),
          ],
        };
      }
      if (input.action === "correct" || change.kept.length) {
        intelligence ??= await provider();
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
      return await this.store.commit(
        uid,
        input,
        bundle.scope,
        snapshot,
        work,
        evidence,
      );
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
