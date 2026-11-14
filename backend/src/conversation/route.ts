import { snapshotVersion } from "#memory-core/domain";
import {
  messageIntentSchema,
  targetSelectionSchema,
} from "#memory-core/conversation-format";
import { AccountError } from "../account/contracts.js";
import { literalFact } from "../memory-control/selection.js";
import type { QueryEvidence } from "../query/contracts.js";
import type { SourceControlStore } from "../memory-control/contracts.js";
import type {
  RoutingInput,
  RoutingPlan,
  RoutingResult,
  RoutingStore,
  RoutingIntelligence,
} from "./contracts.js";

const clarify =
  "Necesito concretar qué dato quieres cambiar o recordar. ¿A cuál te refieres?";
const emptyEvidence = (): QueryEvidence => ({
  snapshot: { version: snapshotVersion, sources: [], memories: [] },
  versions: [],
});

export class RouteMessage {
  private readonly store: RoutingStore;
  private readonly sources: SourceControlStore;
  constructor(store: RoutingStore, sources: SourceControlStore) {
    this.store = store;
    this.sources = sources;
  }

  async execute(
    uid: string,
    input: RoutingInput,
    provider: () => Promise<RoutingIntelligence>,
    reauthorize: () => Promise<void>,
  ): Promise<RoutingResult> {
    const work = await this.store.begin(uid, input);
    if ("status" in work) return work;
    try {
      const epoch = await this.store.epoch(uid);
      const context =
        input.memoryEpoch === epoch
          ? input.context
          : { questions: [], sourceIds: [] };
      const intelligence = await provider();
      const message = {
        text: input.text,
        mode: input.mode,
        context,
        receivedAt: work.receivedAt,
        zone: input.zone,
      };
      const intent = messageIntentSchema.parse(
        await intelligence.interpretMessage(message),
      );
      const base = {
        memoryEpoch: epoch,
        receivedAt: work.receivedAt,
        expiresAtMs: Date.parse(work.receivedAt) + 300_000,
      };
      let plan: RoutingPlan | null = null;
      let question = intent.question ?? clarify;
      let evidence = emptyEvidence();
      if (intent.action === "ask" || intent.action === "tell") {
        if (
          (intent.action === "ask") === (input.mode === "ask") &&
          intent.fact === null &&
          intent.question === null
        ) {
          plan = { ...base, action: intent.action };
        }
      } else if (intent.action === "offer") {
        if (input.mode === "ask" && intent.fact && intent.question === null) {
          plan = {
            ...base,
            action: "offer",
            fact: literalFact(input.text, intent.fact),
            alsoAsk: intent.alsoAsk,
          };
        }
      } else if (intent.action === "forgetAll") {
        question =
          "Ahora puedo retirar recuerdos concretos o textos completos. Indícame cuál quieres olvidar.";
      } else if (intent.action === "correct" || intent.action === "forget") {
        if (intent.useContext && context.sourceIds.length !== 1) {
          question =
            "¿Qué dato concreto de la respuesta quieres cambiar u olvidar?";
        } else {
          if (intent.useContext)
            evidence = await this.store.context(uid, context.sourceIds[0]!);
          else {
            const vector = (await intelligence.embed([input.text]))[0];
            if (
              !vector ||
              vector.length !== 512 ||
              !vector.every(Number.isFinite)
            )
              throw new AccountError("unavailable");
            evidence = await this.store.retrieve(uid, input.text, vector);
          }
          const candidates = evidence.snapshot.memories.map(
            ({ vector: _vector, ...memory }) => memory,
          );
          const selected = targetSelectionSchema.parse(
            await intelligence.selectMemoryTarget({
              ...message,
              action: intent.action,
              candidates,
            }),
          );
          question = selected.question ?? clarify;
          const targets = selected.memoryIds.map((id) =>
            evidence.snapshot.memories.find((memory) => memory.id === id),
          );
          const ids = new Set(selected.memoryIds);
          if (
            targets.length &&
            ids.size === targets.length &&
            targets.every((target) => target !== undefined) &&
            targets.every(
              (target) => target?.sourceId === targets[0]?.sourceId,
            ) &&
            selected.question === null &&
            (intent.action === "forget"
              ? selected.correction === null
              : targets.length === 1 && Boolean(selected.correction))
          ) {
            const sourceId = targets[0]!.sourceId;
            const details = await this.sources.details(uid, sourceId);
            plan = {
              ...base,
              action: intent.action,
              sourceId,
              expectedVersion: details.version,
              memoryIds: selected.memoryIds,
              correction: selected.correction,
            };
          }
        }
      }
      if (
        plan &&
        (plan.action === "tell" ||
          plan.action === "offer" ||
          plan.action === "correct" ||
          plan.action === "forget")
      ) {
        const candidates = evidence.snapshot.memories.map(
          ({ vector: _vector, ...memory }) => memory,
        );
        const reviewed = await intelligence.reviewMessagePlan({
          ...message,
          plan,
          candidates,
        });
        if (reviewed.allowed !== true) plan = null;
      }
      await reauthorize();
      await this.store.issue(uid, work, epoch, evidence, input, plan);
      return plan
        ? { apiVersion: 1, operationId: input.requestId, status: "ready", plan }
        : {
            apiVersion: 1,
            operationId: input.requestId,
            status: "needsClarification",
            text: question,
          };
    } catch (error) {
      await this.store.fail(uid, work).catch(() => undefined);
      throw error;
    }
  }
}
