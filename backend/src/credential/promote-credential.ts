import { z } from "zod";
import { AccountError } from "../account/contracts.js";
import type {
  CredentialStore,
  CredentialVault,
  CredentialValidator,
} from "./contracts.js";

const request = z.strictObject({
  uid: z.string().regex(/^[A-Za-z0-9_-]{1,128}$/),
  expectedRevision: z.number().int().min(0).max(1_000_000),
  operationId: z.uuid(),
  key: z
    .string()
    .min(24)
    .max(512)
    .regex(/^sk-[A-Za-z0-9_-]+$/),
});

/** Operator-only setup. Validation and immutable secret staging precede the canonical CAS. */
export class PromoteCredential {
  private readonly store: CredentialStore;
  private readonly vault: CredentialVault;
  private readonly validator: CredentialValidator;
  private readonly now: () => number;
  constructor(
    store: CredentialStore,
    vault: CredentialVault,
    validator: CredentialValidator,
    now: () => number,
  ) {
    this.store = store;
    this.vault = vault;
    this.validator = validator;
    this.now = now;
  }

  async execute(data: unknown): Promise<{ revision: number }> {
    const parsed = request.safeParse(data);
    if (!parsed.success) throw new AccountError("invalid-argument");
    const input = parsed.data;
    const previous = await this.store.current(input.uid);
    if ((previous?.revision ?? 0) !== input.expectedRevision)
      throw new AccountError("failed-precondition");
    if (!(await this.validator.validate(input.key)))
      throw new AccountError("invalid-argument");
    const secretVersion = await this.vault.stage(input.key);
    const record = {
      uid: input.uid,
      revision: input.expectedRevision + 1,
      operationId: input.operationId,
      secretVersion,
      updatedAtMs: this.now(),
    };
    try {
      await this.store.activate(record, input.expectedRevision);
    } catch (error) {
      // A timeout can follow a successful commit: never destroy a possibly active version.
      const observed = await this.store.current(input.uid);
      if (
        observed?.secretVersion === secretVersion &&
        observed.operationId === input.operationId
      ) {
        return { revision: observed.revision };
      }
      if (
        error instanceof AccountError &&
        error.code === "failed-precondition"
      ) {
        await this.vault.discard(secretVersion);
      }
      throw new AccountError("unavailable");
    }
    return { revision: record.revision };
  }
}
