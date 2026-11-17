import { documentSchema, limits, SourceError } from "./contracts.js";
import type {
  ExtractedDocument,
  SourceFormat,
  TextBlock,
} from "./contracts.js";

/** Every citation points at an exact extracted fragment, never an AI-written replacement. */
export function fragmentText(
  format: SourceFormat,
  blocks: TextBlock[],
  partial = false,
): ExtractedDocument {
  const chunks: ExtractedDocument["chunks"] = [];
  let total = 0;
  for (const block of blocks) {
    const text = block.text.replace(/\r\n?/gu, "\n").trim();
    total += text.length;
    if (total > limits.characters) throw new SourceError("too-large");
    for (let start = 0; start < text.length; ) {
      let end = Math.min(start + limits.chunk, text.length);
      if (end < text.length && /[\uD800-\uDBFF]/u.test(text[end - 1]!)) end--;
      chunks.push({
        index: chunks.length,
        text: text.slice(start, end),
        locator: block.locator,
      });
      if (chunks.length > limits.chunks) throw new SourceError("too-large");
      start = end;
    }
  }
  if (!chunks.length) throw new SourceError("no-text");
  return documentSchema.parse({
    format,
    extractorVersion: 1,
    coverage: partial ? "partial" : "text",
    chunks,
  });
}
