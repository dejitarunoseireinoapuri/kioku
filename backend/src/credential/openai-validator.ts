import { AccountError } from "../account/contracts.js";
import type { CredentialValidator } from "./contracts.js";

/** Fixed OpenAI destination, no inference, redirect following or raw provider diagnostics. */
export class OpenAiCredentialValidator implements CredentialValidator {
  private readonly request: typeof fetch;
  constructor(request: typeof fetch = fetch) {
    this.request = request;
  }

  async validate(key: string): Promise<boolean> {
    try {
      const response = await this.request(
        "https://api.openai.com/v1/models/gpt-6.1-sol",
        {
          headers: { Authorization: `Bearer ${key}` },
          redirect: "error",
          signal: AbortSignal.timeout(10_000),
        },
      );
      await response.body?.cancel();
      if ([401, 403, 404].includes(response.status)) return false;
      if (response.status !== 200) throw new AccountError("unavailable");
      return true;
    } catch {
      throw new AccountError("unavailable");
    }
  }
}
