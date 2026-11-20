import { z } from "zod";
import type { Firestore } from "firebase-admin/firestore";
import {
  messageIntentSchema,
  messageIntentInstructions,
  targetSelectionSchema,
  targetSelectionInstructions,
  messagePlanReviewInstructions,
} from "#memory-core/conversation-format";
import { AccountError } from "../account/contracts.js";
import { V2Reader } from "./reader.js";
import { V2WorkStore } from "./work-store.js";
import { presentGroup, presentSaved } from "./presentation.js";
import { managementGroup } from "./management.js";
import { issuePlan, bindPlan } from "./plan-store.js";
import { V2Capture } from "./capture.js";
import { changeV2 } from "./change.js";
import { changeSchema } from "./contracts.js";
import type { ModelFactory } from "./capture.js";
import type { Route, Plan, Apply } from "./route-contracts.js";
import type { V2Reply } from "./contracts.js";
import { directIntent } from "./direct-intent.js";
import {
  unanchoredQuestion,
  clarificationInstructions,
} from "./intent-clarification.js";

export async function routeV2(
  db: Firestore,
  uid: string,
  generation: string,
  input: Route,
  model: ModelFactory,
  reauthorize: () => Promise<void>,
): Promise<V2Reply> {
  const work = new V2WorkStore(db),
    pending = await work.begin(uid, generation, input.requestId, input, null);
  if ("reply" in pending)
    return {
      apiVersion: 2,
      operationId: input.requestId,
      status:
        pending.reply.status === "processing" ? "processing" : "repeatRequired",
    };
  const lease = pending.lease;
  try {
    const earlyQuestion = unanchoredQuestion(input, lease.epoch);
    if (earlyQuestion) {
      await reauthorize();
      await work.finish(uid, lease, "ignored", {
        apiVersion: 2,
        operationId: input.requestId,
        status: "repeatRequired",
      });
      return {
        apiVersion: 2,
        operationId: input.requestId,
        status: "needsClarification",
        text: earlyQuestion,
      };
    }
    let provider: ReturnType<ModelFactory> | undefined;
    const getProvider = () => (provider ??= model(lease.epoch));
    const context =
      input.memoryEpoch === lease.epoch
        ? input.context
        : { questions: [], sourceIds: [] };
    const message = {
      text: input.text,
      mode: input.mode,
      context,
      receivedAt: new Date().toISOString(),
      zone: input.zone,
    };
    const direct = directIntent(input);
    const intent = direct
      ? { action: direct, fact: null, question: null }
      : await (
          await getProvider()
        ).call(
          "message_intent",
          `${messageIntentInstructions}\n${clarificationInstructions}`,
          message,
          messageIntentSchema,
          1400,
        );
    const base = {
      memoryEpoch: lease.epoch,
      receivedAt: message.receivedAt,
      expiresAtMs: Date.now() + 300_000,
    };
    let plan: Plan | null = null,
      question =
        intent.question ?? "Concreta qué dato quieres cambiar o recordar.";
    let candidates: unknown[] = [];
    if (intent.action === "ask" || intent.action === "tell") {
      if (
        intent.action === input.mode &&
        intent.fact === null &&
        intent.question === null
      )
        plan = { ...base, action: intent.action };
    } else if (intent.action === "offer") {
      if (
        input.mode === "ask" &&
        intent.fact &&
        input.text.includes(intent.fact) &&
        intent.question === null
      )
        plan = {
          ...base,
          action: "offer",
          fact: intent.fact,
          alsoAsk: intent.alsoAsk,
        };
    } else if (intent.action === "forget" && intent.forgetScope === null) {
      question =
        "¿Quieres olvidar el dato en todos tus recuerdos o retirar solo este relato?";
    } else if (intent.action === "correct" || intent.action === "forget") {
      const reader = new V2Reader(db, uid, generation),
        loaded = await reader.load();
      if (loaded.state.epoch !== lease.epoch)
        throw new AccountError("failed-precondition");
      let units = Object.values(loaded.state.units);
      if (intent.useContext) {
        const ids = new Set(
          context.sourceIds.flatMap(
            (id) => managementGroup(loaded, id)?.unitIds ?? [],
          ),
        );
        units = units.filter((u) => ids.has(u.id));
      } else
        units = (
          await reader.candidates(
            loaded,
            await getProvider(),
            input.text,
            message.receivedAt,
            input.zone,
          )
        ).units;
      if (units.length && units.length <= 32) {
        candidates = units.map((u) => ({
          ...u,
          ...u.content,
          sourceId: loaded.groups.find((g) => g.unitIds.includes(u.id))!.id,
        }));
        const selected = await (
          await getProvider()
        ).call(
          "message_target",
          `${targetSelectionInstructions}\nLos IDs son UUID estables de recuerdos. No inventes sufijos ni selecciones una copia arbitraria de unidades distintas.`,
          { ...message, action: intent.action, candidates },
          targetSelectionSchema,
          1400,
        );
        question = selected.question ?? question;
        const ids = selected.memoryIds;
        const group = loaded.groups.find((g) =>
          ids.every((id) => g.unitIds.includes(id)),
        );
        if (
          ids.length &&
          new Set(ids).size === ids.length &&
          ids.every((id) => units.some((u) => u.id === id)) &&
          group &&
          selected.question === null &&
          (intent.action === "forget"
            ? selected.correction === null
            : ids.length === 1 && Boolean(selected.correction))
        ) {
          const details = presentGroup(loaded, group.id);
          plan = {
            ...base,
            action: intent.action,
            sourceId: group.id,
            expectedVersion: details.version,
            memoryIds: ids,
            correction: selected.correction,
            ...(intent.action === "forget"
              ? { forgetScope: intent.forgetScope ?? "allOccurrences" }
              : {}),
          };
        }
      }
    } else if (intent.action === "forgetAll")
      question =
        "Indica el recuerdo concreto que quieres olvidar para poder confirmar su alcance.";
    // A tell proposal cannot write. Its intent is reviewed in the independent capture review.
    if (plan && plan.action !== "ask" && plan.action !== "tell") {
      const reviewed = await (
        await getProvider()
      ).call(
        "message_review",
        messagePlanReviewInstructions,
        { ...message, plan, candidates },
        z.strictObject({ allowed: z.boolean() }),
        1000,
      );
      if (!reviewed.allowed) plan = null;
    }
    await reauthorize();
    if (plan) {
      if (plan.action === "ask" || plan.action === "tell")
        await work.finish(uid, lease, "committed", {
          apiVersion: 2,
          operationId: input.requestId,
          status: "repeatRequired",
        });
      else await issuePlan(db, uid, lease, input, plan);
      return {
        apiVersion: 2,
        operationId: input.requestId,
        status: "ready",
        plan,
      };
    }
    await work.finish(uid, lease, "ignored", {
      apiVersion: 2,
      operationId: input.requestId,
      status: "repeatRequired",
    });
    return {
      apiVersion: 2,
      operationId: input.requestId,
      status: "needsClarification",
      text: question,
    };
  } catch (error) {
    await work.fail(uid, lease).catch(() => undefined);
    throw error;
  }
}

export async function applyV2(
  db: Firestore,
  uid: string,
  generation: string,
  input: Apply,
  model: ModelFactory,
  reauthorize: () => Promise<void>,
): Promise<V2Reply> {
  const replay = await bindPlan(db, uid, generation, input);
  if (input.decision === "reject")
    return { apiVersion: 2, operationId: input.requestId, status: "declined" };
  if (replay)
    return presentSaved(
      db,
      uid,
      generation,
      await new V2WorkStore(db).operation(uid, generation, input.requestId),
    );
  const plan = input.plan;
  if (plan.action === "offer")
    return new V2Capture(db).execute(
      uid,
      generation,
      {
        apiVersion: 2,
        requestId: input.requestId,
        mode: "tell",
        channel: "text",
        text: plan.fact,
        zone: input.turn.zone,
      },
      model,
      reauthorize,
      plan.memoryEpoch,
      plan.receivedAt,
    );
  if (plan.action !== "correct" && plan.action !== "forget")
    throw new AccountError("invalid-argument");
  const command = changeSchema.parse({
    apiVersion: 2,
    requestId: input.requestId,
    sourceId: plan.sourceId,
    expectedVersion: plan.expectedVersion,
    memoryIds: plan.memoryIds,
    action: plan.action,
    correction: plan.correction,
    zone: input.turn.zone,
    ...(input.continueManagement === undefined
      ? {}
      : { continueManagement: input.continueManagement }),
    ...(plan.forgetScope ? { forgetScope: plan.forgetScope } : {}),
  });
  return changeV2(
    db,
    uid,
    generation,
    command,
    model,
    reauthorize,
    plan.receivedAt,
  );
}
