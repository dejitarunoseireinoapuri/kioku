import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";

export async function fingerprint(data: unknown) {
  const hash = createHash("sha256").update(JSON.stringify(data));
  for (const folder of ["ai", "src", "evaluation", "fixtures"]) {
    for (const file of (await readdir(`prototypes/memory-core/${folder}`))
      .filter((f) => f.endsWith(".ts"))
      .sort())
      hash
        .update(`${folder}/${file}`)
        .update(await readFile(`prototypes/memory-core/${folder}/${file}`));
  }
  return hash.digest("hex");
}
