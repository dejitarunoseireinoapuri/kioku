import { createHash } from "node:crypto";
import { Timestamp } from "firebase-admin/firestore";
import type { Firestore, Transaction } from "firebase-admin/firestore";
import { AccountError } from "../account/contracts.js";
import type { QueryEvidence, QueryLease } from "../query/contracts.js";
import type {
  DecisionInput,
  RoutingInput,
  RoutingPlan,
  RoutingStore,
} from "../conversation/contracts.js";
import { FirestoreQueryStore } from "./query-store.js";
import { FirestoreSourceControlStore } from "./source-control-store.js";

function planHash(uid: string, turn: RoutingInput, plan: RoutingPlan): string {
  return createHash("sha256")
    .update(JSON.stringify([uid, turn, plan]))
    .digest("hex");
}

/** Only salted plan digests and operation metadata persist; owner text/plans stay in the request. */
export class FirestoreRoutingStore implements RoutingStore {
  private readonly work: FirestoreQueryStore;
  private readonly db: Firestore;
  private readonly now: () => number;
  constructor(db: Firestore, now = Date.now) {
    this.db = db;
    this.now = now;
    this.work = new FirestoreQueryStore(db, now, "routing");
  }
  private async owner(tx: Transaction, uid: string) {
    if (!/^[A-Za-z0-9_-]{1,128}$/u.test(uid))
      throw new AccountError("invalid-argument");
    const owner = await tx.get(this.db.doc("privateConfiguration/owner"));
    if (owner.get("uid") !== uid || owner.get("enabled") !== true)
      throw new AccountError("permission-denied");
  }
  async begin(uid: string, input: RoutingInput) {
    const work = await this.work.begin(uid, {
      apiVersion: 1,
      requestId: input.requestId,
      text: JSON.stringify(input),
    });
    if ("status" in work)
      return {
        apiVersion: 1 as const,
        operationId: input.requestId,
        status: work.status as "processing" | "repeatRequired",
      };
    const record = await this.db
      .doc(`accounts/${uid}/operations/${input.requestId}`)
      .get();
    const createdAt = Number(record.get("createdAtMs"));
    if (!Number.isSafeInteger(createdAt) || createdAt + 300_000 <= this.now()) {
      await this.work.fail(uid, work);
      return {
        apiVersion: 1 as const,
        operationId: input.requestId,
        status: "repeatRequired" as const,
      };
    }
    return { ...work, receivedAt: new Date(createdAt).toISOString() };
  }
  epoch(uid: string) {
    return this.work.revision(uid);
  }
  retrieve(uid: string, text: string, vector: number[]) {
    return this.work.retrieve(uid, text, vector);
  }
  async context(uid: string, sourceId: string): Promise<QueryEvidence> {
    const bundle = await new FirestoreSourceControlStore(
      this.db,
      this.now,
    ).bundle(uid, sourceId);
    return {
      snapshot: {
        version: 4,
        sources: [bundle.source],
        memories: bundle.memories,
      },
      versions: [
        {
          collection: "sources",
          id: sourceId,
          version: bundle.scope.sourceVersion,
        },
        ...bundle.scope.memories.map((item) => ({
          collection: "memories" as const,
          ...item,
        })),
      ],
    };
  }
  async issue(
    uid: string,
    lease: QueryLease,
    epoch: number,
    evidence: QueryEvidence,
    input: RoutingInput,
    plan: RoutingPlan | null,
  ) {
    const root = this.db.doc(`accounts/${uid}`);
    await this.db.runTransaction(
      async (tx) => {
        await this.owner(tx, uid);
        const [operation, lock, revision, ...documents] = await tx.getAll(
          root.collection("operations").doc(lease.requestId),
          root.collection("runtime").doc("capture"),
          root.collection("runtime").doc("memory"),
          ...evidence.versions.map((item) =>
            root.collection(item.collection).doc(item.id),
          ),
          ...evidence.snapshot.sources.map((source) =>
            root.collection("revocations").doc(source.id),
          ),
        );
        if (
          operation?.get("kind") !== "routing" ||
          operation.get("state") !== "processing" ||
          operation.get("nonce") !== lease.nonce ||
          lock?.get("nonce") !== lease.nonce ||
          Number(lock.get("expiresAtMs")) <= this.now() ||
          Number(revision?.get("revision") ?? 0) !== epoch ||
          documents
            .slice(evidence.versions.length)
            .some((item) => item.exists) ||
          documents
            .slice(0, evidence.versions.length)
            .some(
              (item, index) =>
                !item.exists ||
                `${item.updateTime?.seconds}:${item.updateTime?.nanoseconds}` !==
                  evidence.versions[index]?.version,
            )
        ) {
          throw new AccountError("failed-precondition");
        }
        const expiresAtMs = Number(operation.get("createdAtMs")) + 300_000;
        if (
          expiresAtMs <= this.now() ||
          (plan &&
            (plan.memoryEpoch !== epoch ||
              plan.expiresAtMs !== expiresAtMs ||
              Date.parse(plan.receivedAt) !==
                Number(operation.get("createdAtMs"))))
        )
          throw new AccountError("failed-precondition");
        tx.update(operation.ref, {
          state: "finished",
          memoryEpoch: epoch,
          planHash: plan ? planHash(uid, input, plan) : null,
          expiresAtMs,
          expiresAt: Timestamp.fromMillis(expiresAtMs),
        });
        tx.delete(lock.ref);
      },
      { maxAttempts: 3 },
    );
  }
  fail(uid: string, lease: QueryLease) {
    return this.work.fail(uid, lease);
  }

  async bind(uid: string, input: DecisionInput): Promise<boolean> {
    const root = this.db.doc(`accounts/${uid}`);
    return this.db.runTransaction(
      async (tx) => {
        await this.owner(tx, uid);
        if (input.requestId === input.turn.requestId)
          throw new AccountError("invalid-argument");
        const [ticket, epoch, child] = await tx.getAll(
          root.collection("operations").doc(input.turn.requestId),
          root.collection("runtime").doc("memory"),
          root.collection("operations").doc(input.requestId),
        );
        const boundId: unknown = ticket?.get("executionId");
        if (
          ticket?.get("kind") !== "routing" ||
          ticket.get("state") !== "finished" ||
          ticket.get("planHash") !== planHash(uid, input.turn, input.plan) ||
          (boundId !== undefined && boundId !== input.requestId)
        )
          throw new AccountError("failed-precondition");
        if (ticket.get("declined") === true) {
          if (
            input.decision === "reject" &&
            ticket.get("declinedBy") === input.requestId
          )
            return false;
          throw new AccountError("failed-precondition");
        }
        const confirmedReplay =
          boundId === input.requestId &&
          (child?.get("state") === "finished" ||
            child?.get("state") === "saved");
        if (
          !confirmedReplay &&
          (input.plan.expiresAtMs <= this.now() ||
            Number(epoch?.get("revision") ?? 0) !== input.plan.memoryEpoch)
        )
          throw new AccountError("failed-precondition");
        if (input.plan.action === "offer") {
          if (input.decision === "apply")
            throw new AccountError("invalid-argument");
          if (input.decision === "reject") {
            if (boundId !== undefined)
              throw new AccountError("failed-precondition");
            tx.update(ticket.ref, {
              declined: true,
              declinedBy: input.requestId,
            });
            return false;
          }
        } else if (
          (input.plan.action !== "correct" && input.plan.action !== "forget") ||
          input.decision !== "apply"
        ) {
          throw new AccountError("invalid-argument");
        }
        if (boundId === undefined && child?.exists)
          throw new AccountError("failed-precondition");
        tx.update(ticket.ref, {
          executionId: input.requestId,
          expiresAt: Timestamp.fromMillis(this.now() + 7 * 86_400_000),
        });
        return true;
      },
      { maxAttempts: 3 },
    );
  }
}
