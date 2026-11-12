import type { Item } from "./domain.ts";
import { MemoryError } from "./domain.ts";

/** Attribution needs a literal evidence span; the speaker's role is also checked during capture review. */
export function validateAttribution(item: Item, source: string): void {
  if (item.provenance === "personal" && item.attribution !== null)
    throw new MemoryError("EXTRACTION_PERSONAL_ATTRIBUTION");
  if ((item.attribution === null) !== (item.attributionEvidence === null))
    throw new MemoryError("EXTRACTION_ATTRIBUTION_EVIDENCE_REQUIRED");
  if (item.attributionEvidence !== null) {
    if (!source.includes(item.attributionEvidence))
      throw new MemoryError("EXTRACTION_ATTRIBUTION_QUOTE_INVALID");
    if (
      !item.attributionEvidence
        .toLocaleLowerCase("es")
        .includes(item.attribution!.toLocaleLowerCase("es"))
    )
      throw new MemoryError("EXTRACTION_ATTRIBUTION_NOT_IN_EVIDENCE");
  }
}
