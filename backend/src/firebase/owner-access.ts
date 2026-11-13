import type { Firestore } from "firebase-admin/firestore";
import { z } from "zod";
import { AccountError } from "../account/contracts.js";
import type { OwnerAccess } from "../account/contracts.js";

const ownerSchema = z.strictObject({
  uid: z.string().regex(/^[A-Za-z0-9_-]{1,128}$/),
  enabled: z.boolean(),
  window: z.number().int().nonnegative(),
  count: z.number().int().min(1).max(30),
});

export class FirestoreOwnerAccess implements OwnerAccess {
  readonly #db: Firestore;

  constructor(db: Firestore) {
    this.#db = db;
  }

  async admit(uid: string, nowMs: number): Promise<void> {
    const reference = this.#db.doc("privateConfiguration/owner");
    const window = Math.floor(nowMs / 60_000);
    await this.#db.runTransaction(
      async (transaction) => {
        const snapshot = await transaction.get(reference);
        const parsed = ownerSchema.safeParse(snapshot.data());
        if (snapshot.exists && !parsed.success) {
          throw new AccountError("failed-precondition");
        }
        const owner = parsed.success ? parsed.data : undefined;
        if (owner && (owner.uid !== uid || !owner.enabled)) {
          throw new AccountError("permission-denied");
        }
        const count = owner?.window === window ? owner.count + 1 : 1;
        if (count > 30) throw new AccountError("resource-exhausted");
        transaction.set(reference, { uid, enabled: true, window, count });
      },
      { maxAttempts: 3 },
    );
  }
}
