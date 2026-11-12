import { mkdir, open, unlink } from "node:fs/promises";
import { Budget } from "./budget.ts";
import { MemoryError } from "./domain.ts";
import { OpenAiMemory } from "./openai.ts";
import { z } from "zod";

export async function openRuntime(live: boolean, maximum = 2) {
  if (!live) throw new MemoryError("LIVE_FLAG_REQUIRED");
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new MemoryError("KEY_MISSING_OR_INVALID");
  await mkdir("local-data/m0", { recursive: true });
  const lock = "local-data/m0/execution.lock";
  let handle;
  try {
    handle = await open(lock, "wx", 0o600);
  } catch {
    throw new MemoryError("ANOTHER_M0_PROCESS_OR_STALE_LOCK");
  }
  try {
    const budget = new Budget("local-data/m0/budget.json", maximum);
    await budget.open();
    const intelligence = new OpenAiMemory(key, budget);
    return {
      intelligence,
      budget,
      async close() {
        await handle.close();
        await unlink(lock);
      },
    };
  } catch (error) {
    await handle.close();
    await unlink(lock);
    throw error;
  }
}

export function reportError(error: unknown): void {
  if (error instanceof z.ZodError) {
    console.error("M0_SCHEMA_VALIDATION_FAILED");
    process.exitCode = 1;
    return;
  }
  if (
    error instanceof Error &&
    "code" in error &&
    typeof error.code === "string" &&
    ["EACCES", "EPERM", "ENOSPC", "EBUSY", "EMFILE", "ENOMEM"].includes(
      error.code,
    )
  ) {
    console.error(`M0_IO_${error.code}`);
    process.exitCode = 1;
    return;
  }
  console.error(
    error instanceof MemoryError ? error.message : "M0_INTERNAL_ERROR",
  );
  process.exitCode = 1;
}
