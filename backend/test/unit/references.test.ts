import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { strToU8, zipSync } from "fflate";
import {
  decodeSource,
  documentSchema,
  limits,
  SourceError,
} from "../../src/references/contracts.js";
import { extractIsolated } from "../../src/references/isolated-extractor.js";
import { retrieveReferences } from "../../src/references/retrieve.js";
import { publicAddress, webTarget } from "../../src/references/web-target.js";
import { syntheticDocx, syntheticPdf } from "./reference-fixtures.js";

const issue = (expected: string) => (error: unknown) =>
  error instanceof SourceError && error.issue === expected;

test("isolated UTF-8 extraction retains accents, lines and exact citations without AI", async () => {
  const document = await extractIsolated(
    "text",
    strToU8("Nara visitará el planetario.\nLira comprará un cuaderno violeta."),
  );
  assert.equal(document.coverage, "text");
  assert.deepEqual(
    document.chunks.map((chunk) => chunk.locator),
    [
      { kind: "line", number: 1 },
      { kind: "line", number: 2 },
    ],
  );
  assert.match(document.chunks[1]!.text, /violeta/u);
});

test("PDF text extraction retains the real page of both fictional segments", async () => {
  const document = await extractIsolated("pdf", syntheticPdf());
  assert.equal(document.chunks.length, 2);
  assert.equal(document.chunks[1]!.locator.number, 2);
  assert.match(document.chunks[1]!.text, /violet notebook/u);
});

test("DOCX body paragraphs retain Unicode without fabricated page numbers", async () => {
  const document = await extractIsolated("docx", syntheticDocx());
  assert.equal(document.chunks[0]!.locator.kind, "paragraph");
  assert.match(document.chunks[0]!.text, /visitará/u);
  assert.match(document.chunks[1]!.text, /violeta/u);
});

test("malformed, mislabeled, blank and oversized inputs never become ready documents", async () => {
  await assert.rejects(
    extractIsolated("text", new Uint8Array([0xff])),
    issue("invalid"),
  );
  await assert.rejects(
    extractIsolated("text", syntheticPdf()),
    issue("invalid"),
  );
  await assert.rejects(
    extractIsolated("pdf", strToU8("Not a PDF")),
    issue("invalid"),
  );
  await assert.rejects(
    extractIsolated("text", strToU8("  ")),
    issue("no-text"),
  );
  await assert.rejects(
    extractIsolated("text", strToU8("a".repeat(limits.characters + 1))),
    issue("too-large"),
  );
  await assert.rejects(
    extractIsolated("text", new Uint8Array(limits.bytes + 1)),
    issue("too-large"),
  );
});

test("DOCX entity declarations and oversized compression are rejected", async () => {
  const hostile = zipSync({
    "word/document.xml": strToU8(
      '<!DOCTYPE doc [<!ENTITY x SYSTEM "file:///private">]><doc>&x;</doc>',
    ),
  });
  await assert.rejects(extractIsolated("docx", hostile), issue("unsupported"));
  const expanded = zipSync({
    "word/document.xml": strToU8("a".repeat(2_000_000)),
  });
  await assert.rejects(extractIsolated("docx", expanded), issue("too-large"));
});

test("HTML extraction returns text and ignores scripts, navigation and hidden content", async () => {
  const document = await extractIsolated(
    "html",
    strToU8(
      '<html><head><title>Excluded</title></head><body><nav>Excluded navigation</nav><main><h1>Plan ficticio</h1><p>Lira elige el cuaderno violeta.</p><script>fetch("https://example.com")</script><p hidden>Excluded secret</p></main></body></html>',
    ),
  );
  assert.equal(
    document.chunks.some((chunk) => /Excluded|fetch/u.test(chunk.text)),
    false,
  );
  assert.match(document.chunks.at(-1)!.text, /violeta/u);
  await assert.rejects(
    extractIsolated(
      "html",
      strToU8("<div>".repeat(140) + "Ficticio" + "</div>".repeat(140)),
    ),
    issue("too-large"),
  );
});

test("cancellation and strict base64 admission do not start unbounded work", async () => {
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    extractIsolated("text", strToU8("Ficticio"), controller.signal),
    issue("interrupted"),
  );
  assert.throws(
    () =>
      decodeSource({
        apiVersion: 1,
        requestId: randomUUID(),
        title: "Ficticio",
        format: "text",
        bytes: "invalid!",
      }),
    issue("invalid"),
  );
});

test("extractive retrieval preserves provenance, versions and partial-coverage scope", async () => {
  const document = await extractIsolated(
    "markdown",
    strToU8("El manual de Lira recomienda un cuaderno violeta."),
  );
  const source = {
    id: randomUUID(),
    revision: randomUUID(),
    title: "Manual ficticio",
    generation: randomUUID(),
    importedAt: 1,
    checksum: "fictitious",
    document,
  };
  const citations = retrieveReferences([source], "¿Qué cuaderno recomienda?");
  assert.equal(citations[0]?.sourceId, source.id);
  assert.equal(citations[0]?.revision, source.revision);
  assert.equal(citations[0]?.text, document.chunks[0]!.text);
  source.document = documentSchema.parse({ ...document, coverage: "partial" });
  assert.equal(retrieveReferences([source], "cuaderno").length, 0);
  assert.equal(retrieveReferences([source], "cuaderno", source.id).length, 1);
  assert.equal(retrieveReferences([], "cuaderno").length, 0);
});

test("web admission rejects private addresses, credentials, unsupported origins and signed URLs", () => {
  for (const address of [
    "127.0.0.1",
    "10.0.0.1",
    "169.254.169.254",
    "::1",
    "::ffff:127.0.0.1",
    "fc00::1",
  ])
    assert.equal(publicAddress(address), false);
  for (const url of [
    "http://example.com",
    "https://127.0.0.1",
    "https://[::ffff:127.0.0.1]",
    "https://secret@example.com",
    "https://metadata.google.internal",
    "https://example.com:8080",
    "https://example.com?access_token=fictitious",
  ])
    assert.throws(() => webTarget(url), issue("denied"));
  for (const url of [
    "https://drive.google.com/file/fictitious",
    "https://www.youtube.com/watch?v=fictitious",
    "https://www.instagram.com/fictitious",
  ])
    assert.throws(() => webTarget(url), issue("unsupported"));
  assert.equal(
    webTarget("https://example.com/article#section").href,
    "https://example.com/article",
  );
});
