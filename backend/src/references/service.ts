import { createHash } from "node:crypto";
import { decodeSource, importSchema } from "./contracts.js";
import { extractIsolated } from "./isolated-extractor.js";
import type { ReferenceStore } from "./store.js";

export async function uploadReference(
  store: ReferenceStore,
  uid: string,
  generation: string,
  input: unknown,
  lease: string,
  signal?: AbortSignal,
) {
  const command = importSchema.parse(input);
  const bytes = decodeSource(command);
  const checksum = createHash("sha256")
    .update(command.format)
    .update("\0")
    .update(bytes)
    .digest("hex");
  await store.verifyUpload(uid, generation, { ...command, checksum }, lease);
  const document = await extractIsolated(command.format, bytes, signal);
  return {
    state: "ready" as const,
    source: await store.complete(
      uid,
      generation,
      command.requestId,
      lease,
      document,
    ),
  };
}

/** No model/credential dependency; file bytes exist only for this extraction and are never persisted. */
export async function importReference(
  store: ReferenceStore,
  uid: string,
  generation: string,
  input: unknown,
  signal?: AbortSignal,
) {
  const command = importSchema.parse(input);
  const bytes = decodeSource(command);
  const checksum = createHash("sha256")
    .update(command.format)
    .update("\0")
    .update(bytes)
    .digest("hex");
  const admission = await store.begin(uid, generation, {
    requestId: command.requestId,
    title: command.title,
    format: command.format,
    checksum,
  });
  if (admission.state !== "started") return admission;
  try {
    const document = await extractIsolated(command.format, bytes, signal);
    return {
      state: "ready" as const,
      source: await store.complete(
        uid,
        generation,
        command.requestId,
        admission.lease,
        document,
      ),
    };
  } catch (error) {
    await store.cancel(uid, generation, command.requestId);
    throw error;
  }
}
