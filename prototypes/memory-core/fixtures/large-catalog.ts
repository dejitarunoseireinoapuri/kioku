import type { MemoryPrototype } from "../src/memory.ts";
import type { EvidenceReader } from "../ai/catalog-query.ts";
import type { Reference } from "../src/contracts.ts";
import { searchEntry } from "../src/search-index.ts";
import { requireThat } from "../src/errors.ts";
import { content } from "./scenarios.ts";

type Item = ReturnType<MemoryPrototype["evidence"]>["items"][number];
export const catalogCases = [
  {
    text: "Guardé el cuaderno granate en el baúl del pasillo.",
    question: "¿Dónde dejé el cuaderno granate?",
    terms: ["baul", "pasillo"],
    repeat: "El cuaderno granate sigue en el baúl del pasillo.",
  },
  {
    text: "Tengo pendiente ver el documental Ríos de Sal.",
    question: "¿Qué documental sobre ríos tengo pendiente?",
    terms: ["rios", "sal"],
    repeat: "Sigo teniendo pendiente ver Ríos de Sal.",
  },
  {
    text: "La contraseña ficticia del videojuego es zafiro-escarlata.",
    question: "¿Cuál es mi clave del videojuego?",
    terms: ["zafiro", "escarlata"],
    repeat: "La clave del videojuego sigue siendo zafiro-escarlata.",
  },
  {
    text: "El curso de torno de Julia cuesta 143 euros.",
    question: "¿Cuánto cuesta el curso de torno de Julia?",
    terms: ["143"],
    repeat: "El curso de torno de Julia vale 143 euros.",
  },
  {
    text: "Quiero observar el eclipse cuando vuelva Damián.",
    question: "¿Cuándo quiero observar el eclipse?",
    terms: ["damian"],
    repeat: "Sigo queriendo observar el eclipse cuando vuelva Damián.",
  },
  {
    text: "Mi vecino Enzo recomienda el restaurante Bosque de Niebla.",
    question: "¿Qué restaurante recomienda Enzo?",
    terms: ["bosque", "niebla"],
    repeat: "Enzo recomienda el restaurante Bosque de Niebla.",
  },
];
export const syntheticId = (index: number) =>
  `00000000-0000-4000-8000-${index.toString(16).padStart(12, "0")}`;

/** Pre-reviewed synthetic index/evidence fixture, deliberately separate from the 256-unit mutation store. */
export class LargeCatalog implements EvidenceReader {
  readonly owner = "synthetic-scale-owner";
  epoch = 1;
  readonly items = new Map<string, Item>();
  constructor(size: number) {
    for (let i = 0; i < size; i++) {
      const id = syntheticId(i + 1),
        sourceId = syntheticId(20_001 + i),
        fragmentId = syntheticId(40_001 + i);
      const text = catalogCases[i]?.text ?? filler(i);
      const base = content(text);
      const item: Item = {
        unit: {
          id,
          revision: 1,
          membershipRevision: 1,
          content: {
            ...base,
            text,
            kind:
              i === 1 || i === 4 ? "intention" : i === 5 ? "quotation" : "fact",
            attribution: i === 5 ? "Enzo" : null,
            condition: i === 4 ? "cuando vuelva Damián" : null,
          },
          time: { precision: "unknown", value: null, end: null },
          timeEvidenceId: null,
          recordedAt: Date.parse("2026-06-04T10:00:00Z"),
          updatedAt: Date.parse("2026-06-04T10:00:00Z"),
        },
        fragments: [
          {
            id: fragmentId,
            sourceId,
            start: 0,
            end: text.length,
            text,
            role: "primary",
            owners: [id],
          },
        ],
        sources: [
          {
            id: sourceId,
            kind: "capture",
            recordedAt: Date.parse("2026-06-04T10:00:00Z"),
            zone: "Europe/Madrid",
            length: text.length,
          },
        ],
        mentionCount: 1,
      };
      this.items.set(id, item);
    }
  }
  async page(actor: string, cursor: number, limit: number) {
    requireThat(actor === this.owner, "not_authorized");
    const items = [...this.items.values()];
    return {
      owner: this.owner,
      epoch: this.epoch,
      total: items.length,
      entries: items
        .slice(cursor, cursor + limit)
        .map((i) => searchEntry(i.unit, i.fragments)),
      next: cursor + limit < items.length ? cursor + limit : null,
    };
  }
  async assertCurrent(actor: string, epoch: number) {
    requireThat(actor === this.owner, "not_authorized");
    requireThat(epoch === this.epoch, "stale_version");
  }
  async evidence(actor: string, epoch: number, refs: Reference[]) {
    await this.assertCurrent(actor, epoch);
    return refs.map((ref) => {
      const item = this.items.get(ref.id);
      requireThat(item && item.unit.revision === ref.revision, "stale_version");
      return structuredClone(item);
    });
  }
  forget(id: string) {
    this.items.delete(id);
    this.epoch++;
  }
}
function filler(index: number) {
  const topics = [
    "cuaderno azul",
    "curso de torno de Marcos",
    "documental Dunas de Bronce",
    "eclipse de otro año",
    "restaurante recomendado por Luca",
    "videojuego sin contraseña",
  ];
  return `Catalogué la ficha ficticia ${index} sobre ${topics[index % topics.length]}. Su código de inventario es archivo${index}.`;
}
