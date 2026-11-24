import { Interpreter } from "#memory-v2/ai/interpreter";
import type { StructuredModel } from "#memory-v2/ai/contracts";
import type { Firestore } from "firebase-admin/firestore";
import { AccountError } from "../account/contracts.js";
import { V2Reader } from "./reader.js";
import { V2WorkStore, operationReply } from "./work-store.js";
import { V2MutationStore } from "./mutation-store.js";
import { presentSaved } from "./presentation.js";
import { directLocationCapture } from "./location-prototype.js";
import type { LoadedState } from "./state-store.js";
import type {
  Submit,
  Clarify,
  PendingTurn,
  WorkLease,
  V2Reply,
} from "./contracts.js";

export type ModelFactory = (epoch: number) => Promise<StructuredModel>;
export class V2Capture {
  readonly db: Firestore;
  readonly work: V2WorkStore;
  readonly now: () => number;
  private readonly locationPrototype: boolean;
  constructor(
    db: Firestore,
    now: () => number = Date.now,
    locationPrototype = false,
  ) {
    this.db = db;
    this.now = now;
    this.work = new V2WorkStore(db, now);
    this.locationPrototype = locationPrototype;
  }
  async execute(
    uid: string,
    generation: string,
    input: Submit | Clarify,
    model: ModelFactory,
    reauthorize: () => Promise<void>,
    expectedEpoch?: number,
    receivedAt?: string,
    startBefore?: number,
  ): Promise<V2Reply> {
    const turn =
      "zone" in input
        ? {
            text: input.text,
            at: receivedAt ?? new Date(this.now()).toISOString(),
            zone: input.zone,
          }
        : null;
    const pending = await this.work.begin(
      uid,
      generation,
      input.requestId,
      input,
      turn,
      "clarificationId" in input
        ? {
            id: input.clarificationId,
            revision: input.expectedRevision,
            text: input.text,
          }
        : undefined,
      startBefore,
    );
    if ("reply" in pending)
      return presentSaved(this.db, uid, generation, pending.reply);
    try {
      const lease = pending.lease;
      const requiredEpoch =
        expectedEpoch ??
        ("expectedEpoch" in input ? input.expectedEpoch : undefined);
      if (requiredEpoch !== undefined && lease.epoch !== requiredEpoch)
        throw new AccountError("failed-precondition");
      if (!lease.turn) throw new AccountError("failed-precondition");
      const reader = new V2Reader(this.db, uid, generation),
        loaded = await reader.load();
      if (loaded.state.epoch !== lease.epoch)
        throw new AccountError("failed-precondition");
      const turn = lease.turn;
      const directDraft =
        this.locationPrototype && "zone" in input
          ? directLocationCapture(loaded.state, turn.text, turn.zone)
          : null;
      const { draft, question } = directDraft
        ? { draft: directDraft, question: null }
        : await this.interpret(reader, loaded, turn, await model(lease.epoch));
      await reauthorize();
      if (!draft) return await this.finishUnstored(uid, lease, question);
      const reply = await new V2MutationStore(this.db, this.now).commit(
        uid,
        lease,
        {
          kind: "capture",
          requestId: lease.requestId,
          draft,
        },
      );
      return presentSaved(this.db, uid, generation, reply);
    } catch (error) {
      await this.work.fail(uid, pending.lease).catch(() => undefined);
      throw error;
    }
  }
  private async interpret(
    reader: V2Reader,
    loaded: LoadedState,
    turn: PendingTurn,
    provider: StructuredModel,
  ) {
    const found = await reader.candidates(
      loaded,
      provider,
      turn.text,
      turn.at,
      turn.zone,
    );
    if (found.truncated) throw new AccountError("resource-exhausted");
    const interpreted = await new Interpreter(provider).interpret(
      { ...turn, mode: "capture" },
      found.units,
      { verifyCaptureIntent: true },
    );
    return {
      draft: interpreted.draft,
      question: interpreted.proposal.question,
    };
  }
  private async finishUnstored(
    uid: string,
    lease: WorkLease,
    question: string | null,
  ) {
    const record = await this.db.runTransaction((tx) =>
      this.work.current(tx, uid, lease),
    );
    const reply: V2Reply = question
      ? {
          apiVersion: 2,
          operationId: lease.requestId,
          status: "needsClarification",
          clarificationId: lease.requestId,
          revision: record.revision + 1,
          question,
        }
      : operationReply(lease.requestId, "ignored");
    await this.work.finish(
      uid,
      lease,
      question ? "clarification" : "ignored",
      reply,
      question ?? undefined,
    );
    return reply;
  }
}
