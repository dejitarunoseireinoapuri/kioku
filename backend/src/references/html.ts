import { parse } from "parse5";
import type { DefaultTreeAdapterMap } from "parse5";
import { fragmentText } from "./fragment.js";
import type { TextBlock } from "./contracts.js";
import { SourceError } from "./contracts.js";

type Node = DefaultTreeAdapterMap["node"];
const skipped = new Set([
  "head",
  "script",
  "style",
  "nav",
  "footer",
  "form",
  "iframe",
  "svg",
  "noscript",
  "template",
]);
const separated = new Set([
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "li",
  "pre",
  "blockquote",
  "tr",
  "section",
  "article",
  "main",
  "div",
  "br",
]);

export function extractHtml(html: string) {
  const root = parse(html);
  const blocks: TextBlock[] = [];
  let current = "";
  const flush = () => {
    if (current.trim())
      blocks.push({
        text: current.trim(),
        locator: { kind: "section", number: blocks.length + 1 },
      });
    current = "";
  };
  const visit = (node: Node, depth: number) => {
    if (depth > 128) throw new SourceError("too-large");
    if ("tagName" in node) {
      if (
        skipped.has(node.tagName) ||
        node.attrs.some(
          (a) =>
            a.name === "hidden" ||
            (a.name === "aria-hidden" && a.value === "true"),
        )
      )
        return;
      if (separated.has(node.tagName)) flush();
    }
    if ("value" in node && node.nodeName === "#text")
      current += node.value.replace(/\s+/gu, " ");
    if ("childNodes" in node)
      for (const child of node.childNodes) visit(child, depth + 1);
    if ("tagName" in node && separated.has(node.tagName)) flush();
  };
  visit(root, 0);
  flush();
  return fragmentText("html", blocks);
}
