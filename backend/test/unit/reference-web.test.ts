import assert from "node:assert/strict";
import { test } from "node:test";
import { downloadReference } from "../../src/references/web-download.js";
import type { WebTransport } from "../../src/references/web-download.js";
import { SourceError } from "../../src/references/contracts.js";

const publicIp = { address: "93.184.216.34", family: 4 };
const html = {
  status: 200,
  type: "text/html; charset=utf-8",
  bytes: Buffer.from("<p>Texto ficticio: cuaderno violeta.</p>"),
};
const issue = (expected: string) => (error: unknown) =>
  error instanceof SourceError && error.issue === expected;

test("explicit HTTPS download validates DNS and passes only the pinned address to transport", async () => {
  const seen: string[] = [];
  const transport: WebTransport = {
    resolve: async (host) => {
      seen.push(host);
      return [publicIp];
    },
    get: async (url, address, signal) => {
      assert.deepEqual(address, publicIp);
      assert.equal(signal.aborted, false);
      seen.push(url.href);
      return html;
    },
  };
  const result = await downloadReference(
    "https://example.com/ficcion#decorative",
    transport,
  );
  assert.equal(result.format, "html");
  assert.deepEqual(seen, ["example.com", "https://example.com/ficcion"]);
});

test("private or mixed DNS answers stop before connecting", async () => {
  for (const address of [
    "127.0.0.1",
    "169.254.169.254",
    "10.0.0.1",
    "::1",
    "::ffff:192.168.1.3",
  ]) {
    await assert.rejects(
      downloadReference("https://example.com/ficcion", {
        resolve: async () => [publicIp, { address, family: 4 }],
        get: async () => {
          throw new Error("Must not connect");
        },
      }),
      issue("denied"),
    );
  }
});

test("every redirect is revalidated and internal, credential and social redirects are rejected", async () => {
  for (const location of [
    "https://127.0.0.1/",
    "https://example.com/?token=fictional",
    "https://youtube.com/fictional",
  ]) {
    let connections = 0;
    await assert.rejects(
      downloadReference("https://example.com/ficcion", {
        resolve: async () => [publicIp],
        get: async () => {
          connections++;
          return { ...html, status: 302, location };
        },
      }),
      (error) => error instanceof SourceError,
    );
    assert.equal(connections, 1);
  }
});

test("redirect loops, oversized content and unsupported MIME do not become sources", async () => {
  const transport: WebTransport = {
    resolve: async () => [publicIp],
    get: async () => ({ ...html, status: 302, location: "/loop" }),
  };
  await assert.rejects(
    downloadReference("https://example.com/ficcion", transport),
    issue("invalid"),
  );
  await assert.rejects(
    downloadReference("https://example.com/ficcion", {
      ...transport,
      get: async () => ({ ...html, bytes: Buffer.alloc(6 * 1024 * 1024 + 1) }),
    }),
    issue("too-large"),
  );
  await assert.rejects(
    downloadReference("https://example.com/ficcion", {
      ...transport,
      get: async () => ({ ...html, type: "video/mp4" }),
    }),
    issue("unsupported"),
  );
});
