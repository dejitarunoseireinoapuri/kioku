import { FieldValue } from "firebase-admin/firestore";
import type { Memory } from "#memory-core/domain";
import { memorySchema } from "#memory-core/domain";

export function canonicalMemory(value: Record<string, unknown>): Memory {
  const canonical = { ...value };
  for (const field of ["searchSchema", "searchVector", "searchTerms"])
    delete canonical[field];
  return memorySchema.parse(canonical);
}

export function searchTerms(text: string): string[] {
  return [
    ...new Set(
      text
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase()
        .match(/[\p{L}\p{N}]{3,}/gu) ?? [],
    ),
  ].slice(0, 128);
}
export function searchProjection(memory: Memory) {
  return {
    searchSchema: 1,
    searchVector: FieldValue.vector(memory.vector),
    searchTerms: searchTerms(
      `${memory.text} ${memory.quote} ${memory.entities.join(" ")}`,
    ),
  };
}
