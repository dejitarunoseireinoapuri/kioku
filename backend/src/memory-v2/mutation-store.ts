import { randomUUID } from "node:crypto";
import { Timestamp } from "firebase-admin/firestore";
import type { Firestore } from "firebase-admin/firestore";
import type { Command } from "#memory-v2/src/contracts";
import { parseCommand } from "#memory-v2/src/contracts";
import { prepareTransition } from "#memory-v2/src/transition";
import { AccountError } from "../account/contracts.js";
import {
  loadV2State,
  operationsCollection,
  persistV2State,
  plansCollection,
  privateDigest,
  refreshGroups,
} from "./state-store.js";
import { V2WorkStore } from "./work-store.js";
import { checkStorageCapacity } from "./capacity.js";
import type { V2Reply, WorkLease } from "./contracts.js";

export class V2MutationStore {
  readonly db: Firestore;
  readonly work: V2WorkStore;
  readonly now: () => number;
  constructor(db: Firestore, now: () => number = Date.now) {
    this.db = db;
    this.now = now;
    this.work = new V2WorkStore(db, now);
  }
  async commit(
    uid: string,
    lease: WorkLease,
    raw: Command,
    sourceId?: string,
  ): Promise<V2Reply> {
    const command = parseCommand(raw);
    if (command.requestId !== lease.requestId)
      throw new AccountError("invalid-argument");
    return this.db.runTransaction(
      async (tx) => {
        const loaded = await loadV2State(
          tx,
          this.db,
          uid,
          lease.generation,
          lease.requestId,
        );
        if (loaded.state.epoch !== lease.epoch)
          throw new AccountError("failed-precondition");
        const work = await this.work.current(tx, uid, lease);
        if (loaded.state.admissions[command.requestId])
          throw new AccountError("failed-precondition");
        const root = this.db.doc(`accounts/${uid}`);
        const active = await tx.get(
          root
            .collection(operationsCollection)
            .where("state", "in", ["processing", "clarification"])
            .limit(9),
        );
        const plans = await tx.get(root.collection(plansCollection).limit(9));
        if (active.size > 8 || plans.size > 8)
          throw new AccountError("resource-exhausted");
        const transition = prepareTransition(
          loaded.state,
          command,
          { now: this.now, id: randomUUID, digest: privateDigest },
          privateDigest([uid, lease.generation, command]),
        );
        if ("status" in transition)
          throw new AccountError("failed-precondition");
        const created =
          command.kind === "capture"
            ? {
                id: lease.requestId,
                unitIds: transition.receipt.refs.map((ref) => ref.id),
                recordedAt: Date.parse(
                  lease.turn!.interventions?.[0]?.at ?? lease.turn!.at,
                ),
                changed: false,
              }
            : undefined;
        if (created && loaded.groups.some((g) => g.id === created.id))
          throw new AccountError("failed-precondition");
        const refreshed = refreshGroups(loaded, transition.next, created);
        const affected = loaded.groups.filter((group) =>
          group.unitIds.some(
            (id) =>
              loaded.state.units[id]?.revision !==
              transition.next.units[id]?.revision,
          ),
        );
        const replacements = new Map(affected.map((g) => [g.id, randomUUID()]));
        const groups = refreshed.map((g) =>
          replacements.has(g.id) ? { ...g, id: replacements.get(g.id)! } : g,
        );
        const newIds = Object.keys(transition.next.units).filter(
          (id) => !loaded.state.units[id],
        );
        if (command.kind !== "forget")
          checkStorageCapacity(transition.next, groups);
        if (newIds.length) {
          const retired = await tx.getAll(
            ...newIds.map((id) =>
              root.collection("memoryV2Revocations").doc(id),
            ),
          );
          if (retired.some((d) => d.exists))
            throw new AccountError("failed-precondition");
        }
        const reply: V2Reply = created
          ? {
              apiVersion: 2,
              status: "saved",
              operationId: lease.requestId,
              sourceId: created.id,
              memoryCount: created.unitIds.length,
            }
          : {
              apiVersion: 2,
              operationId: lease.requestId,
              status: command.kind === "forget" ? "forgotten" : "corrected",
              text:
                command.kind === "forget"
                  ? "Recuerdo olvidado."
                  : "Recuerdo corregido.",
              memoryEpoch: transition.next.epoch,
              sources: groups
                .filter(
                  (g) =>
                    g.id === (replacements.get(sourceId ?? "") ?? sourceId),
                )
                .map((g) => ({
                  sourceId: g.id,
                  receivedAt: new Date(g.recordedAt).toISOString(),
                })),
              changes: affected.map((g) => ({
                sourceId: g.id,
                sourceIds: groups.some(
                  (current) => current.id === replacements.get(g.id),
                )
                  ? [replacements.get(g.id)!]
                  : [],
              })),
            };
        persistV2State(
          tx,
          this.db,
          loaded,
          transition.next,
          groups,
          active.size + plans.size + 1,
        );
        for (const document of active.docs)
          if (document.id !== lease.requestId)
            tx.update(document.ref, {
              state: "superseded",
              turn: null,
              reply: null,
            });
        for (const document of plans.docs) tx.delete(document.ref);
        tx.set(this.work.ref(uid, lease.requestId), {
          ...work,
          state: "committed",
          turn: null,
          reply,
          expiresAt: Timestamp.fromMillis(this.now() + 86_400_000),
        });
        return reply;
      },
      { maxAttempts: 3 },
    );
  }
}
