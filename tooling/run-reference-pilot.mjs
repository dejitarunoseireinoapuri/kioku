import { spawn } from "node:child_process";
import { resolve } from "node:path";

if (!process.env.KIOKU_TEST_NODE) throw new Error("Use reference-pilot.ps1.");
const child = spawn(process.env.KIOKU_TEST_NODE, [resolve(import.meta.dirname, process.env.KIOKU_REFERENCE_VERIFY === "1" ? "../backend/lib/test/pilot/verify.js" : "../backend/lib/test/pilot/server.js")], { stdio: "inherit" });
child.on("error", () => { process.stderr.write("Reference pilot could not start.\n"); process.exitCode = 1; });
child.on("exit", (code) => { process.exitCode = code ?? 1; });
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
