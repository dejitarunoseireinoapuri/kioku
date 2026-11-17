import { formatSchema, limits, SourceError } from "./contracts.js";
import { fragmentText } from "./fragment.js";
import { extractDocx } from "./docx.js";
import { extractHtml } from "./html.js";

/** Called only inside the bounded extraction worker. No provider, credentials or URL input. */
export async function extractSource(format: unknown, bytes: Uint8Array) {
  const parsed = formatSchema.safeParse(format);
  if (!parsed.success) throw new SourceError("unsupported");
  if (!bytes.length || bytes.length > limits.bytes)
    throw new SourceError("too-large");
  if (parsed.data === "pdf")
    return (await import("./pdf.js")).extractPdf(bytes);
  if (parsed.data === "docx") return extractDocx(bytes);
  const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  if (text.includes("\0")) throw new SourceError("invalid");
  if (parsed.data === "html") return extractHtml(text);
  if (text.startsWith("%PDF-") || text.startsWith("PK\u0003\u0004"))
    throw new SourceError("invalid");
  return fragmentText(
    parsed.data,
    text.split(/\r?\n/u).map((line, index) => ({
      text: line,
      locator: { kind: "line", number: index + 1 },
    })),
  );
}
