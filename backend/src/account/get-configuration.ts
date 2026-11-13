import { z } from "zod";
import { AccountError } from "./contracts.js";
import type {
  Configuration,
  CredentialStatus,
  OwnerAccess,
  VerifiedIdentity,
} from "./contracts.js";

const input = z.strictObject({ apiVersion: z.literal(1) });
const uid = /^[A-Za-z0-9_-]{1,128}$/;

export class GetConfiguration {
  readonly #allowedEmail: string;
  readonly #access: OwnerAccess;
  readonly #now: () => number;
  readonly #credentials: CredentialStatus;

  constructor(
    allowedEmail: string,
    access: OwnerAccess,
    now: () => number,
    credentials: CredentialStatus = {
      read: async () => ({ ai: "notConfigured", revision: 0 }),
    },
  ) {
    if (!z.email().safeParse(allowedEmail).success) {
      throw new AccountError("failed-precondition");
    }
    this.#allowedEmail = allowedEmail.toLowerCase();
    this.#access = access;
    this.#now = now;
    this.#credentials = credentials;
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
    const credential = await this.#credentials.read(identity.uid);
    return {
      apiVersion: 1,
      account: "authorized",
      ...credential,
    };
  }
}
