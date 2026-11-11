import type { Candidate, Memory } from "./domain.ts";
import { MemoryError } from "./domain.ts";

function tokens(text: string): Set<string> {
  const normalized = text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
  return new Set(normalized.match(/[\p{L}\p{N}]{3,}/gu) ?? []);
}

export function cosine(left: number[], right: number[]): number {
  if (left.length !== right.length || left.length === 0)
    throw new MemoryError("VECTOR_DIMENSIONS");
  let dot = 0;
  let a = 0;
  let b = 0;
  for (let index = 0; index < left.length; index++) {
    const x = left[index]!;
    const y = right[index]!;
    if (!Number.isFinite(x) || !Number.isFinite(y))
      throw new MemoryError("VECTOR_INVALID");
    dot += x * y;
    a += x * x;
    b += y * y;
  }
  return a && b ? dot / Math.sqrt(a * b) : 0;
}

export function retrieve(
  memories: Memory[],
  question: string,
  vector: number[],
  limit: number,
): Candidate[] {
  const words = tokens(question);
  return memories
    .map((memory) => {
      const indexed = tokens(
        `${memory.text} ${memory.quote} ${memory.entities.join(" ")}`,
      );
      const overlap =
        [...words].filter((word) => indexed.has(word)).length /
        Math.max(words.size, 1);
      return {
        memory,
        score: 0.85 * cosine(memory.vector, vector) + 0.15 * overlap,
      };
    })
    .sort((a, b) => b.score - a.score || a.memory.id.localeCompare(b.memory.id))
    .slice(0, limit);
}
