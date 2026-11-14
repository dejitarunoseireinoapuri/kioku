import { AccountError } from "../account/contracts.js";
import { captureInput, parseInput } from "../memory/contracts.js";
import { changeInput } from "../memory-control/contracts.js";
import { CaptureMemory } from "../memory/capture.js";
import { ChangeMemory } from "../memory-control/change.js";
import type { CaptureStore } from "../memory/contracts.js";
import type { SourceControlStore } from "../memory-control/contracts.js";
import type {
  DecisionInput,
  RoutingIntelligence,
  RoutingStore,
} from "./contracts.js";

export class ApplyMessage {
  private readonly store: RoutingStore;
  private readonly sources: SourceControlStore;
  private readonly captures: (epoch: number, at: string) => CaptureStore;
  constructor(
    store: RoutingStore,
    sources: SourceControlStore,
    captures: (epoch: number, at: string) => CaptureStore,
  ) {
    this.store = store;
    this.sources = sources;
    this.captures = captures;
  }

  async execute(
    uid: string,
    input: DecisionInput,
    provider: () => Promise<RoutingIntelligence>,
    reauthorize: () => Promise<void>,
  ) {
    if (!(await this.store.bind(uid, input)))
      return {
        apiVersion: 1,
        operationId: input.requestId,
        status: "declined",
      };
    const plan = input.plan;
    if (plan.action === "correct" || plan.action === "forget") {
      const command = parseInput(changeInput, {
        apiVersion: 1,
        requestId: input.requestId,
        sourceId: plan.sourceId,
        expectedVersion: plan.expectedVersion,
        memoryIds: plan.memoryIds,
        action: plan.action,
        correction: plan.correction,
        zone: input.turn.zone,
        ...(plan.action === "forget" && plan.forgetScope
          ? { forgetScope: plan.forgetScope }
          : {}),
      });
      return new ChangeMemory(this.sources, () =>
        Date.parse(plan.receivedAt),
      ).execute(uid, command, provider, reauthorize);
    }
    if (plan.action !== "offer") throw new AccountError("invalid-argument");
    const store = this.captures(plan.memoryEpoch, plan.receivedAt);
    const command = parseInput(captureInput, {
      apiVersion: 1,
      requestId: input.requestId,
      mode: "tell",
      channel: "text",
      text: plan.fact,
      zone: input.turn.zone,
    });
    const result = await new CaptureMemory(store).execute(
      uid,
      command,
      provider,
      reauthorize,
    );
    return result.status === "saved"
      ? { ...result, source: await store.source(uid, result.sourceId) }
      : result;
  }
}
