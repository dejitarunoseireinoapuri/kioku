import { unzipSync } from "fflate";
import { XMLParser, XMLValidator } from "fast-xml-parser";
import { SourceError } from "./contracts.js";
import { fragmentText } from "./fragment.js";
import type { TextBlock } from "./contracts.js";

const WORD = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const STRICT_WORD = "http://purl.oclc.org/ooxml/wordprocessingml/main";
const XML_LIMIT = 4 * 1024 * 1024;
const record = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

export function extractDocx(bytes: Uint8Array) {
  let entries = 0,
    declared = 0,
    partial = false;
  const files = unzipSync(bytes, {
    filter(entry) {
      entries++;
      declared += entry.originalSize;
      if (
        entries > 2000 ||
        declared > 32 * 1024 * 1024 ||
        entry.originalSize > XML_LIMIT ||
        entry.originalSize > Math.max(entry.size * 100, 100_000)
      )
        throw new SourceError("too-large");
      if (/^word\/(?:header|footer|footnotes|endnotes)/u.test(entry.name))
        partial = true;
      if (/vbaProject|\.\.\/|^\//iu.test(entry.name))
        throw new SourceError("unsupported");
      return entry.name === "word/document.xml";
    },
  });
  const main = files["word/document.xml"];
  if (!main || main.length > XML_LIMIT) throw new SourceError("invalid");
  const xml = new TextDecoder("utf-8", { fatal: true }).decode(main);
  if (/<!DOCTYPE|<!ENTITY/iu.test(xml)) throw new SourceError("unsupported");
  if (XMLValidator.validate(xml) !== true) throw new SourceError("invalid");
  // The parser's untyped output crosses this single boundary as unknown, then is checked below.
  const tree: unknown = new XMLParser({
    preserveOrder: true,
    ignoreAttributes: false,
    trimValues: false,
    parseTagValue: false,
  }).parse(xml);
  const root = Array.isArray(tree)
    ? tree
        .map(record)
        .find((node) =>
          Object.keys(node).some((key) => key.endsWith(":document")),
        )
    : undefined;
  if (!root) throw new SourceError("invalid");
  const name = Object.keys(root).find((key) => key.endsWith(":document"))!;
  const prefix = name.split(":")[0]!;
  const namespace = record(root[":@"])["@_xmlns:" + prefix];
  if (namespace !== WORD && namespace !== STRICT_WORD)
    throw new SourceError("invalid");
  const blocks: TextBlock[] = [];
  let text = "";
  const visit = (value: unknown, reading: boolean, depth: number) => {
    if (depth > 128) throw new SourceError("too-large");
    if (Array.isArray(value)) {
      for (const child of value) visit(child, reading, depth + 1);
      return;
    }
    for (const [key, child] of Object.entries(record(value))) {
      if (key === "#text" && reading && typeof child === "string")
        text += child;
      if (!key.startsWith(prefix + ":")) continue;
      const local = key.slice(prefix.length + 1);
      if (local === "instrText") continue;
      if (local === "drawing" || local === "object") partial = true;
      if (local === "tab" || local === "br") text += " ";
      visit(child, local === "t", depth + 1);
      if (local === "p") {
        blocks.push({
          text,
          locator: { kind: "paragraph", number: blocks.length + 1 },
        });
        text = "";
      }
    }
  };
  visit(root[name], false, 0);
  return fragmentText("docx", blocks, partial);
}
