import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { z } from "zod";
import { MemoryError } from "./domain.ts";

const ledgerSchema = z.strictObject({
  spentUsd: z.number().nonnegative(),
  reservedUsd: z.number().nonnegative(),
  inputTokens: z.number().nonnegative(),
  outputTokens: z.number().nonnegative(),
  calls: z.number().int().nonnegative(),
});
export type Ledger = z.infer<typeof ledgerSchema>;

// Public standard-processing tariffs verified 2026-11-11; an estimate, not an invoice or promo balance.
export const rates = {
  input: 0.75 / 1e6,
  output: 4.5 / 1e6,
  embedding: 0.02 / 1e6,
};

export class Budget {
  readonly file: string;
  readonly maximum: number;
  ledger: Ledger = {
    spentUsd: 0,
    reservedUsd: 0,
    inputTokens: 0,
    outputTokens: 0,
    calls: 0,
  };

  constructor(file: string, maximum: number) {
    if (!(maximum > 0 && maximum <= 2)) throw new MemoryError("BUDGET_LIMIT");
    this.file = file;
    this.maximum = maximum;
  }

  async open(): Promise<void> {
    try {
      this.ledger = ledgerSchema.parse(
        JSON.parse(await readFile(this.file, "utf8")),
      );
    } catch (error) {
      if (
        !(error instanceof Error && "code" in error && error.code === "ENOENT")
      ) {
        throw new MemoryError("BUDGET_READ_FAILED");
      }
    }
  }

  async reserve(amount: number): Promise<void> {
    if (
      !Number.isFinite(amount) ||
      amount <= 0 ||
      this.ledger.spentUsd + this.ledger.reservedUsd + amount > this.maximum
    ) {
      throw new MemoryError("BUDGET_EXHAUSTED");
    }
    this.ledger.reservedUsd += amount;
    this.ledger.calls++;
    await this.persist();
  }

  async settle(
    reservation: number,
    input: number,
    output: number,
    embedding: boolean,
  ): Promise<void> {
    if (
      ![input, output].every((value) => Number.isFinite(value) && value >= 0)
    ) {
      throw new MemoryError("USAGE_INVALID");
    }
    this.ledger.reservedUsd = Math.max(
      0,
      this.ledger.reservedUsd - reservation,
    );
    this.ledger.spentUsd +=
      input * (embedding ? rates.embedding : rates.input) +
      output * rates.output;
    this.ledger.inputTokens += input;
    this.ledger.outputTokens += output;
    await this.persist();
  }

  private async persist(): Promise<void> {
    await mkdir(dirname(this.file), { recursive: true });
    await writeFile(this.file, JSON.stringify(this.ledger), { mode: 0o600 });
  }
}
