import { Interpreter } from "#memory-v2/ai/interpreter";
import { resolveScope } from "#memory-v2/src/removal";
import type { Command } from "#memory-v2/src/contracts";
import type { Firestore } from "firebase-admin/firestore";
import { AccountError } from "../account/contracts.js";
import { V2Reader } from "./reader.js";
import { V2WorkStore } from "./work-store.js";
import { V2MutationStore } from "./mutation-store.js";
import { presentEvidence, presentGroup } from "./presentation.js";
import type { ModelFactory } from "./capture.js";
import type { Change, V2Reply } from "./contracts.js";
import { directLocationCorrection } from "./location-prototype.js";

export async function changeV2(
  db: Firestore,
  uid: string,
  generation: string,
  input: Change,
  model: ModelFactory,
  reauthorize: () => Promise<void>,
  receivedAt = new Date().toISOString(),
  locationPrototype = false,
): Promise<V2Reply> {
  const work = new V2WorkStore(db);
  const pending = await work.begin(
    uid,
    generation,
    input.requestId,
    input,
    null,
  );
  if ("reply" in pending) return pending.reply;
  const lease = pending.lease;
  try {
    const reader = new V2Reader(db, uid, generation),
      loaded = await reader.load();
    const details = presentGroup(loaded, input.sourceId);
    if (
      loaded.state.epoch !== lease.epoch ||
      details.version !== input.expectedVersion ||
      input.memoryIds.some(
        (id) => !details.items.some((item) => item.id === id),
      )
    )
      throw new AccountError("failed-precondition");
    const targets = input.memoryIds.map((id) => ({
      id,
      revision: loaded.state.units[id]!.revision,
    }));
    const scope = resolveScope(loaded.state, targets, []);
    const clarify = async (text: string) => {
      const reply: V2Reply = {
        apiVersion: 2,
        operationId: input.requestId,
        status: "needsClarification",
        text,
        memoryEpoch: loaded.state.epoch,
        sources: [],
      };
      await work.finish(uid, lease, "ignored", {
        ...reply,
        text: "Concreta el alcance y vuelve a intentarlo.",
      });
      return reply;
    };
    if (
      input.action === "forget" &&
      input.forgetScope === "source" &&
      loaded.groups.some(
        (g) =>
          g.id !== input.sourceId &&
          g.unitIds.some((id) => input.memoryIds.includes(id)),
      )
    )
      return clarify(
        "Este relato comparte recuerdos con otros. Selecciona el dato concreto para olvidarlo en todos sus recuerdos.",
      );
    if (!Array.isArray(scope))
      return clarify(
        "Hay recuerdos relacionados cuyo alcance debe aclararse antes de hacer el cambio.",
      );
    // Never silently expand the set already shown in the owner's confirmation dialog.
    if (scope.some((id) => !input.memoryIds.includes(id)))
      return clarify(
        "Este cambio afecta también a otros recuerdos. Concreta cuáles quieres cambiar.",
      );
    let command: Command;
    if (input.action === "forget") {
      command = {
        kind: "forget",
        requestId: input.requestId,
        targets,
        excludeMatches: [],
      };
    } else {
      const target = loaded.state.units[input.memoryIds[0]!]!;
      const directDraft = locationPrototype
        ? directLocationCorrection(
            loaded.state,
            target.id,
            input.correction!,
            input.zone,
          )
        : null;
      const packet = presentEvidence(loaded, [targets[0]!])[0]!;
      const interpreted = directDraft
        ? {
            draft: directDraft,
            proposal: { question: null, preserveTime: false },
            retainedEvidence: [],
          }
        : await new Interpreter(await model(lease.epoch)).interpret(
            {
              text: input.correction!,
              at: receivedAt,
              zone: input.zone,
              mode: "correction",
              target,
              evidence: packet.fragments.map((fragment) => ({
                fragment,
                source: loaded.state.sources[fragment.sourceId]!,
              })),
            },
            [],
          );
      if (!interpreted.draft)
        return clarify(
          interpreted.proposal.question ??
            "Explica el dato que quieres corregir.",
        );
      command = {
        kind: "correct",
        requestId: input.requestId,
        target: targets[0]!,
        draft: interpreted.draft,
        preserveTime: interpreted.proposal.preserveTime,
        retainedEvidence: interpreted.retainedEvidence,
        removeRelations: [],
      };
    }
    await reauthorize();
    return await new V2MutationStore(db).commit(
      uid,
      lease,
      command,
      input.sourceId,
    );
  } catch (error) {
    await work.fail(uid, lease).catch(() => undefined);
    throw error;
  }
}
