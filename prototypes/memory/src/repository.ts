import { mkdir, readFile, lstat } from "node:fs/promises";
import { dirname, resolve, relative, isAbsolute } from "node:path";
import { MemoryError, snapshotSchema, snapshotVersion } from "./domain.ts";
import type { MemoryRepository, Snapshot } from "./domain.ts";
import { atomicWrite } from "./file-store.ts";

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
      const value: unknown = JSON.parse(await readFile(this.file, "utf8"));
      if (
        typeof value === "object" &&
        value !== null &&
        "version" in value &&
        (value.version === 1 || value.version === 2 || value.version === 3)
      ) {
        throw new MemoryError("STORE_VERSION_UNSUPPORTED");
      }
      return this.validate(snapshotSchema.parse(value));
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        return { version: snapshotVersion, sources: [], memories: [] };
      }
      if (
        error instanceof MemoryError &&
        error.message === "STORE_VERSION_UNSUPPORTED"
      )
        throw error;
      throw new MemoryError("STORE_READ_FAILED");
    }
  }

  async save(snapshot: Snapshot): Promise<void> {
    this.validate(snapshotSchema.parse(snapshot));
    await mkdir(dirname(this.file), { recursive: true });
    await this.rejectLinks();
    await atomicWrite(this.file, JSON.stringify(snapshot));
  }

  private validate(snapshot: Snapshot): Snapshot {
    if (
      snapshot.memories.some(
        (item) =>
          item.provenance === "quoted" &&
          (item.eventStatus !== "unspecified" ||
            item.time.precision !== "unknown" ||
            item.time.value !== null ||
            item.time.end !== null ||
            item.time.quote !== null),
      )
    )
      throw new MemoryError("STORE_QUOTED_EVENT_INVALID");
    return snapshot;
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
