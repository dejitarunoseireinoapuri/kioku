import { mkdir, writeFile, rename, rm } from "node:fs/promises";
import { dirname, resolve, relative, isAbsolute } from "node:path";
import { randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { MemoryError } from "./domain.ts";

type Operations = {
  replace: (from: string, to: string) => Promise<void>;
  wait: (milliseconds: number) => Promise<unknown>;
};
const defaults: Operations = { replace: rename, wait: delay };
const sharingErrors = new Set(["EACCES", "EPERM", "EBUSY"]);

export function isSharingError(error: unknown): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    typeof error.code === "string" &&
    sharingErrors.has(error.code)
  );
}

/** Retry only replacing a local file, never a paid provider request. The previous file stays intact on failure. */
export async function atomicWrite(
  file: string,
  contents: string,
  operations: Operations = defaults,
): Promise<void> {
  const root = resolve("local-data/m0");
  const target = resolve(file);
  const rel = relative(root, target);
  if (!rel || rel.startsWith("..") || isAbsolute(rel))
    throw new MemoryError("FILE_OUTSIDE_M0");
  await mkdir(dirname(target), { recursive: true });
  const temporary = `${target}.${randomUUID()}.tmp`;
  await writeFile(temporary, contents, { flag: "wx", mode: 0o600 });
  try {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await operations.replace(temporary, target);
        return;
      } catch (error) {
        if (!isSharingError(error) || attempt === 2) throw error;
        await operations.wait(25 * (attempt + 1));
      }
    }
  } finally {
    try {
      await rm(temporary, { force: true });
    } catch (error) {
      if (!isSharingError(error)) throw error;
    }
  }
}
