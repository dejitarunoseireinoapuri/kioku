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

/** Never expose the rejected input or a provider/validation error. */
export class CoreError extends Error {
  readonly code: FailureCode;
  constructor(code: FailureCode) {
    super(code);
    this.code = code;
  }
}

export function requireThat(
  condition: unknown,
  code: FailureCode = "evidence_invariant",
): asserts condition {
  if (!condition) throw new CoreError(code);
}
