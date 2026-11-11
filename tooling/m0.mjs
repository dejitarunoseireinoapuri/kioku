import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, writeFile, access } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

// A pinned npm bootstrap also works with the Codex runtime, which ships Node without npm.
const root = resolve(import.meta.dirname, "..");
const directory = resolve(root, ".setup/m0-tooling");
const npm = resolve(directory, "package/bin/npm-cli.js");
const integrity =
    "7iKzNfy8lWYs3zq4oFPa8EXZz5xt9gQNKJZau3B1ErLBb6bF7sBJ00x09485DOvRT2l5Gerbl3VlZNT57MxJVA==";

function execute(command, args) {
    const result = spawnSync(command, args, { cwd: root, stdio: "inherit" });
    if (result.error || result.status !== 0) process.exit(result.status ?? 1);
}

const [command, ...args] = process.argv.slice(2);
if (command === "install") {
    try {
        await access(npm);
    } catch {
        await mkdir(directory, { recursive: true });
        const response = await fetch(
            "https://registry.npmjs.org/npm/-/npm-11.6.2.tgz",
            {
                signal: AbortSignal.timeout(30_000),
            },
        );
        if (!response.ok)
            throw new Error("Cannot download the pinned npm toolchain.");
        const archive = Buffer.from(await response.arrayBuffer());
        if (
            createHash("sha512").update(archive).digest("base64") !== integrity
        ) {
            throw new Error("npm archive integrity mismatch.");
        }
        const target = resolve(directory, "npm.tgz");
        await writeFile(target, archive);
        execute("tar", ["-xzf", target, "-C", directory]);
    }
    execute(process.execPath, [
        npm,
        existsSync(resolve(root, "package-lock.json")) ? "ci" : "install",
        "--ignore-scripts",
        "--no-audit",
        "--no-fund",
    ]);
} else if (command) {
    execute(process.execPath, [npm, "run", command, "--", ...args]);
} else {
    console.log(
        "Use: node tooling/m0.mjs install|check|test|format:check|m0|m0:eval [arguments]",
    );
}
