import type { Unit, Fragment } from "./model.ts";
import type { Reference } from "./contracts.ts";
import { referenceSchema } from "./contracts.ts";
import { terms } from "./catalog.ts";
import { requireThat } from "./errors.ts";

export interface SearchEntry {
  ref: Reference;
  terms: string[];
}
export interface CatalogPage {
  owner: string;
  epoch: number;
  total: number;
  entries: SearchEntry[];
  next: number | null;
}
export interface CatalogReader {
  page(actor: string, cursor: number, limit: number): Promise<CatalogPage>;
  assertCurrent(actor: string, epoch: number): Promise<void>;
}
export function searchEntry(unit: Unit, fragments: Fragment[]): SearchEntry {
  return {
    ref: { id: unit.id, revision: unit.revision },
    terms: terms(
      [
        ...Object.values(unit.content),
        unit.time.value,
        unit.time.end,
        ...fragments
          .filter((f) => f.owners.includes(unit.id))
          .map((f) => f.text),
      ]
        .filter((v) => typeof v === "string")
        .join(" "),
    ),
  };
}

/** Derived RAM index, built from ALL pages of one authorized generation. Not a persistence adapter. */
export class SearchIndex {
  readonly owner: string;
  readonly epoch: number;
  readonly total: number;
  readonly pages: number;
  readonly #entries: Map<string, SearchEntry>;
  readonly #postings = new Map<string, Map<string, number>>();
  private constructor(
    owner: string,
    epoch: number,
    entries: SearchEntry[],
    pages: number,
  ) {
    this.owner = owner;
    this.epoch = epoch;
    this.total = entries.length;
    this.pages = pages;
    this.#entries = new Map(entries.map((e) => [e.ref.id, structuredClone(e)]));
    for (const entry of entries)
      for (const term of entry.terms) {
        let posting = this.#postings.get(term);
        if (!posting) {
          posting = new Map();
          this.#postings.set(term, posting);
        }
        posting.set(entry.ref.id, entry.terms.length);
      }
  }
  static async load(
    reader: CatalogReader,
    actor: string,
  ): Promise<SearchIndex> {
    let cursor = 0,
      epoch: number | undefined,
      total: number | undefined,
      pages = 0,
      bytes = 0;
    const entries: SearchEntry[] = [],
      ids = new Set<string>();
    do {
      requireThat(pages < 40, "scope_too_large");
      const page = await reader.page(actor, cursor, 256);
      requireThat(page.owner === actor, "not_authorized");
      requireThat(
        Number.isSafeInteger(page.epoch) &&
          page.epoch >= 0 &&
          (epoch === undefined || epoch === page.epoch),
        "stale_version",
      );
      requireThat(
        Number.isSafeInteger(page.total) &&
          page.total >= 0 &&
          page.total <= 10_000 &&
          (total === undefined || total === page.total),
        "scope_too_large",
      );
      epoch = page.epoch;
      total = page.total;
      pages++;
      requireThat(
        page.entries.length <= 256 &&
          entries.length + page.entries.length <= total,
        "invalid_input",
      );
      for (const entry of page.entries) {
        bytes += new TextEncoder().encode(JSON.stringify(entry)).byteLength;
        requireThat(bytes <= 32 * 1024 * 1024, "scope_too_large");
        requireThat(
          referenceSchema.safeParse(entry.ref).success &&
            !ids.has(entry.ref.id),
          "invalid_input",
        );
        requireThat(
          entry.terms.length <= 4096 &&
            new Set(entry.terms).size === entry.terms.length &&
            entry.terms.every(
              (t) =>
                t.length <= 2000 && terms(t).length === 1 && terms(t)[0] === t,
            ),
          "invalid_input",
        );
        ids.add(entry.ref.id);
        entries.push(entry);
      }
      cursor += page.entries.length;
      requireThat(
        page.next === null
          ? cursor === total
          : page.next === cursor && page.entries.length > 0 && cursor < total,
        "invalid_input",
      );
      if (page.next === null) break;
    } while (cursor < total!);
    requireThat(entries.length === total, "invalid_input");
    await reader.assertCurrent(actor, epoch!);
    return new SearchIndex(actor, epoch!, entries, pages);
  }
  search(actor: string, queryTerms: string[], limit = 32) {
    requireThat(actor === this.owner, "not_authorized");
    requireThat(
      queryTerms.length <= 64 &&
        queryTerms.every((t) => typeof t === "string" && t.length <= 100) &&
        Number.isInteger(limit) &&
        limit >= 1 &&
        limit <= 32,
      "invalid_input",
    );
    const tokens = terms(queryTerms.join(" "));
    const scores = new Map<string, number>();
    for (const token of tokens) {
      const posting = this.#postings.get(token);
      if (!posting) continue;
      const rarity = Math.log(1 + this.total / posting.size);
      for (const [id, length] of posting)
        scores.set(
          id,
          (scores.get(id) ?? 0) + rarity / Math.sqrt(Math.max(1, length)),
        );
    }
    const hits = [...scores].sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
    );
    return {
      refs: hits
        .slice(0, limit)
        .map(([id]) => structuredClone(this.#entries.get(id)!.ref)),
      epoch: this.epoch,
      total: this.total,
      matched: hits.length,
      truncated: hits.length > limit,
      coverage: "ranked_candidates" as const,
    };
  }
}
