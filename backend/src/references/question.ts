import { z } from "zod";
import type { Firestore } from "firebase-admin/firestore";
import type { StructuredModel } from "#memory-v2/ai/contracts";
import { V2WorkStore } from "../memory-v2/work-store.js";
import { ReferenceStore } from "./store.js";
import { answerReferences } from "./answer.js";
import { safeText } from "../memory-v2/contracts.js";

export const referenceQuestionSchema = z.strictObject({
  requestId: z.uuid(),
  question: safeText.max(2000),
  sourceId: z.uuid().optional(),
});
export type ReferenceModelFactory = (
  memoryEpoch: number,
  validate: () => Promise<void>,
) => Promise<StructuredModel>;

export async function questionReferences(
  db: Firestore,
  actor: { uid: string; generation: string },
  raw: unknown,
  factory: ReferenceModelFactory,
  reauthorize: () => Promise<void>,
) {
  const input = referenceQuestionSchema.parse(raw);
  const work = new V2WorkStore(db);
  const pending = await work.begin(
    actor.uid,
    actor.generation,
    input.requestId,
    { operation: "referenceQuestion", ...input },
    null,
  );
  if ("reply" in pending)
    return {
      status:
        pending.reply.status === "processing" ? "processing" : "repeatRequired",
      text: "",
      citations: [],
    };
  const store = new ReferenceStore(db);
  try {
    const catalog = await store.catalog(actor.uid, actor.generation);
    const validate = () =>
      store.assertCurrent(actor.uid, actor.generation, catalog.epoch);
    const scoped = catalog.sources.filter((source) =>
      input.sourceId
        ? source.id === input.sourceId
        : source.document.coverage !== "partial",
    );
    const reply = scoped.length
      ? await answerReferences(
          await factory(pending.lease.epoch, validate),
          scoped,
          input.question,
          input.sourceId,
          validate,
        )
      : {
          status: "notFound" as const,
          text: "Todavía no hay documentos disponibles para esta consulta.",
          citations: [],
        };
    await reauthorize();
    await work.finish(
      actor.uid,
      pending.lease,
      "committed",
      { status: "repeatRequired" },
      undefined,
      (tx) => store.validate(tx, actor.uid, actor.generation, catalog.epoch),
    );
    return { ...reply, referenceEpoch: catalog.epoch };
  } catch (error) {
    await work.fail(actor.uid, pending.lease).catch(() => undefined);
    throw error;
  }
}
