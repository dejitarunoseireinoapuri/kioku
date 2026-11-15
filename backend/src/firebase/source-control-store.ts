import type {
  DocumentSnapshot,
  Firestore,
  Transaction,
} from "firebase-admin/firestore";
import { sourceSchema } from "#memory-core/domain";
import type { Snapshot } from "#memory-core/domain";
import { AccountError } from "../account/contracts.js";
import { canonicalMemory } from "../query/search-projection.js";
import type { QueryLease } from "../query/contracts.js";
import type {
  ChangeInput,
  ChangeResult,
  SourceControlStore,
  SourceDetails,
  SourceBundle,
} from "../memory-control/contracts.js";
import type { RetirementScope } from "../memory-control/retirement.js";
import { validateRetirementTarget } from "../memory-control/retirement.js";
import { scopeVersion } from "../memory-control/retirement.js";
import { FirestoreQueryStore } from "./query-store.js";
import { FirestoreSourceRetirementStore } from "./retirement-store.js";
import { FirestoreForgetStore } from "./forget-store.js";
import { managementChanges } from "../memory-control/continuation.js";
import type {
  MemoryInventory,
  ForgetReplacement,
} from "../memory-control/forget-contracts.js";

const noChange =
  "No se ha aplicado ningún cambio. Revisa el alcance o escribe una frase completa.";
const version = (document: DocumentSnapshot) =>
  `${document.updateTime?.seconds}:${document.updateTime?.nanoseconds}`;

export class FirestoreSourceControlStore implements SourceControlStore {
  private readonly db: Firestore;
  private readonly now: () => number;
  private readonly work: FirestoreQueryStore;
  private readonly retirements: FirestoreSourceRetirementStore;
  constructor(db: Firestore, now = Date.now) {
    this.db = db;
    this.now = now;
    this.work = new FirestoreQueryStore(db, now, "control");
    this.retirements = new FirestoreSourceRetirementStore(db, now);
  }
  private async owner(tx: Transaction, uid: string): Promise<void> {
    if (!/^[A-Za-z0-9_-]{1,128}$/u.test(uid))
      throw new AccountError("invalid-argument");
    const owner = await tx.get(this.db.doc("privateConfiguration/owner"));
    if (owner.get("uid") !== uid || owner.get("enabled") !== true)
      throw new AccountError("permission-denied");
  }
  async epoch(uid: string): Promise<number> {
    return this.db.runTransaction(async (tx) => {
      await this.owner(tx, uid);
      const snapshot = await tx.get(
        this.db.doc(`accounts/${uid}/runtime/memory`),
      );
      const epoch = Number(snapshot.get("revision") ?? 0);
      if (!Number.isSafeInteger(epoch) || epoch < 0)
        throw new AccountError("failed-precondition");
      return epoch;
    });
  }
  async bundle(uid: string, id: string): Promise<SourceBundle> {
    validateRetirementTarget(uid, id);
    const scope = await this.retirements.inspect(uid, id);
    return this.db.runTransaction(async (tx) => {
      await this.owner(tx, uid);
      const root = this.db.doc(`accounts/${uid}`);
      const [source, retired, epoch, ...documents] = await tx.getAll(
        root.collection("sources").doc(id),
        root.collection("revocations").doc(id),
        root.collection("runtime").doc("memory"),
        ...scope.memories.map((item) =>
          root.collection("memories").doc(item.id),
        ),
      );
      if (
        !source?.exists ||
        retired?.exists ||
        version(source) !== scope.sourceVersion ||
        documents.some(
          (entry, index) =>
            !entry.exists || version(entry) !== scope.memories[index]?.version,
        )
      )
        throw new AccountError("failed-precondition");
      const memoryEpoch = Number(epoch?.get("revision") ?? 0);
      if (!Number.isSafeInteger(memoryEpoch) || memoryEpoch < 0)
        throw new AccountError("failed-precondition");
      const sourceKind: unknown = source.get("sourceKind");
      if (
        sourceKind !== undefined &&
        sourceKind !== "retained" &&
        sourceKind !== "correction"
      )
        throw new AccountError("failed-precondition");
      return {
        scope,
        memoryEpoch,
        ...(sourceKind ? { sourceKind } : {}),
        source: sourceSchema.parse({
          id,
          text: source.get("text"),
          receivedAt: source.get("receivedAt"),
          zone: source.get("zone"),
        }),
        memories: documents.map((entry) => canonicalMemory(entry.data()!)),
      };
    });
  }
  async details(uid: string, id: string): Promise<SourceDetails> {
    const bundle = await this.bundle(uid, id);
    return {
      apiVersion: 1,
      sourceId: id,
      version: scopeVersion(bundle.scope),
      text: bundle.source.text,
      receivedAt: bundle.source.receivedAt,
      memoryEpoch: bundle.memoryEpoch,
      ...(bundle.sourceKind ? { sourceKind: bundle.sourceKind } : {}),
      items: bundle.memories.map((memory) => ({
        id: memory.id,
        text: memory.text,
      })),
    };
  }
  async begin(
    uid: string,
    input: ChangeInput,
  ): Promise<QueryLease | ChangeResult> {
    const result = await this.work.begin(uid, {
      apiVersion: 1,
      requestId: input.requestId,
      text: JSON.stringify(input),
    });
    if (!("status" in result)) return result;
    if (result.status === "repeatRequired")
      return this.result(
        uid,
        input.requestId,
        input.continueManagement,
        input.sourceId,
      );
    return {
      apiVersion: 1,
      operationId: input.requestId,
      status: "processing",
      text: "",
      sources: [],
      memoryEpoch: await this.epoch(uid),
    };
  }
  async commit(
    uid: string,
    input: ChangeInput,
    scope: RetirementScope,
    snapshot: Snapshot,
    lease: QueryLease,
  ): Promise<ChangeResult> {
    await this.retirements.replace(uid, input.requestId, scope, {
      snapshot,
      status: input.action === "correct" ? "corrected" : "forgotten",
      lease,
    });
    return this.result(
      uid,
      input.requestId,
      input.continueManagement,
      input.sourceId,
    );
  }
  async noChange(
    uid: string,
    lease: QueryLease,
    text: string,
  ): Promise<ChangeResult> {
    await this.work.finish(uid, lease, {
      snapshot: { version: 4, sources: [], memories: [] },
      versions: [],
    });
    return {
      apiVersion: 1,
      operationId: lease.requestId,
      status: "needsClarification",
      text,
      sources: [],
      memoryEpoch: await this.epoch(uid),
    };
  }
  fail(uid: string, lease: QueryLease): Promise<void> {
    return this.work.fail(uid, lease);
  }

  inventory(uid: string, work: QueryLease) {
    return new FirestoreForgetStore(this.db, this.now).inventory(uid, work);
  }
  async forget(
    uid: string,
    input: ChangeInput,
    inventory: MemoryInventory,
    changes: ForgetReplacement[],
    work: QueryLease,
    deadlineMs: number,
  ) {
    await new FirestoreForgetStore(this.db, this.now).commit(
      uid,
      input,
      inventory,
      changes,
      work,
      deadlineMs,
    );
    return this.result(
      uid,
      input.requestId,
      input.continueManagement,
      input.sourceId,
    );
  }

  private async result(
    uid: string,
    id: string,
    continueManagement = false,
    selectedSource?: string,
  ): Promise<ChangeResult> {
    return this.db.runTransaction(async (tx) => {
      await this.owner(tx, uid);
      const root = this.db.doc(`accounts/${uid}`);
      const [operation, epoch] = await tx.getAll(
        root.collection("operations").doc(id),
        root.collection("runtime").doc("memory"),
      );
      if (
        operation?.get("kind") !== "control" ||
        operation.get("state") !== "finished" ||
        Number(operation.get("expiresAtMs")) <= this.now()
      )
        throw new AccountError("failed-precondition");
      const status: unknown = operation.get("controlStatus");
      const memoryEpoch = Number(epoch?.get("revision") ?? 0);
      if (!Number.isSafeInteger(memoryEpoch) || memoryEpoch < 0)
        throw new AccountError("failed-precondition");
      if (status !== "corrected" && status !== "forgotten")
        return {
          apiVersion: 1,
          operationId: id,
          status: "needsClarification",
          text: noChange,
          sources: [],
          memoryEpoch,
        };
      const references: unknown = operation.get("references");
      const repeated = operation.get("forgetScope") === "allOccurrences";
      if (!Array.isArray(references) || references.length > (repeated ? 32 : 2))
        throw new AccountError("failed-precondition");
      const ids = references.map((entry: unknown) => {
        if (
          !entry ||
          typeof entry !== "object" ||
          !("sourceId" in entry) ||
          typeof entry.sourceId !== "string"
        )
          throw new AccountError("failed-precondition");
        validateRetirementTarget(uid, entry.sourceId);
        return entry.sourceId;
      });
      const current = ids.length
        ? await tx.getAll(
            ...ids.map((source) => root.collection("sources").doc(source)),
            ...ids.map((source) => root.collection("revocations").doc(source)),
          )
        : [];
      if (
        current.slice(0, ids.length).some((entry) => !entry.exists) ||
        current.slice(ids.length).some((entry) => entry.exists)
      )
        throw new AccountError("failed-precondition");
      const changes = continueManagement
        ? managementChanges(
            repeated
              ? operation.get("managementChanges")
              : [{ sourceId: selectedSource, sourceIds: ids }],
            ids,
            selectedSource,
          )
        : undefined;
      const continuationIds =
        changes?.find((c) => c.sourceId === selectedSource)?.sourceIds ?? [];
      const visible = repeated
        ? continueManagement
          ? current
              .slice(0, ids.length)
              .filter((entry) => continuationIds.includes(entry.id))
          : []
        : current.slice(0, ids.length);
      return {
        apiVersion: 1,
        operationId: id,
        status,
        text:
          status === "corrected"
            ? "Dato corregido."
            : "He olvidado lo que has seleccionado.",
        sources: visible.map((entry) => ({
          sourceId: entry.id,
          receivedAt: String(entry.get("receivedAt")),
        })),
        memoryEpoch,
        ...(changes ? { changes } : {}),
      };
    });
  }
}
