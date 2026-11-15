import { z } from "zod";
import { AccountError } from "../account/contracts.js";

const changesSchema = z
  .array(
    z.strictObject({
      sourceId: z.uuid(),
      sourceIds: z.array(z.uuid()).max(2),
    }),
  )
  .min(1)
  .max(32);

/** References only: never a historical source, removed text or a client-supplied alias. */
export function managementChanges(
  value: unknown,
  currentIds: string[],
  selectedSource: string | undefined,
) {
  const parsed = changesSchema.safeParse(value);
  if (!parsed.success || !selectedSource)
    throw new AccountError("failed-precondition");
  const changes = parsed.data;
  const nextIds = changes.flatMap((change) => change.sourceIds);
  if (
    new Set(changes.map((c) => c.sourceId)).size !== changes.length ||
    !changes.some((c) => c.sourceId === selectedSource) ||
    new Set(nextIds).size !== nextIds.length ||
    nextIds.length !== currentIds.length ||
    nextIds.some((id) => !currentIds.includes(id)) ||
    changes.some((c) => currentIds.includes(c.sourceId))
  ) {
    throw new AccountError("failed-precondition");
  }
  return changes;
}
