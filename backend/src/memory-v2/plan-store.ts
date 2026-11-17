import { Timestamp } from "firebase-admin/firestore";
import type { Firestore } from "firebase-admin/firestore";
import { AccountError } from "../account/contracts.js";
import { authorizeV2 } from "./access.js";
import { plansCollection, privateDigest } from "./state-store.js";
import { V2WorkStore } from "./work-store.js";
import type { WorkLease } from "./contracts.js";
import type { Apply, Plan, Route } from "./route-contracts.js";

export async function issuePlan(
  db: Firestore,
  uid: string,
  lease: WorkLease,
  turn: Route,
  plan: Plan,
) {
  const work = new V2WorkStore(db);
  return db.runTransaction(
    async (tx) => {
      const runtime = await authorizeV2(tx, db, uid, lease.generation);
      const record = await work.current(tx, uid, lease);
      const collection = db.collection(`accounts/${uid}/${plansCollection}`);
      const current = await tx.get(collection.limit(9));
      if (runtime.revision !== lease.epoch || plan.memoryEpoch !== lease.epoch)
        throw new AccountError("failed-precondition");
      if (current.size > 8) throw new AccountError("resource-exhausted");
      const live = current.docs.filter(
        (d) => Number(d.get("expiresAtMs")) > Date.now(),
      );
      if (live.length >= 8) throw new AccountError("resource-exhausted");
      for (const document of current.docs)
        if (!live.includes(document)) tx.delete(document.ref);
      tx.set(collection.doc(turn.requestId), {
        generation: lease.generation,
        epoch: lease.epoch,
        turnHash: privateDigest(turn),
        planHash: privateDigest(plan),
        expiresAtMs: plan.expiresAtMs,
        expiresAt: Timestamp.fromMillis(plan.expiresAtMs),
        appliedId: null,
        decision: null,
      });
      tx.set(work.ref(uid, lease.requestId), {
        ...record,
        state: "committed",
        turn: null,
        reply: {
          apiVersion: 2,
          operationId: lease.requestId,
          status: "repeatRequired",
        },
        expiresAt: Timestamp.fromMillis(Date.now() + 900_000),
      });
    },
    { maxAttempts: 3 },
  );
}

export async function bindPlan(
  db: Firestore,
  uid: string,
  generation: string,
  input: Apply,
) {
  return db.runTransaction(
    async (tx) => {
      const runtime = await authorizeV2(tx, db, uid, generation);
      const admissionRef = db.doc(
        `accounts/${uid}/memoryV2Applied/${input.requestId}`,
      );
      const admission = await tx.get(admissionRef),
        hash = privateDigest([generation, input]);
      if (admission.exists) {
        if (admission.get("hash") !== hash)
          throw new AccountError("failed-precondition");
        return true;
      }
      const reference = db.doc(
          `accounts/${uid}/${plansCollection}/${input.turn.requestId}`,
        ),
        document = await tx.get(reference);
      if (
        !document.exists ||
        document.get("generation") !== generation ||
        document.get("epoch") !== runtime.revision ||
        document.get("turnHash") !== privateDigest(input.turn) ||
        document.get("planHash") !== privateDigest(input.plan) ||
        Number(document.get("expiresAtMs")) <= Date.now()
      )
        throw new AccountError("failed-precondition");
      const applied = document.get("appliedId");
      if (
        applied !== null &&
        (applied !== input.requestId ||
          document.get("decision") !== input.decision)
      )
        throw new AccountError("failed-precondition");
      if (
        input.plan.action === "offer"
          ? input.decision === "apply"
          : input.decision !== "apply"
      )
        throw new AccountError("invalid-argument");
      tx.update(reference, {
        appliedId: input.requestId,
        decision: input.decision,
      });
      tx.set(admissionRef, { hash });
      return false;
    },
    { maxAttempts: 3 },
  );
}
