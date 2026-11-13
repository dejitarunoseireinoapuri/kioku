import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";

const require = createRequire(
    new URL("../.setup/brand-tools/assets.mjs", import.meta.url),
);
const fontkit = await import(pathToFileURL(require.resolve("fontkit")));
const sharp = (await import(pathToFileURL(require.resolve("sharp")))).default;
const root = new URL("../", import.meta.url);
const save = async (name, text) => {
    const target = new URL(name, root);
    await mkdir(new URL("./", target), { recursive: true });
    await writeFile(target, text);
};
const fontBytes = await readFile(
    new URL(".setup/kioku-brand/NotoSansJP.ttf", root),
);
const fontHash = createHash("sha256").update(fontBytes).digest("hex");
if (
    fontHash !==
    "c2f3b4d463500a2ddcd3849cded1fceeb9fd6d1c32e6cbecd568453ba50fc68f"
) {
    throw new Error(
        "The Noto Sans JP source does not match the approved brand asset.",
    );
}
const glyph = fontkit
    .create(fontBytes)
    .getVariation({ wght: 900 })
    .glyphForCodePoint(0x61b6);
const box = glyph.bbox;
const scale = 1000 / Math.max(box.maxX - box.minX, box.maxY - box.minY);
const dx = (1000 - (box.maxX - box.minX) * scale) / 2 - box.minX * scale;
const dy = (1000 - (box.maxY - box.minY) * scale) / 2 + box.maxY * scale;
const path = glyph.path
    .transform(scale, 0, 0, -scale, dx, dy)
    .mapPoints((x, y) => [Number(x.toFixed(3)), Number(y.toFixed(3))])
    .toSVG();
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><path fill="#FF674F" d="${path}"/></svg>\n`;
await save("docs/assets/branding/kioku-kanji.svg", svg);
const vector = (
    size,
    fill,
    group = "",
) => `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="${size}dp" android:height="${size}dp" android:viewportWidth="${group ? 108 : 1000}" android:viewportHeight="${group ? 108 : 1000}">
${group ? `<group android:translateX="30" android:translateY="30" android:scaleX="0.048" android:scaleY="0.048">` : ""}
    <path android:fillColor="${fill}" android:pathData="${path}" />
${group ? "</group>" : ""}
</vector>\n`;
await save(
    "shared/src/commonMain/composeResources/drawable/kioku_mark.xml",
    vector(112, "#FF674F"),
);
await save(
    "androidApp/src/main/res/drawable/ic_kioku.xml",
    vector(108, "#FF674F", true),
);
await save(
    "androidApp/src/main/res/drawable/ic_launcher_foreground.xml",
    vector(108, "#14171B", true),
);
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><rect width="1024" height="1024" fill="#FF674F"/><g transform="translate(256 256) scale(.512)"><path fill="#14171B" d="${path}"/></g></svg>`;
const iconDirectory = "iosApp/iosApp/Assets.xcassets/AppIcon.appiconset/";
const images = [];
const slots = [
    ["iphone", 20, [2, 3]],
    ["iphone", 29, [2, 3]],
    ["iphone", 40, [2, 3]],
    ["iphone", 60, [2, 3]],
    ["ipad", 20, [1, 2]],
    ["ipad", 29, [1, 2]],
    ["ipad", 40, [1, 2]],
    ["ipad", 76, [1, 2]],
    ["ipad", 83.5, [2]],
    ["ios-marketing", 1024, [1]],
];
for (const [idiom, size, scales] of slots) {
    for (const density of scales) {
        const filename = `icon-${idiom}-${size}@${density}x.png`;
        const pixels = Math.round(size * density);
        await save(
            iconDirectory + filename,
            await sharp(Buffer.from(iconSvg))
                .resize(pixels, pixels)
                .removeAlpha()
                .png()
                .toBuffer(),
        );
        images.push({
            idiom,
            size: `${size}x${size}`,
            scale: `${density}x`,
            filename,
        });
    }
}
await save(
    iconDirectory + "Contents.json",
    JSON.stringify({ images, info: { author: "xcode", version: 1 } }, null, 2) +
        "\n",
);
await save(
    "iosApp/iosApp/Assets.xcassets/Contents.json",
    JSON.stringify({ info: { author: "xcode", version: 1 } }, null, 2) + "\n",
);
await save(
    "licenses/noto-sans-jp-sources.json",
    JSON.stringify(
        {
            source: "https://raw.githubusercontent.com/google/fonts/d4eb04601981780781306966afb88e876652bab4/ofl/notosansjp/NotoSansJP%5Bwght%5D.ttf",
            sourceSha256: createHash("sha256").update(fontBytes).digest("hex"),
            codePoint: "U+61B6",
            weight: 900,
            glyphBounds: box,
            tools: { fontkit: "3.0.0", sharp: "0.35.5" },
            transform:
                "Uniform scale and Y-axis flip; outlined glyph, unchanged anatomy. SVG master and platform derivatives use identical paths.",
            master: "docs/assets/branding/kioku-kanji.svg",
        },
        null,
        2,
    ) + "\n",
);
console.log(
    "Outlined U+61B6 and generated Android/shared vectors and " +
        images.length +
        " opaque iOS app icons.",
);
