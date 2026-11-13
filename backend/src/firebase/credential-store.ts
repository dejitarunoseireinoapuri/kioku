import type { Firestore } from "firebase-admin/firestore";
import { z } from "zod";
import { AccountError } from "../account/contracts.js";
import type { CredentialStatus } from "../account/contracts.js";
import type {
  CredentialRecord,
  CredentialStore,
} from "../credential/contracts.js";

export const CREDENTIAL_PROJECT = "kioku-9454f";
export const SECRET_NAME = "kioku-openai-owner";

const recordSchema = z.strictObject({
  uid: z.string().regex(/^[A-Za-z0-9_-]{1,128}$/),
  revision: z.number().int().min(1).max(1_000_001),
  secretVersion: z
    .string()
    .regex(
      /^projects\/kioku-9454f\/secrets\/kioku-openai-owner\/versions\/[1-9][0-9]{0,18}$/,
    ),
  operationId: z.uuid(),
  updatedAtMs: z.number().int().nonnegative(),
});

export class FirestoreCredentialStore
  implements CredentialStore, CredentialStatus
{
  private readonly db: Firestore;
  constructor(db: Firestore) {
    this.db = db;
  }

  async current(uid: string): Promise<CredentialRecord | undefined> {
    const [owner, snapshot] = await this.db.getAll(
      this.db.doc("privateConfiguration/owner"),
      this.db.doc("privateConfiguration/ai"),
    );
    if (
      !owner ||
      owner.get("uid") !== uid ||
      owner.get("enabled") !== true ||
      !snapshot
    ) {
      throw new AccountError("permission-denied");
    }
    return this.parse(snapshot.exists ? snapshot.data() : undefined, uid);
  }

  async read(
    uid: string,
  ): Promise<{ ai: "ready" | "notConfigured"; revision: number }> {
    const record = await this.current(uid);
    return {
      ai: record ? "ready" : "notConfigured",
      revision: record?.revision ?? 0,
    };
  }

  async activate(
    record: CredentialRecord,
    expectedRevision: number,
  ): Promise<void> {
    this.parse(record, record.uid);
    await this.db.runTransaction(
      async (tx) => {
        const owner = await tx.get(this.db.doc("privateConfiguration/owner"));
        const target = this.db.doc("privateConfiguration/ai");
        const existing = await tx.get(target);
        if (owner.get("uid") !== record.uid || owner.get("enabled") !== true) {
          throw new AccountError("permission-denied");
        }
        const previous = this.parse(
          existing.exists ? existing.data() : undefined,
          record.uid,
        );
        if (
          (previous?.revision ?? 0) !== expectedRevision ||
          record.revision !== expectedRevision + 1
        ) {
          throw new AccountError("failed-precondition");
        }
        tx.set(target, { ...record });
      },
      { maxAttempts: 3 },
    );
  }

  private parse(value: unknown, uid: string): CredentialRecord | undefined {
    if (value === undefined) return undefined;
    const parsed = recordSchema.safeParse(value);
    if (!parsed.success) throw new AccountError("failed-precondition");
    if (parsed.data.uid !== uid) throw new AccountError("permission-denied");
    return parsed.data;
  }
}
