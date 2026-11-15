import assert from "node:assert/strict";
import test from "node:test";
import { MemoryEngine } from "#memory-core/engine";
import { MemoryError } from "#memory-core/domain";
import type { MemoryIntelligence } from "#memory-core/domain";
import { interpretCapture } from "../../src/memory/interpretation.js";

const turn = {
  id: "synthetic-writing",
  text: "quiero jugary prender",
  zone: "Europe/Madrid",
  receivedAt: "2026-11-15T13:00:00Z",
};
function failingEngine(code: string) {
  const ai: MemoryIntelligence = {
    extract: async () => {
      throw new MemoryError(code);
    },
    embed: async () => {
      throw Error("Unverified text must not reach embeddings");
    },
    answer: async () => {
      throw Error("Not a query");
    },
  };
  return new MemoryEngine(
    {
      load: async () => ({ version: 4, sources: [], memories: [] }),
      save: async () => {
        throw Error("Unverified text must not be persisted");
      },
    },
    ai,
  );
}
test("a rejected semantic interpretation asks for a rewrite without claiming spelling is at fault", async () => {
  for (const code of [
    "TIME_UNSUPPORTED_PRECISION",
    "TIME_VALUE_NOT_SUPPORTED",
    "TIME_INVALID_DATE",
    "CAPTURE_REFINEMENT_REJECTED",
  ]) {
    const result = await interpretCapture(failingEngine(code), turn);
    assert.equal(result.status, "needs_clarification");
    assert.deepEqual(result.items, []);
    assert.match(result.clarification!, /Reescríbelo.*palabras/);
    assert.doesNotMatch(result.clarification!, /ortograf|faltas|guardado/);
  }
});
test("transport, model schema, authorization and evidence tampering never become spelling advice", async () => {
  for (const code of [
    "OPENAI_NETWORK_OR_RESPONSE",
    "OPENAI_HTTP_429",
    "MODEL_OUTPUT_INVALID",
    "CAPTURE_REVIEW_VALIDATION_UNRESOLVED",
    "EXTRACTION_EVIDENCE_ID_INVALID",
    "CAPTURE_REFINEMENT_CHANGED_EVIDENCE",
    "CAPTURE_TIME_TEXT_REVIEW_REQUIRED",
  ]) {
    await assert.rejects(interpretCapture(failingEngine(code), turn), {
      message: code,
    });
  }
});
