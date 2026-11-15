import { z } from "zod";
import { AccountError } from "../account/contracts.js";
import { scopeVersion } from "./retirement.js";
import type { SourceBundle, SourceDetails } from "./contracts.js";

export interface PresentationIntelligence {
  presentMemories(data: unknown): Promise<unknown>;
  reviewMemoryPresentation(data: unknown): Promise<unknown>;
}

const presentationSchema = z.strictObject({
  items: z
    .array(
      z.strictObject({ id: z.string(), text: z.string().min(1).max(1600) }),
    )
    .min(1)
    .max(8),
});
const reviewSchema = z.strictObject({
  faithful: z.literal(true),
  ownerPerspective: z.literal(true),
  attributionPreserved: z.literal(true),
});

/** Read-only phrasing. Neither the provider's IDs nor its text grant a mutation or source permission. */
export class PresentSourceMemories {
  private readonly store: {
    bundle(uid: string, id: string): Promise<SourceBundle>;
  };
  constructor(store: {
    bundle(uid: string, id: string): Promise<SourceBundle>;
  }) {
    this.store = store;
  }

  async execute(
    uid: string,
    id: string,
    provider: () => Promise<PresentationIntelligence>,
    reauthorize: () => Promise<void>,
  ): Promise<SourceDetails> {
    const bundle = await this.store.bundle(uid, id);
    const memories = bundle.memories.map(
      ({
        id,
        text,
        quote,
        kind,
        time,
        provenance,
        attribution,
        eventStatus,
        lifecycle,
      }) => ({
        id,
        text,
        quote,
        kind,
        time,
        provenance,
        attribution,
        eventStatus,
        lifecycle,
      }),
    );
    const ai = bundle.ownerTextVersion === 1 ? null : await provider();
    const presentation = ai
      ? presentationSchema.parse(await ai.presentMemories({ memories }))
      : { items: memories.map(({ id, text }) => ({ id, text })) };
    const ids = new Set(memories.map((item) => item.id));
    if (
      presentation.items.length !== ids.size ||
      new Set(presentation.items.map((item) => item.id)).size !== ids.size ||
      presentation.items.some((item) => !ids.has(item.id))
    )
      throw new AccountError("unavailable");
    if (ai) {
      reviewSchema.parse(
        await ai.reviewMemoryPresentation({ memories, presentation }),
      );
    }
    await reauthorize();
    const current = await this.store.bundle(uid, id);
    if (
      scopeVersion(current.scope) !== scopeVersion(bundle.scope) ||
      current.memoryEpoch !== bundle.memoryEpoch
    ) {
      throw new AccountError("failed-precondition");
    }
    const textById = new Map(
      presentation.items.map((item) => [item.id, item.text]),
    );
    return {
      apiVersion: 1,
      sourceId: id,
      version: scopeVersion(current.scope),
      text: current.source.text,
      receivedAt: current.source.receivedAt,
      memoryEpoch: current.memoryEpoch,
      ...(current.sourceKind ? { sourceKind: current.sourceKind } : {}),
      items: current.memories.map((item) => {
        const text = textById.get(item.id);
        if (!text) throw new AccountError("unavailable");
        return { id: item.id, text };
      }),
    };
  }
}
