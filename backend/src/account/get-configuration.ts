import { z } from "zod";
import { AccountError } from "./contracts.js";
import type {
  Configuration,
  OwnerAccess,
  VerifiedIdentity,
} from "./contracts.js";

const input = z.strictObject({ apiVersion: z.literal(1) });
const uid = /^[A-Za-z0-9_-]{1,128}$/;

export class GetConfiguration {
  readonly #allowedEmail: string;
  readonly #access: OwnerAccess;
  readonly #now: () => number;

  constructor(allowedEmail: string, access: OwnerAccess, now: () => number) {
    if (!z.email().safeParse(allowedEmail).success) {
      throw new AccountError("failed-precondition");
    }
    this.#allowedEmail = allowedEmail.toLowerCase();
    this.#access = access;
    this.#now = now;
  }

  async execute(
    identity: VerifiedIdentity | undefined,
    data: unknown,
  ): Promise<Configuration> {
    if (!identity) throw new AccountError("unauthenticated");
    if (
      !uid.test(identity.uid) ||
      identity.provider !== "google.com" ||
      !identity.emailVerified ||
      identity.email?.toLowerCase() !== this.#allowedEmail
    ) {
      throw new AccountError("permission-denied");
    }
    // A caller cannot select an owner, project, secret or storage path.
    if (!input.safeParse(data).success) {
      throw new AccountError("invalid-argument");
    }
    await this.#access.admit(identity.uid, this.#now());
    // This K1 slice deliberately has no credential write endpoint or secret.
    return {
      apiVersion: 1,
      account: "authorized",
      ai: "notConfigured",
      revision: 0,
    };
  }
}
