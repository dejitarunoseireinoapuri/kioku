import { createHash } from "node:crypto";
import { Timestamp } from "firebase-admin/firestore";
import type {
  DocumentSnapshot,
  Firestore,
  Transaction,
} from "firebase-admin/firestore";
import { AccountError } from "../account/contracts.js";
import {
  retirementScope,
  validateRetirement,
  validateRetirementTarget,
} from "../memory-control/retirement.js";
import type {
  RetirementResult,
  RetirementScope,
  SourceRetirementStore,
} from "../memory-control/retirement.js";

const DAY = 86_400_000;
const SCOPE_TTL = 300_000;
function version(document: DocumentSnapshot): string {
  return `${document.updateTime?.seconds}:${document.updateTime?.nanoseconds}`;
}

/** Atomic primitive; deliberately absent from index.ts and all callable exports. */
export class FirestoreSourceRetirementStore implements SourceRetirementStore {
  private readonly db: Firestore;
  private readonly now: () => number;
  constructor(db: Firestore, now = Date.now) {
    this.db = db;
    this.now = now;
  }

  private async owner(tx: Transaction, uid: string): Promise<void> {
    if (!/^[A-Za-z0-9_-]{1,128}$/u.test(uid))
      throw new AccountError("invalid-argument");
    const owner = await tx.get(this.db.doc("privateConfiguration/owner"));
    if (owner.get("uid") !== uid || owner.get("enabled") !== true)
      throw new AccountError("permission-denied");
  }

  async inspect(uid: string, sourceId: string): Promise<RetirementScope> {
    validateRetirementTarget(uid, sourceId);
    return this.db.runTransaction(
      async (tx) => {
        await this.owner(tx, uid);
        const root = this.db.doc(`accounts/${uid}`);
        const [source, retired] = await tx.getAll(
          root.collection("sources").doc(sourceId),
          root.collection("revocations").doc(sourceId),
        );
        if (!source?.exists || retired?.exists || source.get("id") !== sourceId)
          throw new AccountError("failed-precondition");
        const memories = await tx.get(
          root
            .collection("memories")
            .where("sourceId", "==", sourceId)
            .limit(9),
        );
        if (
          memories.size === 0 ||
          memories.size > 8 ||
          source.get("memoryCount") !== memories.size
        )
          throw new AccountError("failed-precondition");
        const scope: RetirementScope = {
          scope: "entireSource",
          sourceId,
          sourceVersion: version(source),
          memories: memories.docs.map((entry) => ({
            id: entry.id,
            version: version(entry),
          })),
          expiresAtMs: this.now() + SCOPE_TTL,
        };
        if (!retirementScope.safeParse(scope).success)
          throw new AccountError("failed-precondition");
        return scope;
      },
      { maxAttempts: 3 },
    );
  }

  async retire(
    uid: string,
    requestId: string,
    input: RetirementScope,
  ): Promise<RetirementResult> {
    const scope = validateRetirement(uid, requestId, input);
    const root = this.db.doc(`accounts/${uid}`);
    const sourceRef = root.collection("sources").doc(scope.sourceId);
    const revocation = root.collection("revocations").doc(scope.sourceId);
    const operation = root.collection("operations").doc(requestId);
    // Only opaque IDs, database versions and expiry are hashed, never source text.
    const inputHash = createHash("sha256")
      .update(JSON.stringify([uid, requestId, scope]))
      .digest("hex");
    return this.db.runTransaction(
      async (tx) => {
        await this.owner(tx, uid);
        const [source, retired, previous, original, lock, collision] =
          await tx.getAll(
            sourceRef,
            revocation,
            operation,
            root.collection("operations").doc(scope.sourceId),
            root.collection("runtime").doc("capture"),
            root.collection("sources").doc(requestId),
          );
        if (collision?.exists) throw new AccountError("failed-precondition");
        if (retired?.exists) {
          if (
            retired.get("operationId") !== requestId ||
            retired.get("inputHash") !== inputHash ||
            (previous?.exists && previous.get("kind") !== "sourceRetirement")
          )
            throw new AccountError("failed-precondition");
          return this.result(
            requestId,
            scope.sourceId,
            Number(retired.get("removedCount")),
          );
        }
        if (
          previous?.exists ||
          !source?.exists ||
          source.get("id") !== scope.sourceId ||
          version(source) !== scope.sourceVersion ||
          scope.expiresAtMs <= this.now() ||
          scope.expiresAtMs > this.now() + SCOPE_TTL
        )
          throw new AccountError("failed-precondition");
        const memories = await tx.get(
          root
            .collection("memories")
            .where("sourceId", "==", scope.sourceId)
            .limit(9),
        );
        if (
          memories.size !== scope.memories.length ||
          memories.docs.some(
            (entry) =>
              !scope.memories.some(
                (expected) =>
                  expected.id === entry.id &&
                  expected.version === version(entry),
              ),
          )
        )
          throw new AccountError("failed-precondition");
        const saved = await tx.get(
          root
            .collection("operations")
            .where("sourceId", "==", scope.sourceId)
            .limit(9),
        );
        const pending = await tx.get(
          root
            .collection("operations")
            .where("pending.turn.id", "==", scope.sourceId)
            .limit(9),
        );
        if (saved.size > 8 || pending.size > 8)
          throw new AccountError("resource-exhausted");
        const linked = new Map(
          [
            ...saved.docs,
            ...pending.docs,
            ...(original?.exists ? [original] : []),
          ].map((entry) => [entry.id, entry]),
        );
        // All reads precede writes. A version conflict aborts the whole removal.
        tx.delete(sourceRef);
        for (const entry of memories.docs) tx.delete(entry.ref);
        for (const entry of linked.values()) {
          tx.set(entry.ref, {
            kind: "retired",
            expiresAt: Timestamp.fromMillis(this.now() + DAY),
          });
        }
        if (
          [...linked.values()].some(
            (entry) =>
              entry.get("nonce") === lock?.get("nonce") && lock?.exists,
          )
        )
          tx.delete(root.collection("runtime").doc("capture"));
        const result = this.result(requestId, scope.sourceId, memories.size);
        tx.create(revocation, {
          operationId: requestId,
          inputHash,
          removedCount: memories.size,
          retiredAtMs: this.now(),
        });
        tx.create(operation, {
          kind: "sourceRetirement",
          inputHash,
          ...result,
          expiresAt: Timestamp.fromMillis(this.now() + 7 * DAY),
        });
        return result;
      },
      { maxAttempts: 3 },
    );
  }

  private result(
    operationId: string,
    sourceId: string,
    removedCount: number,
  ): RetirementResult {
    if (!Number.isInteger(removedCount) || removedCount < 1 || removedCount > 8)
      throw new AccountError("failed-precondition");
    return { status: "forgotten", operationId, sourceId, removedCount };
  }
}
