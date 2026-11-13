import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const npm = resolve(root, ".setup/m0-tooling/package/bin/npm-cli.js");
const [command, ...args] = process.argv.slice(2);
if (!existsSync(npm)) {
    throw new Error(
        "Run node tooling/m0.mjs install to prepare the verified npm toolchain.",
    );
}
if (
    ![
        "install",
        "build",
        "test",
        "test:emulator",
        "format",
        "format:check",
        "audit",
    ].includes(command)
) {
    throw new Error(
        "Use backend.mjs install|build|test|test:emulator|format|format:check|audit",
    );
}
const parameters =
    command === "install"
        ? [
              existsSync(resolve(root, "backend/package-lock.json"))
                  ? "ci"
                  : "install",
              "--ignore-scripts",
              "--no-audit",
              "--no-fund",
          ]
        : command === "audit"
          ? ["audit", ...args]
          : ["run", command, "--", ...args];
const result = spawnSync(process.execPath, [npm, ...parameters], {
    cwd: resolve(root, "backend"),
    stdio: "inherit",
});
if (result.error) throw new Error("Backend toolchain could not start.");
process.exitCode = result.status ?? 1;
