import { FieldPath } from "firebase-admin/firestore";
import type {
  Firestore,
  QueryDocumentSnapshot,
} from "firebase-admin/firestore";
import { AccountError } from "../account/contracts.js";
import {
  searchProjection,
  canonicalMemory,
} from "../query/search-projection.js";

/** Operator-only, bounded migration: no model calls and no memory/source text in its result. */
export async function prepareSearch(
  db: Firestore,
  uid: string,
  apply: boolean,
) {
  const owner = await db.doc("privateConfiguration/owner").get();
  if (owner.get("uid") !== uid || owner.get("enabled") !== true)
    throw new AccountError("permission-denied");
  let after: QueryDocumentSnapshot | undefined,
    checked = 0,
    changed = 0;
  for (let page = 0; page < 100; page++) {
    const collection = db
      .collection(`accounts/${uid}/memories`)
      .orderBy(FieldPath.documentId())
      .limit(200);
    const documents = await (
      after ? collection.startAfter(after) : collection
    ).get();
    for (const document of documents.docs) {
      checked++;
      const memory = canonicalMemory(document.data());
      if (memory.id !== document.id || memory.vector.length !== 512)
        throw new AccountError("failed-precondition");
      if (document.get("searchSchema") === 1) continue;
      changed++;
      if (apply)
        await document.ref.update(searchProjection(memory), {
          lastUpdateTime: document.updateTime,
        });
    }
    if (documents.size < 200) {
      if (apply)
        await db.runTransaction(async (tx) => {
          const current = await tx.get(db.doc("privateConfiguration/owner"));
          if (current.get("uid") !== uid || current.get("enabled") !== true)
            throw new AccountError("permission-denied");
          tx.set(db.doc("privateConfiguration/search"), {
            uid,
            schema: 1,
            ready: true,
          });
        });
      return { checked, changed, applied: apply };
    }
    after = documents.docs.at(-1);
  }
  throw new AccountError("resource-exhausted");
}
