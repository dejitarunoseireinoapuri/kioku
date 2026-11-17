import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
import type { Firestore } from "firebase-admin/firestore";
import { SolProvider } from "#memory-v2/ai/provider";
import { AccountError } from "../account/contracts.js";
import { FirestoreCredentialStore } from "../firebase/credential-store.js";
import { FirestoreMemoryBudget } from "../firebase/memory-budget.js";
import { V2Reader } from "./reader.js";

export async function v2Provider(
  db: Firestore,
  uid: string,
  generation: string,
  epoch: number,
  validate?: () => Promise<void>,
) {
  const record = await new FirestoreCredentialStore(db).current(uid);
  if (!record) throw new AccountError("failed-precondition");
  const client = new SecretManagerServiceClient();
  try {
    const [version] = await client.accessSecretVersion(
      { name: record.secretVersion },
      { timeout: 10_000 },
    );
    const key = Buffer.from(version.payload?.data ?? []).toString("utf8");
    const budget = new FirestoreMemoryBudget(db, uid);
    const reader = new V2Reader(db, uid, generation);
    return new SolProvider(
      key,
      {
        reserve: async (amount) => {
          await reader.assertCurrent(epoch);
          await validate?.();
          await budget.reserve(amount);
        },
        settle: (reservation, input, output) =>
          budget.settle(reservation, input, output, false),
      },
      () => undefined,
    );
  } catch (error) {
    if (error instanceof AccountError) throw error;
    throw new AccountError("unavailable");
  } finally {
    await client.close();
  }
}
