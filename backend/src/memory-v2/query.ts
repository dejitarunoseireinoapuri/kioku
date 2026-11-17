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
    let reply: V2Reply = {
      ...base,
      status: "notFound",
      text: "Todavía no hay recuerdos guardados.",
      sources: [],
    };
    if (Object.keys(loaded.state.units).length) {
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
    await work.finish(uid, pending.lease, "committed", {
      ...base,
      status: "repeatRequired",
      text: "",
      sources: [],
    });
    return reply;
  } catch (error) {
    await work.fail(uid, pending.lease).catch(() => undefined);
    throw error;
  }
}
