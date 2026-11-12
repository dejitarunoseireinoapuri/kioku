import { readFile } from "node:fs/promises";
import { z } from "zod";
import { MemoryError } from "./domain.ts";
import { atomicWrite } from "./file-store.ts";
import { modelProfile } from "./model-config.ts";

const ledgerSchema = z.strictObject({
  spentUsd: z.number().nonnegative(),
  reservedUsd: z.number().nonnegative(),
  inputTokens: z.number().nonnegative(),
  outputTokens: z.number().nonnegative(),
  calls: z.number().int().nonnegative(),
  generationInputTokens: z.number().int().nonnegative().default(0),
  embeddingInputTokens: z.number().int().nonnegative().default(0),
});
export type Ledger = z.infer<typeof ledgerSchema>;

// GPT-5.4 public standard-processing tariffs verified 2026-11-12; prior ledger costs are preserved.
export const maximumBudgetUsd = 20;
export const rates = {
  input: modelProfile.inputCeiling,
  output: modelProfile.output,
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
    generationInputTokens: 0,
    embeddingInputTokens: 0,
  };

  constructor(file: string, maximum: number) {
    if (!(maximum > 0 && maximum <= maximumBudgetUsd))
      throw new MemoryError("BUDGET_LIMIT");
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
    if (embedding) this.ledger.embeddingInputTokens += input;
    else this.ledger.generationInputTokens += input;
    this.ledger.outputTokens += output;
    await this.persist();
  }

  private async persist(): Promise<void> {
    try {
      await atomicWrite(this.file, JSON.stringify(this.ledger));
    } catch {
      throw new MemoryError("BUDGET_WRITE_FAILED");
    }
  }
}
