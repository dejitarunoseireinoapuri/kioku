import { MemoryEngine } from "#memory-core/engine";
import { answerSchema } from "#memory-core/domain";
import type { MemoryIntelligence } from "#memory-core/domain";
import { AccountError } from "../account/contracts.js";
import type { QueryInput, QueryResult, QueryStore } from "./contracts.js";

/** Questions and generated answers live only in this request and the mobile session. */
export class QueryMemory {
  private readonly store: QueryStore;
  private readonly now: () => number;
  constructor(store: QueryStore, now = Date.now) {
    this.store = store;
    this.now = now;
  }

  async execute(
    uid: string,
    input: QueryInput,
    provider: () => Promise<MemoryIntelligence>,
    reauthorize: () => Promise<void>,
  ): Promise<QueryResult> {
    const work = await this.store.begin(uid, input);
    if ("status" in work) return work;
    try {
      const intelligence = await provider();
      const vector = (await intelligence.embed([input.text]))[0];
      if (!vector || vector.length !== 512 || !vector.every(Number.isFinite))
        throw new AccountError("unavailable");
      const evidence = await this.store.retrieve(uid, input.text, vector);
      const engine = new MemoryEngine(
        {
          load: async () => evidence.snapshot,
          save: async () => {
            throw new AccountError("permission-denied");
          },
        },
        {
          extract: (...args) => intelligence.extract(...args),
          embed: async () => [vector],
          answer: (...args) => intelligence.answer(...args),
        },
      );
      const answer = evidence.snapshot.memories.length
        ? answerSchema.parse(
            (await engine.ask(input.text, new Date(this.now()).toISOString()))
              .answer,
          )
        : {
            status: "not_found" as const,
            answer: "No tengo ningún recuerdo guardado sobre eso.",
            sourceIds: [],
          };
      const sources = [...new Set(answer.sourceIds)].map((id) => {
        const source = evidence.snapshot.sources.find((item) => item.id === id);
        if (!source) throw new AccountError("failed-precondition");
        return { sourceId: id, receivedAt: source.receivedAt };
      });
      await reauthorize();
      await this.store.finish(uid, work, evidence);
      return {
        apiVersion: 1,
        operationId: input.requestId,
        status:
          answer.status === "answered"
            ? "answered"
            : answer.status === "not_found"
              ? "notFound"
              : "needsClarification",
        text: answer.answer,
        sources,
      };
    } catch (error) {
      await this.store.fail(uid, work).catch(() => undefined);
      throw error;
    }
  }
}
