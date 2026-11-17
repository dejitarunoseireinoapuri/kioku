import ipaddr from "ipaddr.js";
import { SourceError } from "./contracts.js";

export function publicAddress(address: string): boolean {
  if (!ipaddr.isValid(address)) return false;
  const ip = ipaddr.process(address);
  return ip.range() === "unicast";
}

/** Admission only: DNS must also be validated and pinned by the future network adapter. */
export function webTarget(input: string): URL {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new SourceError("invalid");
  }
  const host = url.hostname.replace(/^\[|\]$/gu, "");
  if (
    input.length > 4096 ||
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    (url.port && url.port !== "443") ||
    !host.includes(".") ||
    /(?:^|\.)(?:localhost|local|internal|invalid|test)$/iu.test(host) ||
    (ipaddr.isValid(host) && !publicAddress(host))
  )
    throw new SourceError("denied");
  if (
    /(?:^|\.)(?:youtube\.com|youtu\.be|tiktok\.com|instagram\.com)$/iu.test(
      host,
    )
  )
    throw new SourceError("unsupported");
  if (/^(?:drive|docs)\.google\.com$/iu.test(host))
    throw new SourceError("unsupported");
  for (const key of url.searchParams.keys())
    if (/token|signature|credential|password|secret|authorization/iu.test(key))
      throw new SourceError("denied");
  url.hash = "";
  return url;
}
