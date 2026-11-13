export type SafeErrorCode =
  | "unauthenticated"
  | "permission-denied"
  | "invalid-argument"
  | "resource-exhausted"
  | "failed-precondition"
  | "unavailable";

export class AccountError extends Error {
  readonly code: SafeErrorCode;

  constructor(code: SafeErrorCode) {
    super(code);
    this.code = code;
  }
}

/** Only the verified token adapter can construct this identity at the boundary. */
export interface VerifiedIdentity {
  readonly uid: string;
  readonly email: string | undefined;
  readonly emailVerified: boolean;
  readonly provider: string | undefined;
}

export interface Configuration {
  readonly apiVersion: 1;
  readonly account: "authorized";
  readonly ai: "notConfigured" | "ready";
  readonly revision: number;
}

export interface OwnerAccess {
  /** Atomically binds the first permitted Google identity; never rebinds it. */
  admit(uid: string, nowMs: number): Promise<void>;
}

export interface CredentialStatus {
  read(uid: string): Promise<Pick<Configuration, "ai" | "revision">>;
}
