import assert from "node:assert/strict";
import { test } from "node:test";
import { z } from "zod";
import { MemoryError } from "#memory-core/domain";
import { AccountError } from "../../src/account/contracts.js";
import {
  captureFailure,
  captureFailureSchema,
} from "../../src/memory/diagnostics.js";

test("capture failures retain only a closed technical vocabulary", () => {
  assert.deepEqual(
    captureFailure("validation", new MemoryError("TIME_RELATIVE_MISMATCH")),
    {
      version: 1,
      stage: "validation",
      reason: "time",
      code: "TIME_RELATIVE_MISMATCH",
    },
  );
  for (const error of [
    new Error("Private synthetic text"),
    new MemoryError("Private synthetic text"),
    { message: "Private synthetic text" },
  ]) {
    const failure = captureFailure("embedding", error);
    assert.deepEqual(failure, {
      version: 1,
      stage: "embedding",
      reason: "unexpected",
      code: "UNEXPECTED",
    });
    assert.equal(JSON.stringify(failure).includes("Private"), false);
  }
  const failure = captureFailure(
    "interpretation",
    new MemoryError("PROVIDER_SCHEMA_INVALID_output_content"),
  );
  assert.equal(failure.code, "PROVIDER_SCHEMA_INVALID");
  assert.equal(
    captureFailureSchema.safeParse({ ...failure, text: "Never persist this" })
      .success,
    false,
  );
  assert.equal(
    captureFailureSchema.safeParse({
      ...failure,
      code: "OPENAI_HTTP_429_private",
    }).success,
    false,
  );
});

test("provider, access, usage and lease failures have distinct bounded diagnoses", () => {
  assert.equal(
    captureFailure("credentials", new AccountError("unavailable")).reason,
    "credentials",
  );
  assert.equal(
    captureFailure("authorization", new AccountError("permission-denied"))
      .reason,
    "authorization",
  );
  assert.equal(
    captureFailure("interpretation", new AccountError("resource-exhausted"))
      .reason,
    "usage-limit",
  );
  assert.equal(
    captureFailure("embedding", new MemoryError("OPENAI_HTTP_429")).reason,
    "usage-limit",
  );
  assert.equal(
    captureFailure(
      "interpretation",
      new MemoryError("OPENAI_NETWORK_OR_RESPONSE"),
    ).reason,
    "provider",
  );
  assert.equal(
    captureFailure("lease", new MemoryError("CAPTURE_LEASE_EXPIRED")).reason,
    "conflict",
  );
  const invalid = z.string().safeParse(1);
  assert.equal(
    captureFailure("validation", invalid.error).code,
    "MODEL_OUTPUT_INVALID",
  );
});
