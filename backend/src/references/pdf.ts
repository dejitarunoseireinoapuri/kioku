import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { limits, SourceError } from "./contracts.js";
import { fragmentText } from "./fragment.js";
import type { TextBlock } from "./contracts.js";

export async function extractPdf(bytes: Uint8Array) {
  if (new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-")
    throw new SourceError("invalid");
  const task = getDocument({
    data: bytes,
    useSystemFonts: false,
    disableFontFace: true,
    useWorkerFetch: false,
    useWasm: false,
    stopAtErrors: true,
    verbosity: 0,
  });
  try {
    const pdf = await task.promise;
    if (pdf.numPages > limits.pages) throw new SourceError("too-large");
    const blocks: TextBlock[] = [];
    let partial = false,
      total = 0;
    for (let number = 1; number <= pdf.numPages; number++) {
      const page = await pdf.getPage(number);
      const content = await page.getTextContent();
      const text = content.items
        .map((item) =>
          "str" in item ? item.str + (item.hasEOL ? "\n" : " ") : "",
        )
        .join("")
        .trim();
      total += text.length;
      if (total > limits.characters) throw new SourceError("too-large");
      if (!text) partial = true;
      blocks.push({ text, locator: { kind: "page", number } });
      page.cleanup();
    }
    return fragmentText("pdf", blocks, partial);
  } finally {
    await task.destroy();
  }
}
