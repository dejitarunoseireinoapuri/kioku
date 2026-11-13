import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
import { OpenAiMemory } from "#memory-core/openai";
import { AccountError } from "../account/contracts.js";
import { FirestoreMemoryBudget } from "../firebase/memory-budget.js";
import { FirestoreCredentialStore } from "../firebase/credential-store.js";
import type { Firestore } from "firebase-admin/firestore";

/** Reads only the currently activated, owner-bound numeric version; never a caller-supplied path. */
export async function memoryProvider(
  db: Firestore,
  uid: string,
): Promise<OpenAiMemory> {
  const record = await new FirestoreCredentialStore(db).current(uid);
  if (!record) throw new AccountError("failed-precondition");
  const client = new SecretManagerServiceClient();
  try {
    const [version] = await client.accessSecretVersion(
      { name: record.secretVersion },
      { timeout: 10_000 },
    );
    const key = Buffer.from(version.payload?.data ?? []).toString("utf8");
    if (!/^sk-[A-Za-z0-9_-]+$/.test(key))
      throw new AccountError("failed-precondition");
    return new OpenAiMemory(key, new FirestoreMemoryBudget(db, uid));
  } catch (error) {
    if (error instanceof AccountError) throw error;
    throw new AccountError("unavailable");
  } finally {
    await client.close();
  }
}
