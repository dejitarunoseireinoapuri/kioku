import { parentPort } from "node:worker_threads";
import { extractSource } from "./extract.js";
import { SourceError } from "./contracts.js";

// Only byte extraction is exposed; this module has no model, credential or network adapter.
parentPort?.once(
  "message",
  async (input: { format: unknown; bytes: Uint8Array }) => {
    try {
      parentPort?.postMessage({
        document: await extractSource(input.format, input.bytes),
      });
    } catch (error) {
      parentPort?.postMessage({
        issue: error instanceof SourceError ? error.issue : "invalid",
      });
    } finally {
      parentPort?.close();
    }
  },
);
