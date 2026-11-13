import { randomUUID } from "node:crypto";
import { Timestamp } from "firebase-admin/firestore";
import type { Firestore, Transaction } from "firebase-admin/firestore";
import type { Extraction, Snapshot } from "#memory-core/domain";
import { AccountError } from "../account/contracts.js";
import type {
  CaptureInput,
  CaptureLease,
  CaptureResult,
  CaptureStore,
  CaptureWork,
  ClarificationInput,
  PendingCapture,
} from "../memory/contracts.js";
import { inputHash, readRecord, recordResult } from "../memory/records.js";
import type { CaptureRecord } from "../memory/records.js";

const DAY = 86_400_000;
const LEASE = 240_000;

export class FirestoreCaptureStore implements CaptureStore {
  private readonly db: Firestore;
  private readonly now: () => number;
  constructor(db: Firestore, now = Date.now) {
    this.db = db;
    this.now = now;
  }
  private root(uid: string) {
    return this.db.doc(`accounts/${uid}`);
  }
  private async owner(tx: Transaction, uid: string): Promise<void> {
    const owner = await tx.get(this.db.doc("privateConfiguration/owner"));
    if (owner.get("uid") !== uid || owner.get("enabled") !== true)
      throw new AccountError("permission-denied");
  }

  async begin(
    uid: string,
    input: CaptureInput | ClarificationInput,
  ): Promise<CaptureWork> {
    const root = this.root(uid),
      operation = root.collection("operations").doc(input.requestId);
    const hash = inputHash(uid, input),
      now = this.now();
    return this.db.runTransaction(
      async (tx): Promise<CaptureWork> => {
        await this.owner(tx, uid);
        const [existing, lock, source] = await tx.getAll(
          operation,
          root.collection("runtime").doc("capture"),
          root.collection("sources").doc(input.requestId),
        );
        if (!existing || !lock || !source)
          throw new AccountError("unavailable");
        if (source.exists && "mode" in input) {
          if (source.get("requestHash") !== hash)
            throw new AccountError("failed-precondition");
          return {
            result: {
              apiVersion: 1,
              status: "saved",
              operationId: input.requestId,
              sourceId: input.requestId,
              memoryCount: source.get("memoryCount") as number,
            },
          };
        }
        const previous = existing.exists
          ? readRecord(existing.data())
          : undefined;
        if (previous && previous.inputHash !== hash)
          throw new AccountError("failed-precondition");
        const stale =
          previous?.state === "processing" &&
          Number(lock.get("expiresAtMs") ?? 0) <= now;
        if (previous && previous.state !== "failed" && !stale)
          return { result: recordResult(input.requestId, previous, now) };
        if (previous && (previous.attempts >= 3 || previous.expiresAtMs <= now))
          throw new AccountError("failed-precondition");
        if (lock.exists && Number(lock.get("expiresAtMs")) > now)
          throw new AccountError("resource-exhausted");
        const pending =
          previous?.pending ?? (await this.pending(tx, uid, input, hash, now));
        if (!pending) throw new AccountError("failed-precondition");
        const nonce = randomUUID();
        const record: CaptureRecord = {
          inputHash: hash,
          state: "processing",
          nonce,
          attempts: (previous?.attempts ?? 0) + 1,
          expiresAtMs: now + DAY,
          pending,
          question: null,
          sourceId: null,
          memoryCount: 0,
          continuationId: null,
        };
        if (!previous && "clarificationId" in input) {
          tx.update(root.collection("operations").doc(input.clarificationId), {
            state: "continued",
            pending: null,
            question: null,
            continuationId: input.requestId,
          });
        }
        tx.set(operation, {
          ...record,
          expiresAt: Timestamp.fromMillis(record.expiresAtMs),
        });
        tx.set(root.collection("runtime").doc("capture"), {
          nonce,
          expiresAtMs: now + LEASE,
        });
        return { lease: { requestId: input.requestId, nonce, pending } };
      },
      { maxAttempts: 3 },
    );
  }

  private async pending(
    tx: Transaction,
    uid: string,
    input: CaptureInput | ClarificationInput,
    hash: string,
    now: number,
  ): Promise<PendingCapture> {
    if ("mode" in input)
      return {
        turn: {
          id: input.requestId,
          text: input.text,
          zone: input.zone,
          receivedAt: new Date(now).toISOString(),
        },
        clarification: null,
        revision: 1,
        rootHash: hash,
      };
    if (input.clarificationId === input.requestId)
      throw new AccountError("invalid-argument");
    const parent = await tx.get(
      this.root(uid).collection("operations").doc(input.clarificationId),
    );
    const record = readRecord(parent.data());
    if (
      record.state !== "needsClarification" ||
      !record.pending ||
      record.pending.revision !== input.expectedRevision ||
      record.expiresAtMs <= now ||
      record.pending.revision >= 3
    )
      throw new AccountError("failed-precondition");
    const clarification = [record.pending.clarification, input.text]
      .filter(Boolean)
      .join("\n");
    if (clarification.length > 2000) throw new AccountError("invalid-argument");
    return {
      ...record.pending,
      clarification,
      revision: record.pending.revision + 1,
    };
  }

  async finish(
    uid: string,
    lease: CaptureLease,
    extraction: Extraction,
    snapshot: Snapshot,
  ): Promise<CaptureResult> {
    const root = this.root(uid),
      target = root.collection("operations").doc(lease.requestId),
      now = this.now();
    return this.db.runTransaction(
      async (tx) => {
        await this.owner(tx, uid);
        const [operation, lock, source] = await tx.getAll(
          target,
          root.collection("runtime").doc("capture"),
          root.collection("sources").doc(lease.pending.turn.id),
        );
        if (!operation || !lock || !source)
          throw new AccountError("unavailable");
        const record = readRecord(operation.data());
        if (
          record.state !== "processing" ||
          record.nonce !== lease.nonce ||
          lock.get("nonce") !== lease.nonce ||
          Number(lock.get("expiresAtMs")) <= now ||
          source.exists
        )
          throw new AccountError("failed-precondition");
        const saved = extraction.status === "saved";
        const needsRetelling =
          extraction.status === "needs_clarification" &&
          lease.pending.revision >= 3;
        if (
          saved &&
          (snapshot.sources.length !== 1 ||
            snapshot.sources[0]?.id !== lease.pending.turn.id ||
            snapshot.memories.length !== extraction.items.length)
        )
          throw new AccountError("failed-precondition");
        if (saved) {
          tx.create(root.collection("sources").doc(lease.pending.turn.id), {
            ...snapshot.sources[0]!,
            requestHash: lease.pending.rootHash,
            memoryCount: snapshot.memories.length,
          });
          for (const memory of snapshot.memories) {
            if (memory.sourceId !== lease.pending.turn.id)
              throw new AccountError("failed-precondition");
            tx.create(root.collection("memories").doc(memory.id), memory);
          }
        }
        const next: CaptureRecord = {
          ...record,
          state: needsRetelling
            ? "needsRetelling"
            : saved
              ? "saved"
              : extraction.status === "needs_clarification"
                ? "needsClarification"
                : "ignored",
          pending:
            extraction.status === "needs_clarification" && !needsRetelling
              ? lease.pending
              : null,
          question: needsRetelling ? null : extraction.clarification,
          sourceId: saved ? lease.pending.turn.id : null,
          memoryCount: saved ? snapshot.memories.length : 0,
          expiresAtMs: now + (saved ? 7 * DAY : DAY),
        };
        tx.set(target, {
          ...next,
          expiresAt: Timestamp.fromMillis(next.expiresAtMs),
        });
        tx.delete(root.collection("runtime").doc("capture"));
        return recordResult(lease.requestId, next, now);
      },
      { maxAttempts: 3 },
    );
  }

  async fail(uid: string, lease: CaptureLease): Promise<void> {
    const root = this.root(uid),
      target = root.collection("operations").doc(lease.requestId);
    await this.db.runTransaction(
      async (tx) => {
        const [operation, lock] = await tx.getAll(
          target,
          root.collection("runtime").doc("capture"),
        );
        if (!operation || !lock) throw new AccountError("unavailable");
        if (
          operation.get("state") === "processing" &&
          operation.get("nonce") === lease.nonce
        )
          tx.update(target, { state: "failed" });
        if (lock.get("nonce") === lease.nonce)
          tx.delete(root.collection("runtime").doc("capture"));
      },
      { maxAttempts: 3 },
    );
  }

  async operation(uid: string, id: string): Promise<CaptureResult> {
    return this.db.runTransaction(async (tx) => {
      await this.owner(tx, uid);
      let current = id;
      for (let depth = 0; depth < 4; depth++) {
        const snapshot = await tx.get(
          this.root(uid).collection("operations").doc(current),
        );
        if (!snapshot.exists)
          return { apiVersion: 1, status: "expired", operationId: id };
        const record = readRecord(snapshot.data());
        if (record.state !== "continued" || !record.continuationId)
          return recordResult(current, record, this.now());
        current = record.continuationId;
      }
      throw new AccountError("failed-precondition");
    });
  }

  async source(
    uid: string,
    id: string,
  ): Promise<{ sourceId: string; text: string; receivedAt: string }> {
    return this.db.runTransaction(async (tx) => {
      await this.owner(tx, uid);
      const snapshot = await tx.get(
        this.root(uid).collection("sources").doc(id),
      );
      if (
        !snapshot.exists ||
        typeof snapshot.get("text") !== "string" ||
        typeof snapshot.get("receivedAt") !== "string"
      )
        throw new AccountError("failed-precondition");
      return {
        sourceId: id,
        text: snapshot.get("text") as string,
        receivedAt: snapshot.get("receivedAt") as string,
      };
    });
  }
}
