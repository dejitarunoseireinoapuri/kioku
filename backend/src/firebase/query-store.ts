import { createHash, randomUUID } from "node:crypto";
import { Timestamp } from "firebase-admin/firestore";
import type {
  Firestore,
  DocumentSnapshot,
  Transaction,
} from "firebase-admin/firestore";
import { sourceSchema, snapshotVersion } from "#memory-core/domain";
import { retrieve } from "#memory-core/search";
import type { Snapshot } from "#memory-core/domain";
import { AccountError } from "../account/contracts.js";
import { searchTerms, canonicalMemory } from "../query/search-projection.js";
import { queryStatus } from "../query/contracts.js";
import type {
  QueryInput,
  QueryLease,
  QueryEvidence,
  QueryStore,
  EvidenceVersion,
} from "../query/contracts.js";

const LEASE_MS = 240_000;
const DAY_MS = 86_400_000;
function version(document: DocumentSnapshot): string {
  return `${document.updateTime?.seconds}:${document.updateTime?.nanoseconds}`;
}

export class FirestoreQueryStore implements QueryStore {
  private readonly db: Firestore;
  private readonly now: () => number;
  constructor(db: Firestore, now = Date.now) {
    this.db = db;
    this.now = now;
  }
  private root(uid: string) {
    return this.db.doc(`accounts/${uid}`);
  }
  private async owner(tx: Transaction, uid: string) {
    const owner = await tx.get(this.db.doc("privateConfiguration/owner"));
    if (owner.get("uid") !== uid || owner.get("enabled") !== true)
      throw new AccountError("permission-denied");
  }
  async begin(uid: string, input: QueryInput) {
    const operation = this.root(uid)
      .collection("operations")
      .doc(input.requestId);
    const lock = this.root(uid).collection("runtime").doc("capture");
    const hash = createHash("sha256")
      .update(JSON.stringify([uid, input]))
      .digest("hex");
    const now = this.now();
    return this.db.runTransaction(
      async (tx) => {
        await this.owner(tx, uid);
        const [previous, currentLock, readiness, captureSource] =
          await tx.getAll(
            operation,
            lock,
            this.db.doc("privateConfiguration/search"),
            this.root(uid).collection("sources").doc(input.requestId),
          );
        if (captureSource?.exists)
          throw new AccountError("failed-precondition");
        if (
          readiness?.get("uid") !== uid ||
          readiness.get("schema") !== 1 ||
          readiness.get("ready") !== true
        )
          throw new AccountError("failed-precondition");
        if (previous?.exists) {
          if (
            previous.get("kind") !== "query" ||
            previous.get("inputHash") !== hash
          )
            throw new AccountError("failed-precondition");
          if (previous.get("state") === "finished")
            return queryStatus(input.requestId, "repeatRequired");
          if (
            previous.get("state") === "processing" &&
            Number(currentLock?.get("expiresAtMs")) > now
          )
            return queryStatus(input.requestId, "processing");
          if (
            Number(previous.get("attempts")) >= 3 ||
            Number(previous.get("expiresAtMs")) <= now
          )
            throw new AccountError("failed-precondition");
        }
        if (Number(currentLock?.get("expiresAtMs")) > now)
          throw new AccountError("resource-exhausted");
        const nonce = randomUUID();
        tx.set(operation, {
          kind: "query",
          inputHash: hash,
          state: "processing",
          nonce,
          attempts: Number(previous?.get("attempts") ?? 0) + 1,
          expiresAtMs: now + DAY_MS,
          expiresAt: Timestamp.fromMillis(now + DAY_MS),
        });
        tx.set(lock, { nonce, expiresAtMs: now + LEASE_MS });
        return { requestId: input.requestId, nonce };
      },
      { maxAttempts: 3 },
    );
  }

  async retrieve(
    uid: string,
    question: string,
    vector: number[],
  ): Promise<QueryEvidence> {
    const collection = this.root(uid).collection("memories");
    const terms = searchTerms(question).slice(0, 30);
    const [semantic, lexical] = await Promise.all([
      collection
        .findNearest({
          vectorField: "searchVector",
          queryVector: vector,
          limit: 40,
          distanceMeasure: "COSINE",
        })
        .get(),
      terms.length
        ? collection
            .where("searchTerms", "array-contains-any", terms)
            .limit(24)
            .get()
        : null,
    ]);
    const documents = new Map(
      [...semantic.docs, ...(lexical?.docs ?? [])].map((document) => [
        document.id,
        document,
      ]),
    );
    const memories = [...documents.values()]
      .map((document) => {
        const memory = canonicalMemory(document.data());
        if (
          memory.id !== document.id ||
          memory.vector.length !== 512 ||
          !/^[a-f0-9-]{36}$/i.test(memory.sourceId)
        )
          throw new AccountError("failed-precondition");
        return memory;
      })
      .filter((memory) => memory.lifecycle !== "superseded");
    const selected = retrieve(memories, question, vector, 6).map(
      (candidate) => candidate.memory,
    );
    const sourceIds = [...new Set(selected.map((memory) => memory.sourceId))];
    const sources = sourceIds.length
      ? await this.db.getAll(
          ...sourceIds.map((id) =>
            this.root(uid).collection("sources").doc(id),
          ),
        )
      : [];
    const versions: EvidenceVersion[] = selected.map((memory) => ({
      collection: "memories",
      id: memory.id,
      version: version(documents.get(memory.id)!),
    }));
    const snapshot: Snapshot = {
      version: snapshotVersion,
      memories: selected,
      sources: sources.map((document) => {
        const source = sourceSchema.parse({
          id: document.id,
          text: document.get("text"),
          receivedAt: document.get("receivedAt"),
          zone: document.get("zone"),
        });
        if (source.text.length > 10_020)
          throw new AccountError("failed-precondition");
        versions.push({
          collection: "sources",
          id: document.id,
          version: version(document),
        });
        return source;
      }),
    };
    return { snapshot, versions };
  }

  async finish(
    uid: string,
    lease: QueryLease,
    evidence: QueryEvidence,
  ): Promise<void> {
    const root = this.root(uid),
      target = root.collection("operations").doc(lease.requestId);
    const lock = root.collection("runtime").doc("capture");
    await this.db.runTransaction(
      async (tx) => {
        await this.owner(tx, uid);
        const [operation, currentLock, ...current] = await tx.getAll(
          target,
          lock,
          ...evidence.versions.map((entry) =>
            root.collection(entry.collection).doc(entry.id),
          ),
        );
        if (
          operation?.get("state") !== "processing" ||
          operation.get("nonce") !== lease.nonce ||
          currentLock?.get("nonce") !== lease.nonce ||
          Number(currentLock.get("expiresAtMs")) <= this.now() ||
          current.some(
            (document, index) =>
              !document.exists ||
              version(document) !== evidence.versions[index]?.version,
          )
        )
          throw new AccountError("failed-precondition");
        tx.update(target, { state: "finished" });
        tx.delete(lock);
      },
      { maxAttempts: 3 },
    );
  }
  async fail(uid: string, lease: QueryLease): Promise<void> {
    const root = this.root(uid),
      operation = root.collection("operations").doc(lease.requestId);
    const lock = root.collection("runtime").doc("capture");
    await this.db.runTransaction(
      async (tx) => {
        const [record, currentLock] = await tx.getAll(operation, lock);
        if (
          record?.get("state") === "processing" &&
          record.get("nonce") === lease.nonce
        )
          tx.update(operation, { state: "failed" });
        if (currentLock?.get("nonce") === lease.nonce) tx.delete(lock);
      },
      { maxAttempts: 3 },
    );
  }
}
