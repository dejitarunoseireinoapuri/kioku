import { readdir, readFile } from "node:fs/promises";

async function sourceFiles(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    const nested = await Promise.all(
        entries.map((entry) => {
            const path = `${directory}/${entry.name}`;
            return entry.isDirectory()
                ? sourceFiles(path)
                : path.endsWith(".kt")
                  ? [path]
                  : [];
        }),
    );
    return nested.flat();
}

const files = (
    await Promise.all([
        sourceFiles("shared/src"),
        sourceFiles("androidApp/src"),
    ])
).flat();
const errors = [];
for (const file of files) {
    const source = await readFile(file, "utf8");
    if (source.split("\n").length > 501)
        errors.push(`${file}: exceeds 500 source lines`);
    const imports = [...source.matchAll(/^import (.+)$/gm)].map(
        (match) => match[1],
    );
    if (file.includes("/domain/")) {
        for (const item of imports) {
            if (
                !/^(kotlin\.|kotlinx\.coroutines\.|io\.github\.dejitarunoseireinoapuri\.kioku\.domain\.)/u.test(
                    item,
                )
            ) {
                errors.push(`${file}: domain depends on ${item}`);
            }
        }
    }
    if (
        file.includes("/data/") &&
        imports.some((item) =>
            /\.kioku\.(feature|design|navigation)\./u.test(item),
        )
    ) {
        errors.push(`${file}: data depends on presentation`);
    }
    if (
        file.endsWith("ViewModel.kt") &&
        imports.some((item) =>
            /\.kioku\.data\.|firebase|okhttp|ktor|android\.media/u.test(item),
        )
    ) {
        errors.push(`${file}: ViewModel depends on infrastructure`);
    }
    if (
        file.includes("/feature/") &&
        !file.endsWith("ViewModel.kt") &&
        imports.some((item) =>
            /\.kioku\.data\.|firebase|\.SourceRepository$/u.test(item),
        )
    ) {
        errors.push(`${file}: UI depends on persistence`);
    }
    if (imports.some((item) => item.startsWith("com.google.firebase.admin")))
        errors.push(`${file}: Admin SDK in mobile`);
}
if (errors.length) {
    console.error(errors.join("\n"));
    process.exitCode = 1;
} else {
    console.log(
        `Mobile architecture OK: ${files.length} Kotlin files; domain, data, UI and ViewModel boundaries checked.`,
    );
}
