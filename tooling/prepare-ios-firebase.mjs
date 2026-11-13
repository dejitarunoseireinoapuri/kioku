import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { copyFile, mkdir, unlink } from "node:fs/promises";
import { basename, resolve, sep } from "node:path";
import { validateNativeFirebase } from "./native-firebase-public.mjs";

async function main() {
    const root = resolve(import.meta.dirname, "..");
    const [sourceArgument, productArgument] = process.argv.slice(2);
    if (!sourceArgument || !productArgument || !process.env.TARGET_BUILD_DIR)
        throw new Error();
    const source = resolve(sourceArgument);
    const product = resolve(productArgument);
    const build = resolve(process.env.TARGET_BUILD_DIR);
    if (
        source !== resolve(root, "iosApp/iosApp/GoogleService-Info.plist") ||
        !product.startsWith(build + sep) ||
        basename(product) !== "Kioku.app"
    )
        throw new Error();
    const destination = resolve(product, "GoogleService-Info.plist");
    if (!existsSync(source)) {
        if (existsSync(destination)) await unlink(destination);
        return;
    }
    const json = execFileSync(
        "/usr/bin/plutil",
        ["-convert", "json", "-o", "-", source],
        {
            encoding: "utf8",
            stdio: ["ignore", "pipe", "pipe"],
            timeout: 10_000,
        },
    );
    validateNativeFirebase(JSON.parse(json));
    await mkdir(product, { recursive: true });
    await copyFile(source, destination);
}

main().catch(() => {
    console.error("Native Firebase configuration rejected; contents omitted.");
    process.exitCode = 1;
});
