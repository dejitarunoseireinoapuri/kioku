import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
import { AccountError } from "../account/contracts.js";
import {
  CREDENTIAL_PROJECT,
  SECRET_NAME,
} from "../firebase/credential-store.js";
import type { CredentialVault } from "./contracts.js";

const parent = `projects/${CREDENTIAL_PROJECT}/secrets/${SECRET_NAME}`;

export class GoogleCredentialVault implements CredentialVault {
  private readonly client: SecretManagerServiceClient;
  constructor(client: SecretManagerServiceClient) {
    this.client = client;
  }

  async stage(key: string): Promise<string> {
    const [version] = await this.client.addSecretVersion(
      { parent, payload: { data: Buffer.from(key, "utf8") } },
      { timeout: 10_000, retry: null },
    );
    const name = version.name;
    if (
      !name ||
      !/^projects\/(?:kioku-9454f|1008044927836)\/secrets\/kioku-openai-owner\/versions\/[1-9][0-9]{0,18}$/.test(
        name,
      )
    ) {
      throw new AccountError("unavailable");
    }
    return name.replace(
      "projects/1008044927836/",
      `projects/${CREDENTIAL_PROJECT}/`,
    );
  }

  async discard(name: string): Promise<void> {
    if (
      !name.startsWith(`${parent}/versions/`) ||
      !/\/versions\/[1-9][0-9]*$/.test(name)
    ) {
      throw new AccountError("failed-precondition");
    }
    await this.client.destroySecretVersion(
      { name },
      { timeout: 10_000, retry: null },
    );
  }
}
