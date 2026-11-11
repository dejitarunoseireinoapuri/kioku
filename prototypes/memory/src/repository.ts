import { randomUUID } from "node:crypto";
import {
  mkdir,
  readFile,
  rename,
  writeFile,
  lstat,
  rm,
} from "node:fs/promises";
import { dirname, resolve, relative, isAbsolute } from "node:path";
import { MemoryError, snapshotSchema } from "./domain.ts";
import type { MemoryRepository, Snapshot } from "./domain.ts";

// CLI-only synthetic storage. No HTTP server, shared file writers or mobile offline cache.
export class JsonMemoryRepository implements MemoryRepository {
  readonly file: string;

  constructor(directory: string, name = "memory.json") {
    const root = resolve("local-data/m0");
    const folder = resolve(directory);
    const rel = relative(root, folder);
    if (
      rel.startsWith("..") ||
      isAbsolute(rel) ||
      !/^[a-z0-9-]+\.json$/.test(name)
    ) {
      throw new MemoryError("STORE_OUTSIDE_M0");
    }
    this.file = resolve(folder, name);
  }

  async load(): Promise<Snapshot> {
    try {
      await this.rejectLinks();
      return snapshotSchema.parse(
        JSON.parse(await readFile(this.file, "utf8")),
      );
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        return { version: 1, sources: [], memories: [] };
      }
      throw new MemoryError("STORE_READ_FAILED");
    }
  }

  async save(snapshot: Snapshot): Promise<void> {
    snapshotSchema.parse(snapshot);
    await mkdir(dirname(this.file), { recursive: true });
    await this.rejectLinks();
    const temporary = `${this.file}.${randomUUID()}.tmp`;
    try {
      await writeFile(temporary, JSON.stringify(snapshot), {
        mode: 0o600,
        flag: "wx",
      });
      await rename(temporary, this.file);
    } finally {
      await rm(temporary, { force: true });
    }
  }

  private async rejectLinks(): Promise<void> {
    let target = this.file;
    const stop = resolve("local-data");
    while (target !== stop) {
      try {
        if ((await lstat(target)).isSymbolicLink())
          throw new MemoryError("STORE_LINK");
      } catch (error) {
        if (
          !(
            error instanceof Error &&
            "code" in error &&
            error.code === "ENOENT"
          )
        )
          throw error;
      }
      target = dirname(target);
    }
    try {
      if ((await lstat(stop)).isSymbolicLink())
        throw new MemoryError("STORE_LINK");
    } catch (error) {
      if (
        !(error instanceof Error && "code" in error && error.code === "ENOENT")
      )
        throw error;
    }
  }
}
