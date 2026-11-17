import { lookup } from "node:dns/promises";
import { request } from "node:https";
import { SourceError } from "./contracts.js";
import { publicAddress, webTarget } from "./web-target.js";
import type { SourceFormat } from "./contracts.js";

type Address = { address: string; family: number };
type Page = { status: number; location?: string; type: string; bytes: Buffer };
export interface WebTransport {
  resolve(host: string): Promise<Address[]>;
  get(url: URL, address: Address, signal: AbortSignal): Promise<Page>;
}
const MAX_BYTES = 6 * 1024 * 1024;
const nativeTransport: WebTransport = {
  resolve: (host) => lookup(host, { all: true }),
  get: (url, address, signal) =>
    new Promise((resolve, reject) => {
      const req = request(
        url,
        {
          agent: false,
          signal,
          maxHeaderSize: 8192,
          family: address.family,
          headers: {
            Accept: "text/html,text/plain,application/pdf",
            "Accept-Encoding": "identity",
            "User-Agent": "Kioku/1.0",
          },
          // Pin this socket to the validated answer; TLS still verifies the original hostname.
          lookup: (_host, _options, callback) =>
            callback(null, address.address, address.family),
        },
        (res) => {
          const status = res.statusCode ?? 0;
          if ([301, 302, 303, 307, 308].includes(status)) {
            res.destroy();
            resolve({
              status,
              ...(res.headers.location
                ? { location: res.headers.location }
                : {}),
              type: "",
              bytes: Buffer.alloc(0),
            });
            return;
          }
          if (
            status !== 200 ||
            (res.headers["content-encoding"] &&
              res.headers["content-encoding"] !== "identity")
          ) {
            res.destroy();
            reject(new SourceError("unsupported"));
            return;
          }
          const chunks: Buffer[] = [];
          let size = 0;
          res.on("data", (chunk: Buffer) => {
            size += chunk.length;
            if (size > MAX_BYTES) {
              res.destroy(new SourceError("too-large"));
              return;
            }
            chunks.push(chunk);
          });
          res.once("error", reject);
          res.once("end", () =>
            resolve({
              status,
              type: res.headers["content-type"] ?? "",
              bytes: Buffer.concat(chunks),
            }),
          );
        },
      );
      req.once("error", reject);
      req.end();
    }),
};

/** Explicit shares only. Never follows links found inside a document or model output. */
export async function downloadReference(
  input: string,
  transport = nativeTransport,
) {
  const signal = AbortSignal.timeout(25_000);
  let url = webTarget(input);
  try {
    for (let redirect = 0; redirect <= 3; redirect++) {
      signal.throwIfAborted();
      const addresses = await Promise.race([
        transport.resolve(url.hostname),
        new Promise<never>((_resolve, reject) => {
          signal.addEventListener(
            "abort",
            () => reject(new SourceError("interrupted")),
            { once: true },
          );
        }),
      ]);
      if (
        !addresses.length ||
        addresses.some((address) => !publicAddress(address.address))
      )
        throw new SourceError("denied");
      const page = await transport.get(url, addresses[0]!, signal);
      if (page.location) {
        url = webTarget(new URL(page.location, url).href);
        continue;
      }
      if (page.status !== 200) throw new SourceError("unsupported");
      if (page.bytes.length > MAX_BYTES) throw new SourceError("too-large");
      const mime = page.type.split(";")[0]?.trim().toLowerCase();
      const format: SourceFormat | undefined =
        mime === "application/pdf"
          ? "pdf"
          : mime === "text/plain"
            ? "text"
            : mime === "text/html"
              ? "html"
              : undefined;
      if (!format) throw new SourceError("unsupported");
      return { url: url.href, format, bytes: page.bytes };
    }
    throw new SourceError("invalid");
  } catch (error) {
    if (error instanceof SourceError) throw error;
    throw new SourceError("unavailable");
  }
}
