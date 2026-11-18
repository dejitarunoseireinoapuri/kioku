import { answerEvidence } from "#memory-v2/ai/query";
import type { Firestore } from "firebase-admin/firestore";
import type { z } from "zod";
import { AccountError } from "../account/contracts.js";
import { currentQueryText } from "../query/context.js";
import { V2Reader } from "./reader.js";
import { V2WorkStore } from "./work-store.js";
import { groupsForUnits, presentEvidence } from "./presentation.js";
import type { querySchema, V2Reply } from "./contracts.js";
import type { ModelFactory } from "./capture.js";
import { ReferenceStore } from "../references/store.js";
import { queryKnowledge } from "../references/query-context.js";

export async function queryV2(
  db: Firestore,
  uid: string,
  generation: string,
  input: z.infer<typeof querySchema>,
  model: ModelFactory,
  reauthorize: () => Promise<void>,
): Promise<V2Reply> {
  const work = new V2WorkStore(db),
    pending = await work.begin(uid, generation, input.requestId, input, null);
  const base = { apiVersion: 2, operationId: input.requestId };
  if ("reply" in pending)
    return {
      ...base,
      status:
        pending.reply.status === "processing" ? "processing" : "repeatRequired",
      text: "",
      sources: [],
    };
  try {
    const reader = new V2Reader(db, uid, generation),
      loaded = await reader.load(),
      lease = pending.lease;
    if (loaded.state.epoch !== lease.epoch)
      throw new AccountError("failed-precondition");
    const references = new ReferenceStore(db);
    const catalog = input.includeReferences
      ? await references.catalog(uid, generation)
      : null;
    const validate = async () => {
      await reader.assertCurrent(lease.epoch);
      if (catalog)
        await references.assertCurrent(uid, generation, catalog.epoch);
    };
    let reply: V2Reply = {
      ...base,
      status: "notFound",
      text: "Todavía no hay recuerdos guardados.",
      sources: [],
    };
    if (catalog?.sources.length) {
      const provider = await model(lease.epoch, validate);
      reply = {
        ...base,
        ...(await queryKnowledge(
          reader,
          loaded,
          provider,
          catalog.sources,
          {
            question: currentQueryText(input.text, lease.epoch),
            zone: input.zone,
          },
          validate,
        )),
      };
    } else if (Object.keys(loaded.state.units).length) {
      const provider = await model(lease.epoch),
        at = new Date().toISOString();
      const found = await reader.candidates(
        loaded,
        provider,
        currentQueryText(input.text, lease.epoch),
        at,
        input.zone,
      );
      if (found.exhaustiveRequested && found.truncated) {
        reply = {
          ...base,
          status: "needsClarification",
          text: "Concreta el tema o el periodo para poder revisar juntos los recuerdos pertinentes.",
          sources: [],
        };
      } else if (found.units.length) {
        const items = presentEvidence(
          loaded,
          found.units.map((u) => ({ id: u.id, revision: u.revision })),
        );
        const answer = await answerEvidence(
          provider,
          items,
          {
            question: currentQueryText(input.text, lease.epoch),
            at,
            zone: input.zone,
            ranked: found.ranked,
          },
          () => reader.assertCurrent(lease.epoch),
        );
        reply = {
          ...base,
          status:
            answer.status === "not_found"
              ? "notFound"
              : answer.status === "clarify"
                ? "needsClarification"
                : "answered",
          text: answer.text,
          sources: groupsForUnits(loaded, answer.ids),
        };
      } else
        reply = {
          ...base,
          status: "notFound",
          text: "No encuentro ese dato con esta búsqueda.",
          sources: [],
        };
    }
    await reauthorize();
    await validate();
    await work.finish(
      uid,
      pending.lease,
      "committed",
      {
        ...base,
        status: "repeatRequired",
        text: "",
        sources: [],
      },
      undefined,
      catalog
        ? (tx) => references.validate(tx, uid, generation, catalog.epoch)
        : undefined,
    );
    return reply;
  } catch (error) {
    await work.fail(uid, pending.lease).catch(() => undefined);
    throw error;
  }
}
