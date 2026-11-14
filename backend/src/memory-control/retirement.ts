import { z } from "zod";
import { AccountError } from "../account/contracts.js";

const version = z.string().regex(/^\d{1,12}:\d{1,9}$/u);
export const retirementScope = z
  .strictObject({
    scope: z.literal("entireSource"),
    sourceId: z.uuid(),
    sourceVersion: version,
    memories: z
      .array(z.strictObject({ id: z.string().max(40), version }))
      .min(1)
      .max(8),
    expiresAtMs: z.number().int().positive(),
  })
  .superRefine((scope, context) => {
    const ids = new Set(scope.memories.map((entry) => entry.id));
    const allowedIds = new Set(
      Array.from({ length: 8 }, (_, index) => `${scope.sourceId}-${index + 1}`),
    );
    if (
      ids.size !== scope.memories.length ||
      scope.memories.some((entry) => !allowedIds.has(entry.id))
    )
      context.addIssue({ code: "custom", message: "Invalid resolved scope" });
  });
export type RetirementScope = z.infer<typeof retirementScope>;
export interface RetirementResult {
  readonly status: "forgotten";
  readonly operationId: string;
  readonly sourceId: string;
  readonly removedCount: number;
}

/** Internal only: a resolver must establish explicit whole-source intent before commit.
 * This is not an HTTP input, a model tool, or authorization to expand a fragment deletion.
 */
export interface SourceRetirementStore {
  inspect(uid: string, sourceId: string): Promise<RetirementScope>;
  retire(
    uid: string,
    requestId: string,
    scope: RetirementScope,
  ): Promise<RetirementResult>;
}

export function validateRetirementTarget(uid: string, sourceId: string): void {
  if (
    !/^[A-Za-z0-9_-]{1,128}$/u.test(uid) ||
    !z.uuid().safeParse(sourceId).success
  )
    throw new AccountError("invalid-argument");
}

export function validateRetirement(
  uid: string,
  requestId: string,
  scope: RetirementScope,
): RetirementScope {
  const parsed = retirementScope.safeParse(scope);
  validateRetirementTarget(uid, requestId);
  if (!parsed.success || requestId === parsed.data.sourceId) {
    throw new AccountError("invalid-argument");
  }
  return parsed.data;
}
