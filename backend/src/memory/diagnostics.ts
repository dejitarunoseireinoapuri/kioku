import { z } from "zod";
import { MemoryError } from "#memory-core/domain";
import { AccountError } from "../account/contracts.js";

const timeCodes = [
  "TIME_QUOTE_NOT_IN_SOURCE",
  "TIME_EVIDENCE_REQUIRED",
  "TIME_UNSUPPORTED_PRECISION",
  "TIME_RELATIVE_MISMATCH",
  "TIME_VALUE_NOT_SUPPORTED",
  "TIME_INVALID_DATE",
  "TIME_UNKNOWN_HAS_VALUE",
  "TIME_UNEXPECTED_END",
  "TIME_ZONE_INVALID",
] as const;
const evidenceCodes = [
  "QUOTE_NOT_IN_SOURCE",
  "QUOTE_EMPTY",
  "EXTRACTION_PERSONAL_ATTRIBUTION",
  "EXTRACTION_ATTRIBUTION_EVIDENCE_REQUIRED",
  "EXTRACTION_ATTRIBUTION_QUOTE_INVALID",
  "EXTRACTION_ATTRIBUTION_NOT_IN_EVIDENCE",
  "EXTRACTION_EVIDENCE_ID_INVALID",
  "EXTRACTION_STATE_INVALID",
] as const;
const codes = z.enum([
  ...timeCodes,
  ...evidenceCodes,
  "CAPTURE_TIME_TEXT_REVIEW_REQUIRED",
  "CAPTURE_REFINEMENT_CHANGED_EVIDENCE",
  "CAPTURE_REFINEMENT_REJECTED",
  "CAPTURE_REFINEMENT_IDS_INVALID",
  "CAPTURE_REVIEW_VALIDATION_UNRESOLVED",
  "CAPTURE_LEASE_EXPIRED",
  "MODEL_INPUT_LIMIT",
  "PROVIDER_RESPONSE_LIMIT",
  "MODEL_INCOMPLETE",
  "MODEL_OUTPUT_INVALID",
  "MODEL_REFUSAL",
  "PROVIDER_MODEL_CHANGED",
  "PROVIDER_SCHEMA_INVALID",
  "OPENAI_NETWORK_OR_RESPONSE",
  "EMBEDDING_INPUT_INVALID",
  "EMBEDDING_RESPONSE_SCHEMA_INVALID",
  "EMBEDDING_COUNT",
  "OPENAI_HTTP_401",
  "OPENAI_HTTP_403",
  "OPENAI_HTTP_408",
  "OPENAI_HTTP_429",
  "OPENAI_HTTP_500",
  "OPENAI_HTTP_502",
  "OPENAI_HTTP_503",
  "OPENAI_HTTP_504",
  "UNAUTHENTICATED",
  "PERMISSION_DENIED",
  "INVALID_ARGUMENT",
  "RESOURCE_EXHAUSTED",
  "FAILED_PRECONDITION",
  "UNAVAILABLE",
  "UNEXPECTED",
]);
export const captureFailureSchema = z.strictObject({
  version: z.literal(1),
  stage: z.enum([
    "credentials",
    "interpretation",
    "validation",
    "time-text-review",
    "embedding",
    "authorization",
    "commit",
    "lease",
  ]),
  reason: z.enum([
    "time",
    "evidence",
    "model-output",
    "provider",
    "usage-limit",
    "credentials",
    "authorization",
    "conflict",
    "unexpected",
  ]),
  code: codes,
});
export type CaptureFailure = z.infer<typeof captureFailureSchema>;
export type CaptureStage = CaptureFailure["stage"];

/** Only enumerated codes enter a receipt. No error message, model output, text or stack is copied. */
export function captureFailure(
  stage: CaptureStage,
  error: unknown,
): CaptureFailure {
  let code: CaptureFailure["code"] = "UNEXPECTED";
  if (error instanceof AccountError) {
    const mapping = {
      unauthenticated: "UNAUTHENTICATED",
      "permission-denied": "PERMISSION_DENIED",
      "invalid-argument": "INVALID_ARGUMENT",
      "resource-exhausted": "RESOURCE_EXHAUSTED",
      "failed-precondition": "FAILED_PRECONDITION",
      unavailable: "UNAVAILABLE",
    } as const;
    code = mapping[error.code];
  } else if (error instanceof MemoryError) {
    code =
      codes.safeParse(error.message).data ??
      (error.message.startsWith("PROVIDER_SCHEMA_INVALID_")
        ? "PROVIDER_SCHEMA_INVALID"
        : "UNEXPECTED");
  } else if (error instanceof z.ZodError) code = "MODEL_OUTPUT_INVALID";
  return { version: 1, stage, reason: failureReason(stage, code), code };
}

function failureReason(
  stage: CaptureStage,
  code: CaptureFailure["code"],
): CaptureFailure["reason"] {
  if (
    stage === "credentials" ||
    code === "OPENAI_HTTP_401" ||
    code === "OPENAI_HTTP_403"
  )
    return "credentials";
  if (code === "UNAUTHENTICATED" || code === "PERMISSION_DENIED")
    return "authorization";
  if (code === "RESOURCE_EXHAUSTED" || code === "OPENAI_HTTP_429")
    return "usage-limit";
  if ((timeCodes as readonly string[]).includes(code)) return "time";
  if ((evidenceCodes as readonly string[]).includes(code)) return "evidence";
  if (
    code === "CAPTURE_LEASE_EXPIRED" ||
    (code === "FAILED_PRECONDITION" && stage === "commit")
  )
    return "conflict";
  if (
    code.startsWith("CAPTURE_") ||
    code.startsWith("MODEL_") ||
    code === "PROVIDER_SCHEMA_INVALID"
  )
    return "model-output";
  if (
    code.startsWith("OPENAI_") ||
    code.startsWith("EMBEDDING_") ||
    code === "UNAVAILABLE"
  )
    return "provider";
  return "unexpected";
}
