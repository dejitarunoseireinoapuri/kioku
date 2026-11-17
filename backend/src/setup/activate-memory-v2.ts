import { randomUUID } from "node:crypto";
import type { Firestore } from "firebase-admin/firestore";
import { AccountError } from "../account/contracts.js";
import { collectionNames } from "../memory-v2/records.js";

const legacy = ["sources", "memories", "operations", "revocations"];
const current = [
  ...Object.values(collectionNames),
  "memoryV2Groups",
  "memoryV2Operations",
  "memoryV2Plans",
  "memoryV2RequestIds",
  "memoryV2Applied",
];

/** Operator-only, explicitly authorized fresh start. Never exported as a callable. */
export async function activateEmptyMemoryV2(
  db: Firestore,
  uid: string,
  apply: boolean,
) {
  if (!/^[A-Za-z0-9_-]{1,128}$/u.test(uid))
    throw new AccountError("permission-denied");
  const ownerRef = db.doc("privateConfiguration/owner"),
    root = db.doc(`accounts/${uid}`),
    runtime = root.collection("runtime").doc("memory");
  const owner = await ownerRef.get();
  if (owner.get("uid") !== uid || owner.get("enabled") !== true)
    throw new AccountError("permission-denied");
  const collections = await root.listCollections();
  if (
    collections.some(
      (c) => ![...legacy, ...current, "runtime", "usage"].includes(c.id),
    )
  )
    throw new AccountError("failed-precondition");
  const counts: Record<string, number> = {};
  for (const name of [...legacy, ...current])
    counts[name] = (await root.collection(name).count().get()).data().count;
  if (current.some((name) => counts[name] !== 0))
    throw new AccountError("failed-precondition");
  const previous = await runtime.get();
  if (
    previous.get("schemaVersion") === 2 &&
    previous.get("status") === "active"
  )
    return { applied: false, alreadyActive: true, counts };
  if (!apply) return { applied: false, alreadyActive: false, counts };
  const generation =
    previous.get("schemaVersion") === 2 &&
    previous.get("status") === "maintenance" &&
    previous.get("resetFromLegacy") === true
      ? String(previous.get("generation"))
      : randomUUID();
  await db.runTransaction(
    async (tx) => {
      const [owner, currentRuntime] = await tx.getAll(ownerRef, runtime);
      if (owner?.get("uid") !== uid || owner.get("enabled") !== true)
        throw new AccountError("permission-denied");
      if (
        currentRuntime?.get("schemaVersion") === 2 &&
        !(
          currentRuntime.get("status") === "maintenance" &&
          currentRuntime.get("resetFromLegacy") === true
        )
      )
        throw new AccountError("failed-precondition");
      tx.set(runtime, {
        schemaVersion: 2,
        status: "maintenance",
        generation,
        revision: 0,
        resetFromLegacy: true,
      });
    },
    { maxAttempts: 3 },
  );
  const removed: Record<string, number> = {};
  for (const name of legacy) {
    let count = 0,
      complete = false;
    for (let page = 0; page < 100; page++) {
      const size = await db.runTransaction(
        async (tx) => {
          const [owner, state] = await tx.getAll(ownerRef, runtime);
          if (
            owner?.get("uid") !== uid ||
            owner.get("enabled") !== true ||
            state?.get("status") !== "maintenance" ||
            state.get("generation") !== generation
          )
            throw new AccountError("failed-precondition");
          const documents = await tx.get(
            root.collection(name).select().limit(200),
          );
          for (const document of documents.docs) tx.delete(document.ref);
          return documents.size;
        },
        { maxAttempts: 3 },
      );
      count += size;
      if (size < 200) {
        complete = true;
        break;
      }
    }
    if (!complete) throw new AccountError("resource-exhausted");
    removed[name] = count;
  }
  await db.runTransaction(
    async (tx) => {
      const [owner, state] = await tx.getAll(ownerRef, runtime);
      if (
        owner?.get("uid") !== uid ||
        owner.get("enabled") !== true ||
        state?.get("status") !== "maintenance" ||
        state.get("generation") !== generation
      )
        throw new AccountError("failed-precondition");
      for (const name of [...legacy, ...current])
        if (!(await tx.get(root.collection(name).select().limit(1))).empty)
          throw new AccountError("failed-precondition");
      tx.delete(root.collection("runtime").doc("capture"));
      tx.set(runtime, {
        schemaVersion: 2,
        status: "active",
        generation,
        revision: 0,
      });
    },
    { maxAttempts: 3 },
  );
  return { applied: true, alreadyActive: false, removed, empty: true };
}
