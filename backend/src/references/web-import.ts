import { createHash } from "node:crypto";
import { z } from "zod";
import { downloadReference } from "./web-download.js";
import { extractIsolated } from "./isolated-extractor.js";
import type { ReferenceStore } from "./store.js";
import { SourceError } from "./contracts.js";
import { webTarget } from "./web-target.js";

const inputSchema = z.strictObject({
  requestId: z.uuid(),
  url: z.string().max(4096),
});
export async function importWebReference(
  store: ReferenceStore,
  actor: { uid: string; generation: string },
  raw: unknown,
  reauthorize: () => Promise<void>,
  download: typeof downloadReference = downloadReference,
) {
  const input = inputSchema.parse(raw);
  const requestedUrl = webTarget(input.url).href;
  const epoch = await store.epoch(actor.uid, actor.generation);
  try {
    const previous = await store.operation(
      actor.uid,
      actor.generation,
      input.requestId,
    );
    if (previous.state === "ready") {
      if (previous.source.origin?.requestedUrl !== requestedUrl)
        throw new SourceError("conflict");
      return previous;
    }
  } catch (error) {
    if (!(error instanceof SourceError && error.issue === "invalid"))
      throw error;
  }
  const page = await download(requestedUrl);
  await store.assertCurrent(actor.uid, actor.generation, epoch);
  const checksum = createHash("sha256")
    .update(requestedUrl)
    .update("\0")
    .update(page.url)
    .update("\0")
    .update(page.bytes)
    .digest("hex");
  const admission = await store.begin(actor.uid, actor.generation, {
    requestId: input.requestId,
    title: page.url.slice(0, 200),
    format: page.format,
    checksum,
  });
  if (admission.state === "ready") return admission;
  const lease =
    admission.state === "started"
      ? admission.lease
      : await store.operation(actor.uid, actor.generation, input.requestId);
  const leaseId =
    typeof lease === "string" ? lease : "lease" in lease ? lease.lease : null;
  if (!leaseId) return { state: "processing" as const };
  const document = await extractIsolated(page.format, page.bytes);
  await reauthorize();
  return {
    state: "ready" as const,
    source: await store.complete(
      actor.uid,
      actor.generation,
      input.requestId,
      leaseId,
      document,
      { url: page.url, requestedUrl, readAt: Date.now() },
    ),
  };
}
