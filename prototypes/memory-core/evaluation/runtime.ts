import {
  mkdir,
  open,
  readFile,
  rename,
  unlink,
  writeFile,
  readdir,
} from "node:fs/promises";
import { resolve, relative } from "node:path";
import { z } from "zod";
import { setTimeout as delay } from "node:timers/promises";
import { profile } from "../ai/provider.ts";
import { InterpretationError } from "../ai/contracts.ts";
import type { Meter } from "../ai/provider.ts";
import { activeBudgetWindow } from "./budget-window.ts";

const directory = resolve("local-data/r2");
const ledgerSchema = z.strictObject({
  spentUsd: z.number().nonnegative(),
  reservedUsd: z.number().nonnegative(),
  calls: z.number().int().nonnegative(),
  input: z.number().int().nonnegative(),
  output: z.number().int().nonnegative(),
  previousM0Spent: z.number().nonnegative(),
  previousM0Reserved: z.number().nonnegative(),
});
type Ledger = z.infer<typeof ledgerSchema>;
export async function saveReport(name: string, value: unknown) {
  if (!/^[a-z0-9_-]+\.json$/u.test(name))
    throw new InterpretationError("REPORT_NAME");
  const path = resolve(directory, name);
  if (relative(directory, path).startsWith(".."))
    throw new InterpretationError("REPORT_PATH");
  await mkdir(directory, { recursive: true });
  await writeFile(`${path}.tmp`, JSON.stringify(value, null, 2), {
    mode: 0o600,
  });
  // Windows may briefly lock the destination during scanning. Retry file replacement only, never inference.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await rename(`${path}.tmp`, path);
      return;
    } catch (error) {
      const sharing =
        error instanceof Error &&
        "code" in error &&
        ["EPERM", "EACCES", "EBUSY"].includes(String(error.code));
      if (!sharing || attempt === 2)
        throw new InterpretationError(
          sharing ? "LOCAL_WRITE_LOCKED" : "LOCAL_WRITE_FAILED",
        );
      await delay(25 * (attempt + 1));
    }
  }
}
export class EvaluationBudget implements Meter {
  readonly ledger: Ledger;
  readonly cap: number;
  runCeiling = 120;
  readonly persist: (ledger: Ledger) => Promise<void>;
  private tail: Promise<void> = Promise.resolve();
  constructor(
    ledger: Ledger,
    cap = 120,
    persist: (ledger: Ledger) => Promise<void> = (value) =>
      saveReport("budget.json", value),
  ) {
    this.ledger = ledger;
    this.cap = cap;
    this.persist = persist;
  }
  static async open() {
    try {
      const ledger = ledgerSchema.parse(
        JSON.parse(await readFile(resolve(directory, "budget.json"), "utf8")),
      );
      // Keep unresolved reservations visible even if an early final local write failed.
      for (const name of (await readdir(directory)).filter((n) =>
        /^(tuning|reserve)-[a-z0-9_-]+\.json$/u.test(n),
      )) {
        const report = z
          .object({ complete: z.boolean(), budget: ledgerSchema })
          .parse(JSON.parse(await readFile(resolve(directory, name), "utf8")));
        if (report.complete)
          ledger.reservedUsd = Math.max(
            ledger.reservedUsd,
            report.budget.reservedUsd,
          );
      }
      const window = await activeBudgetWindow();
      if (window && ledger.spentUsd < window.baselineSpentUsd)
        throw new InterpretationError("BUDGET_BASELINE_MISMATCH");
      return new EvaluationBudget(
        ledger,
        Math.min(120, window?.ceiling ?? 120),
      );
    } catch (error) {
      if (
        !(error instanceof Error && "code" in error && error.code === "ENOENT")
      )
        throw new InterpretationError("BUDGET_READ");
      if (await activeBudgetWindow())
        throw new InterpretationError("BUDGET_BASELINE_MISMATCH");
      const previous = z
        .object({
          spentUsd: z.number().nonnegative(),
          reservedUsd: z.number().nonnegative(),
        })
        .parse(JSON.parse(await readFile("local-data/m0/budget.json", "utf8")));
      return new EvaluationBudget({
        spentUsd: 0,
        reservedUsd: 0,
        calls: 0,
        input: 0,
        output: 0,
        previousM0Spent: previous.spentUsd,
        previousM0Reserved: previous.reservedUsd,
      });
    }
  }
  private change(update: (ledger: Ledger) => void) {
    const next = this.tail.then(async () => {
      const draft = structuredClone(this.ledger);
      update(draft);
      await this.persist(draft);
      Object.assign(this.ledger, draft);
    });
    this.tail = next.catch(() => undefined);
    return next;
  }
  reserve(amount: number) {
    return this.change((ledger) => {
      if (
        !Number.isFinite(amount) ||
        amount <= 0 ||
        ledger.spentUsd + ledger.reservedUsd + amount >
          Math.min(this.cap, this.runCeiling)
      )
        throw new InterpretationError("BUDGET_LIMIT");
      ledger.reservedUsd += amount;
      ledger.calls++;
    });
  }
  settle(reservation: number, input: number, output: number) {
    return this.change((ledger) => {
      if (
        ![reservation, input, output].every((n) => Number.isFinite(n) && n >= 0)
      )
        throw new InterpretationError("USAGE_INVALID");
      ledger.reservedUsd = Math.max(0, ledger.reservedUsd - reservation);
      ledger.spentUsd +=
        input * profile.inputRate + output * profile.outputRate;
      ledger.input += input;
      ledger.output += output;
    });
  }
}
export async function executionLock() {
  await mkdir(directory, { recursive: true });
  const path = resolve(directory, "execution.lock");
  let handle;
  try {
    handle = await open(path, "wx", 0o600);
  } catch {
    throw new InterpretationError("RUN_ALREADY_ACTIVE");
  }
  return async () => {
    await handle.close();
    await unlink(path);
  };
}
