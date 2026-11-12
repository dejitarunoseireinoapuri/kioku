import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdir,
  mkdtemp,
  readFile,
  rename,
  writeFile,
  rm,
} from "node:fs/promises";
import { resolve, relative } from "node:path";
import { atomicWrite } from "../src/file-store.ts";

async function fixture() {
  await mkdir("local-data/m0/tests", { recursive: true });
  const directory = await mkdtemp("local-data/m0/tests/files-");
  return {
    file: `${directory}/counter.json`,
    async close() {
      const target = resolve(directory);
      assert.ok(
        !relative(resolve("local-data/m0/tests"), target).startsWith(".."),
      );
      await rm(target, { recursive: true, force: true });
    },
  };
}

test("transient sharing violations retry only local replacement with a fixed bound", async () => {
  const f = await fixture();
  try {
    await writeFile(f.file, "old");
    let calls = 0;
    const waits: number[] = [];
    await atomicWrite(f.file, "new", {
      replace: async (from, to) => {
        calls++;
        if (calls < 3)
          throw Object.assign(new Error("synthetic lock"), { code: "EBUSY" });
        await rename(from, to);
      },
      wait: async (ms) => {
        waits.push(ms);
      },
    });
    assert.equal(calls, 3);
    assert.deepEqual(waits, [25, 50]);
    assert.equal(await readFile(f.file, "utf8"), "new");
  } finally {
    await f.close();
  }
});

test("permanent failure preserves the previous counter and never retries an unrelated error", async () => {
  const f = await fixture();
  try {
    await writeFile(f.file, "old");
    let calls = 0;
    await assert.rejects(
      atomicWrite(f.file, "new", {
        replace: async () => {
          calls++;
          throw Object.assign(new Error("synthetic disk failure"), {
            code: "ENOSPC",
          });
        },
        wait: async () => {
          throw new Error("must not wait");
        },
      }),
    );
    assert.equal(calls, 1);
    assert.equal(await readFile(f.file, "utf8"), "old");
    await assert.rejects(
      atomicWrite("../outside.json", "new"),
      /FILE_OUTSIDE_M0/,
    );
  } finally {
    await f.close();
  }
});
