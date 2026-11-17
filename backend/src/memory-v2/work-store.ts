import { randomUUID } from "node:crypto";
import { Timestamp } from "firebase-admin/firestore";
import type { Firestore, Transaction } from "firebase-admin/firestore";
import { z } from "zod";
import { AccountError } from "../account/contracts.js";
import { authorizeV2 } from "./access.js";
import { operationsCollection, privateDigest } from "./state-store.js";
import type { PendingTurn, V2Reply, WorkLease } from "./contracts.js";

const turnSchema = z.strictObject({
  text: z.string().min(1).max(8000),
  at: z.iso.datetime(),
  zone: z.string().min(1).max(80),
  clarification: z
    .strictObject({
      original: z.string().min(1).max(8000),
      question: z.string().min(1).max(500),
    })
    .optional(),
  interventions: z
    .array(
      z.strictObject({
        text: z.string().min(1).max(8000),
        at: z.iso.datetime(),
        zone: z.string().min(1).max(80),
      }),
    )
    .max(4)
    .optional(),
});
export const workSchema = z.object({
  requestId: z.uuid(),
  requestHash: z.string().regex(/^[a-f0-9]{64}$/u),
  nonce: z.uuid(),
  generation: z.uuid(),
  epoch: z.number().int().nonnegative(),
  expiresAtMs: z.number().int().nonnegative(),
  state: z.enum([
    "processing",
    "clarification",
    "committed",
    "ignored",
    "failed",
    "superseded",
  ]),
  turn: turnSchema.nullable(),
  revision: z.number().int().min(0).max(3),
  reply: z.record(z.string(), z.unknown()).nullable(),
});
export type WorkRecord = z.infer<typeof workSchema>;
export const operationReply = (id: string, status: string): V2Reply => ({
  apiVersion: 2,
  operationId: id,
  status,
});
const LEASE_MS = 180_000,
  PENDING_MS = 900_000;

export class V2WorkStore {
  readonly db: Firestore;
  readonly now: () => number;
  constructor(db: Firestore, now: () => number = Date.now) {
    this.db = db;
    this.now = now;
  }
  ref(uid: string, id: string) {
    return this.db.doc(`accounts/${uid}/${operationsCollection}/${id}`);
  }

  async begin(
    uid: string,
    generation: string,
    requestId: string,
    input: unknown,
    turn: PendingTurn | null,
    clarification?: { id: string; revision: number; text: string },
  ): Promise<{ lease: WorkLease } | { reply: V2Reply }> {
    const hash = privateDigest([uid, generation, input]);
    return this.db.runTransaction(
      async (tx) => {
        const runtime = await authorizeV2(tx, this.db, uid, generation);
        const reference = this.ref(uid, requestId),
          existing = await tx.get(reference);
        const admissionRef = this.db.doc(
          `accounts/${uid}/memoryV2RequestIds/${requestId}`,
        );
        const admission = await tx.get(admissionRef);
        if (
          admission.exists &&
          (admission.get("hash") !== hash ||
            admission.get("generation") !== generation)
        )
          throw new AccountError("failed-precondition");
        if (existing.exists) {
          const record = workSchema.parse(existing.data());
          if (record.requestHash !== hash || record.generation !== generation)
            throw new AccountError("failed-precondition");
          if (record.state === "processing")
            return {
              reply: operationReply(
                requestId,
                record.expiresAtMs > this.now()
                  ? "processing"
                  : "needsRetelling",
              ),
            };
          if (
            record.state === "clarification" &&
            record.expiresAtMs <= this.now()
          )
            return { reply: operationReply(requestId, "expired") };
          return {
            reply: record.reply ?? operationReply(requestId, "needsRetelling"),
          };
        }
        if (admission.exists)
          return { reply: operationReply(requestId, "expired") };
        const active = await tx.get(
          this.db
            .collection(`accounts/${uid}/${operationsCollection}`)
            .where("state", "in", ["processing", "clarification"])
            .limit(9),
        );
        if (active.size > 8) throw new AccountError("resource-exhausted");
        const live = active.docs.filter(
          (d) => workSchema.parse(d.data()).expiresAtMs > this.now(),
        );
        if (
          live.length -
            (clarification && live.some((d) => d.id === clarification.id)
              ? 1
              : 0) >=
          8
        )
          throw new AccountError("resource-exhausted");
        let prepared = turn,
          revision = 0;
        if (clarification) {
          const previous = await tx.get(this.ref(uid, clarification.id));
          const record = workSchema.parse(previous.data());
          if (
            record.generation !== generation ||
            record.epoch !== runtime.revision ||
            record.state !== "clarification" ||
            record.revision !== clarification.revision ||
            record.expiresAtMs <= this.now() ||
            !record.turn
          )
            throw new AccountError("failed-precondition");
          const original = record.turn;
          const interventions = [
            ...(original.interventions ?? [
              { text: original.text, at: original.at, zone: original.zone },
            ]),
            {
              text: clarification.text,
              at: new Date(this.now()).toISOString(),
              zone: original.zone,
            },
          ];
          if (
            interventions.length > 4 ||
            interventions.map((i) => i.text).join("\n").length > 8000
          )
            throw new AccountError("resource-exhausted");
          prepared = {
            text: interventions.map((i) => i.text).join("\n"),
            at: interventions[interventions.length - 1]!.at,
            zone: original.zone,
            interventions,
            clarification: {
              original: interventions[0]!.text,
              question: z
                .string()
                .min(1)
                .max(500)
                .parse(record.reply?.question),
            },
          };
          revision = record.revision;
          tx.set(previous.ref, {
            ...record,
            state: "superseded",
            turn: null,
            reply: operationReply(clarification.id, "needsRetelling"),
            expiresAt: Timestamp.fromMillis(this.now() + PENDING_MS),
          });
        }
        for (const document of active.docs)
          if (workSchema.parse(document.data()).expiresAtMs <= this.now())
            tx.update(document.ref, {
              state: "failed",
              turn: null,
              reply: null,
            });
        const lease: WorkLease = {
          requestId,
          nonce: randomUUID(),
          generation,
          epoch: runtime.revision,
          expiresAt: this.now() + LEASE_MS,
          turn: prepared,
        };
        const record: WorkRecord = {
          ...lease,
          requestHash: hash,
          expiresAtMs: lease.expiresAt,
          state: "processing",
          revision,
          reply: null,
        };
        tx.set(reference, {
          ...record,
          expiresAt: Timestamp.fromMillis(this.now() + PENDING_MS),
        });
        tx.set(admissionRef, { hash, generation });
        return { lease };
      },
      { maxAttempts: 3 },
    );
  }

  async current(
    tx: Transaction,
    uid: string,
    lease: WorkLease,
  ): Promise<WorkRecord> {
    const record = workSchema.parse(
      (await tx.get(this.ref(uid, lease.requestId))).data(),
    );
    if (
      record.nonce !== lease.nonce ||
      record.generation !== lease.generation ||
      record.epoch !== lease.epoch ||
      record.state !== "processing" ||
      record.expiresAtMs <= this.now()
    )
      throw new AccountError("failed-precondition");
    return record;
  }

  async finish(
    uid: string,
    lease: WorkLease,
    state: WorkRecord["state"],
    reply: V2Reply,
    question?: string,
    validate?: (tx: Transaction) => Promise<void>,
  ): Promise<void> {
    await this.db.runTransaction(
      async (tx) => {
        const runtime = await authorizeV2(tx, this.db, uid, lease.generation);
        const record = await this.current(tx, uid, lease);
        if (runtime.revision !== lease.epoch)
          throw new AccountError("failed-precondition");
        await validate?.(tx);
        const revision = record.revision + (question ? 1 : 0);
        if (revision > 3) throw new AccountError("resource-exhausted");
        tx.set(this.ref(uid, lease.requestId), {
          ...record,
          state,
          turn: question ? record.turn : null,
          revision,
          reply,
          expiresAtMs: question ? this.now() + PENDING_MS : record.expiresAtMs,
          expiresAt: Timestamp.fromMillis(this.now() + PENDING_MS),
        });
      },
      { maxAttempts: 3 },
    );
  }

  async operation(
    uid: string,
    generation: string,
    id: string,
  ): Promise<V2Reply> {
    return this.db.runTransaction(
      async (tx) => {
        await authorizeV2(tx, this.db, uid, generation);
        const document = await tx.get(this.ref(uid, id));
        if (!document.exists) return operationReply(id, "expired");
        const record = workSchema.parse(document.data());
        if (record.generation !== generation)
          throw new AccountError("failed-precondition");
        if (
          ["processing", "clarification"].includes(record.state) &&
          record.expiresAtMs <= this.now()
        )
          return operationReply(id, "needsRetelling");
        return (
          record.reply ??
          operationReply(
            id,
            record.state === "processing" ? "processing" : "needsRetelling",
          )
        );
      },
      { maxAttempts: 3 },
    );
  }

  async fail(uid: string, lease: WorkLease): Promise<void> {
    await this.db.runTransaction(
      async (tx) => {
        await authorizeV2(tx, this.db, uid, lease.generation);
        const document = await tx.get(this.ref(uid, lease.requestId));
        if (!document.exists) return;
        const record = workSchema.parse(document.data());
        if (record.nonce !== lease.nonce || record.state !== "processing")
          return;
        tx.update(document.ref, {
          state: "failed",
          turn: null,
          reply: operationReply(lease.requestId, "failed"),
        });
      },
      { maxAttempts: 3 },
    );
  }
}
