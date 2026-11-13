import type { Firestore } from "firebase-admin/firestore";
import { Timestamp } from "firebase-admin/firestore";
import { rates } from "#memory-core/budget";
import { AccountError } from "../account/contracts.js";

/** Conservative reservations survive uncertain provider failures; they contain no user text. */
export class FirestoreMemoryBudget {
  private readonly db: Firestore;
  private readonly uid: string;
  private readonly day: string;
  private requestReserved = 0;
  private calls = 0;
  constructor(db: Firestore, uid: string, now = Date.now()) {
    this.db = db;
    this.uid = uid;
    this.day = new Date(now).toISOString().slice(0, 10);
  }
  async reserve(amount: number): Promise<void> {
    if (
      !Number.isFinite(amount) ||
      amount <= 0 ||
      this.requestReserved + amount > 1 ||
      this.calls >= 8
    )
      throw new AccountError("resource-exhausted");
    const reference = this.db.doc(`accounts/${this.uid}/usage/${this.day}`);
    await this.db.runTransaction(
      async (tx) => {
        const [owner, record] = await tx.getAll(
          this.db.doc("privateConfiguration/owner"),
          reference,
        );
        if (
          !owner ||
          owner.get("uid") !== this.uid ||
          owner.get("enabled") !== true
        )
          throw new AccountError("permission-denied");
        const previous = record?.exists ? record.get("reservedUsd") : 0;
        if (
          typeof previous !== "number" ||
          !Number.isFinite(previous) ||
          previous < 0 ||
          previous + amount > 10
        )
          throw new AccountError("resource-exhausted");
        tx.set(
          reference,
          {
            reservedUsd: previous + amount,
            calls: Number(record?.get("calls") ?? 0) + 1,
            expiresAt: Timestamp.fromMillis(
              Date.parse(this.day) + 30 * 86_400_000,
            ),
          },
          { merge: true },
        );
      },
      { maxAttempts: 3 },
    );
    this.requestReserved += amount;
    this.calls++;
  }
  async settle(
    reservation: number,
    input: number,
    output: number,
    embedding: boolean,
  ): Promise<void> {
    const actual =
      input * (embedding ? rates.embedding : rates.input) +
      output * rates.output;
    if (
      ![reservation, input, output, actual].every(
        (value) => Number.isFinite(value) && value >= 0,
      ) ||
      actual > reservation
    )
      throw new AccountError("resource-exhausted");
    const reference = this.db.doc(`accounts/${this.uid}/usage/${this.day}`);
    await this.db.runTransaction(
      async (tx) => {
        const record = await tx.get(reference);
        const previous = record.get("reservedUsd");
        if (typeof previous !== "number" || previous < reservation)
          throw new AccountError("failed-precondition");
        tx.update(reference, {
          reservedUsd: previous - reservation + actual,
          inputTokens: Number(record.get("inputTokens") ?? 0) + input,
          outputTokens: Number(record.get("outputTokens") ?? 0) + output,
        });
      },
      { maxAttempts: 3 },
    );
  }
}
