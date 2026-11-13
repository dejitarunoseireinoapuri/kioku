export interface CredentialRecord {
  readonly uid: string;
  readonly revision: number;
  readonly secretVersion: string;
  readonly operationId: string;
  readonly updatedAtMs: number;
}

export interface CredentialStore {
  current(uid: string): Promise<CredentialRecord | undefined>;
  activate(record: CredentialRecord, expectedRevision: number): Promise<void>;
}

export interface CredentialVault {
  stage(key: string): Promise<string>;
  discard(version: string): Promise<void>;
}

export interface CredentialValidator {
  validate(key: string): Promise<boolean>;
}
