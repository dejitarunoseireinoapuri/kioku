import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

if (!process.env.KIOKU_TEST_NODE)
    throw new Error("Use the documented local emulator runner.");
const liveCapture = process.argv.slice(2).join(" ") === "--live-capture";
const result = spawnSync(
    process.env.KIOKU_TEST_NODE,
    liveCapture
        ? [resolve(import.meta.dirname, "k2-live-smoke.mjs"), "--live"]
        : ["--test", "--test-concurrency=1", "lib/test/emulator/*.test.js"],
    {
        cwd: resolve(import.meta.dirname, liveCapture ? ".." : "../backend"),
        stdio: "inherit",
    },
);
if (result.error) throw new Error("Emulator tests could not start.");
process.exitCode = result.status ?? 1;
