import { Worker } from "node:worker_threads";
import { documentSchema, limits, SourceError } from "./contracts.js";
import type {
  ExtractedDocument,
  SourceFormat,
  SourceIssue,
} from "./contracts.js";

export async function extractIsolated(
  format: SourceFormat,
  bytes: Uint8Array,
  signal?: AbortSignal,
): Promise<ExtractedDocument> {
  if (signal?.aborted) throw new SourceError("interrupted");
  if (bytes.length > limits.bytes) throw new SourceError("too-large");
  const worker = new Worker(new URL("./extract-worker.js", import.meta.url), {
    resourceLimits: { maxOldGenerationSizeMb: 256, stackSizeMb: 4 },
    env: {},
    stdout: true,
    stderr: true,
  });
  // Parser warnings/raw failures never enter application diagnostics.
  worker.stdout.resume();
  worker.stderr.resume();
  return new Promise((resolve, reject) => {
    let done = false;
    const finish = (issue?: SourceIssue, document?: ExtractedDocument) => {
      if (done) return;
      done = true;
      clearTimeout(deadline);
      signal?.removeEventListener("abort", cancel);
      void worker.terminate();
      if (issue) reject(new SourceError(issue));
      else resolve(document!);
    };
    const cancel = () => finish("interrupted");
    const deadline = setTimeout(cancel, 30_000);
    signal?.addEventListener("abort", cancel, { once: true });
    worker.once("error", () => finish("invalid"));
    worker.once("exit", () => {
      if (!done) finish("invalid");
    });
    worker.once("message", (value: unknown) => {
      const candidate = value as { document?: unknown; issue?: SourceIssue };
      const document = documentSchema.safeParse(candidate.document);
      if (document.success) finish(undefined, document.data);
      else finish(candidate.issue ?? "invalid");
    });
    worker.postMessage({ format, bytes });
  });
}
