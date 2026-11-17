import type { Firestore, Transaction } from "firebase-admin/firestore";
import { AccountError } from "../account/contracts.js";
import { runtimeSchema } from "./records.js";

export async function authorizeV2(
  tx: Transaction,
  db: Firestore,
  uid: string,
  generation?: string,
) {
  if (!/^[A-Za-z0-9_-]{1,128}$/u.test(uid))
    throw new AccountError("permission-denied");
  const [owner, runtime] = await tx.getAll(
    db.doc("privateConfiguration/owner"),
    db.doc(`accounts/${uid}/runtime/memory`),
  );
  if (owner?.get("uid") !== uid || owner.get("enabled") !== true)
    throw new AccountError("permission-denied");
  const parsed = runtimeSchema.safeParse(runtime?.data());
  if (
    !parsed.success ||
    parsed.data.status !== "active" ||
    (generation !== undefined && parsed.data.generation !== generation)
  )
    throw new AccountError("failed-precondition");
  return parsed.data;
}

/** Called inside old storage transactions, including commits that started before activation. */
export async function requireLegacyMemory(
  tx: Transaction,
  db: Firestore,
  uid: string,
) {
  const runtime = await tx.get(db.doc(`accounts/${uid}/runtime/memory`));
  if (
    runtime.exists &&
    (runtime.get("schemaVersion") === 2 ||
      runtime.get("status") === "maintenance")
  )
    throw new AccountError("failed-precondition");
}
