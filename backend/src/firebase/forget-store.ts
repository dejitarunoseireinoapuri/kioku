import { createHash } from "node:crypto";
import { Timestamp } from "firebase-admin/firestore";
import type {
  Firestore,
  Transaction,
  DocumentSnapshot,
} from "firebase-admin/firestore";
import { AccountError } from "../account/contracts.js";
import { forgetLimits } from "../memory-control/forget-contracts.js";
import type {
  MemoryInventory,
  ForgetReplacement,
} from "../memory-control/forget-contracts.js";
import type { ChangeInput } from "../memory-control/contracts.js";
import type { QueryLease } from "../query/contracts.js";
import { validateForgetChanges } from "../memory-control/forget-validation.js";
import { searchProjection } from "../query/search-projection.js";
import { inventoryVersion, readMemoryInventory } from "./memory-inventory.js";

const DAY = 86_400_000;
export class FirestoreForgetStore {
  private readonly db: Firestore;
  private readonly now: () => number;
  constructor(db: Firestore, now = Date.now) {
    this.db = db;
    this.now = now;
  }

  private async authorize(tx: Transaction, uid: string, work: QueryLease) {
    if (!/^[A-Za-z0-9_-]{1,128}$/u.test(uid))
      throw new AccountError("invalid-argument");
    const root = this.db.doc(`accounts/${uid}`);
    const [owner, operation, lock] = await tx.getAll(
      this.db.doc("privateConfiguration/owner"),
      root.collection("operations").doc(work.requestId),
      root.collection("runtime").doc("capture"),
    );
    if (owner?.get("uid") !== uid || owner.get("enabled") !== true)
      throw new AccountError("permission-denied");
    if (
      operation?.get("kind") !== "control" ||
      operation.get("state") !== "processing" ||
      operation.get("nonce") !== work.nonce ||
      lock?.get("nonce") !== work.nonce ||
      Number(lock.get("expiresAtMs")) <= this.now()
    )
      throw new AccountError("failed-precondition");
    return { root, operation: operation.ref, lock: lock.ref };
  }

  inventory(uid: string, work: QueryLease): Promise<MemoryInventory> {
    return this.db.runTransaction(
      async (tx) => {
        await this.authorize(tx, uid, work);
        return readMemoryInventory(this.db, tx, uid);
      },
      { maxAttempts: 3 },
    );
  }

  async commit(
    uid: string,
    input: ChangeInput,
    inventory: MemoryInventory,
    changes: ForgetReplacement[],
    work: QueryLease,
    deadlineMs: number,
  ): Promise<void> {
    if (input.requestId !== work.requestId)
      throw new AccountError("invalid-argument");
    validateForgetChanges(input, inventory, changes, this.now());
    const digest = createHash("sha256")
      .update(
        JSON.stringify([
          uid,
          input.requestId,
          inventory.versions,
          changes.map((c) => [
            c.bundle.scope,
            c.selectedIds,
            c.snapshot.sources.map((s) => s.id),
          ]),
        ]),
      )
      .digest("hex");
    await this.db.runTransaction(
      async (tx) => {
        if (this.now() >= deadlineMs || !Number.isSafeInteger(deadlineMs))
          throw new AccountError("unavailable");
        const { root, operation, lock } = await this.authorize(tx, uid, work);
        const current = await readMemoryInventory(this.db, tx, uid);
        if (
          inventoryVersion(current) !== inventoryVersion(inventory) ||
          current.memoryEpoch >= Number.MAX_SAFE_INTEGER ||
          changes.some(
            (change) => change.bundle.scope.expiresAtMs <= this.now(),
          )
        )
          throw new AccountError("failed-precondition");
        const linked = new Map<string, DocumentSnapshot>();
        for (const change of changes) {
          const id = change.bundle.source.id;
          const saved = await tx.get(
            root.collection("operations").where("sourceId", "==", id).limit(9),
          );
          const pending = await tx.get(
            root
              .collection("operations")
              .where("pending.turn.id", "==", id)
              .limit(9),
          );
          if (saved.size > 8 || pending.size > 8)
            throw new AccountError("resource-exhausted");
          const original = await tx.get(root.collection("operations").doc(id));
          for (const entry of [
            ...saved.docs,
            ...pending.docs,
            ...(original.exists ? [original] : []),
          ])
            linked.set(entry.id, entry);
        }
        if (linked.has(work.requestId))
          throw new AccountError("failed-precondition");
        const sourceIds = changes.flatMap((c) =>
          c.snapshot.sources.map((s) => s.id),
        );
        const memoryIds = changes.flatMap((c) =>
          c.snapshot.memories.map((m) => m.id),
        );
        if (
          new Set(sourceIds).size !== sourceIds.length ||
          new Set(memoryIds).size !== memoryIds.length
        )
          throw new AccountError("failed-precondition");
        const collisions =
          sourceIds.length || memoryIds.length
            ? await tx.getAll(
                ...sourceIds.map((id) => root.collection("sources").doc(id)),
                ...sourceIds.map((id) =>
                  root.collection("revocations").doc(id),
                ),
                ...memoryIds.map((id) => root.collection("memories").doc(id)),
              )
            : [];
        if (collisions.some((entry) => entry.exists))
          throw new AccountError("failed-precondition");
        const writes =
          changes.reduce(
            (total, c) =>
              total +
              2 +
              c.bundle.memories.length +
              c.snapshot.sources.length +
              c.snapshot.memories.length,
            0,
          ) +
          linked.size +
          3;
        if (writes > forgetLimits.writes)
          throw new AccountError("resource-exhausted");
        if (this.now() >= deadlineMs) throw new AccountError("unavailable");
        // Every validation/read precedes every write: all copies change together or none do.
        for (const change of changes) {
          tx.delete(root.collection("sources").doc(change.bundle.source.id));
          for (const memory of change.bundle.memories)
            tx.delete(root.collection("memories").doc(memory.id));
          for (const source of change.snapshot.sources)
            tx.create(root.collection("sources").doc(source.id), {
              ...source,
              sourceKind: "retained",
              memoryCount: change.snapshot.memories.filter(
                (m) => m.sourceId === source.id,
              ).length,
              requestHash: digest,
            });
          for (const memory of change.snapshot.memories)
            tx.create(root.collection("memories").doc(memory.id), {
              ...memory,
              ...searchProjection(memory),
            });
          tx.create(
            root.collection("revocations").doc(change.bundle.source.id),
            {
              operationId: work.requestId,
              inputHash: digest,
              removedCount: change.bundle.memories.length,
              retiredAtMs: this.now(),
            },
          );
        }
        for (const entry of linked.values())
          tx.set(entry.ref, {
            kind: "retired",
            expiresAt: Timestamp.fromMillis(this.now() + DAY),
          });
        tx.delete(lock);
        tx.set(root.collection("runtime").doc("memory"), {
          revision: current.memoryEpoch + 1,
        });
        tx.update(operation, {
          state: "finished",
          controlStatus: "forgotten",
          forgetScope: "allOccurrences",
          references: changes.flatMap((c) =>
            c.snapshot.sources.map((source) => ({
              sourceId: source.id,
              receivedAt: source.receivedAt,
            })),
          ),
          ...(input.continueManagement
            ? {
                managementChanges: changes.map((c) => ({
                  sourceId: c.bundle.source.id,
                  sourceIds: c.snapshot.sources.map((source) => source.id),
                })),
              }
            : {}),
          memoryEpoch: current.memoryEpoch + 1,
          expiresAtMs: this.now() + 7 * DAY,
          expiresAt: Timestamp.fromMillis(this.now() + 7 * DAY),
        });
      },
      { maxAttempts: 3 },
    );
  }
}
