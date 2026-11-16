export type FailureCode =
  | "invalid_input"
  | "evidence_invariant"
  | "stale_version"
  | "scope_too_large"
  | "scope_unresolved"
  | "not_authorized"
  | "not_found"
  | "expired_plan"
  | "operation_conflict"
  | "transport_unknown";

export type EvidenceReason =
  | "duplicate_unit_key"
  | "fragment_range"
  | "duplicate_owner"
  | "unknown_owner"
  | "replacement_ownership"
  | "missing_owner"
  | "primary_ownership"
  | "empty_fragment"
  | "semantic_separator"
  | "incomplete_coverage"
  | "missing_primary"
  | "unknown_time_anchor"
  | "invalid_time_anchor";

/** Never expose the rejected input or a provider/validation error. */
export class CoreError extends Error {
  readonly code: FailureCode;
  readonly reason: EvidenceReason | undefined;
  constructor(code: FailureCode, reason?: EvidenceReason) {
    super(code);
    this.code = code;
    this.reason = reason;
  }
}

export function requireThat(
  condition: unknown,
  code: FailureCode = "evidence_invariant",
  reason?: EvidenceReason,
): asserts condition {
  if (!condition) throw new CoreError(code, reason);
}
