import { z } from "zod";
import { extractionSchema, MemoryError } from "./domain.ts";
import type { Candidate, MemoryIntelligence, Turn, Source } from "./domain.ts";
import { Budget, rates } from "./budget.ts";
import {
  extractionInstructions,
  answerInstructions,
  verificationInstructions,
} from "./prompts.ts";
import {
  providerProposalSchema,
  attachSelectedMemories,
  verificationSchema,
  validateProposal,
  constrainAnswer,
  normalizeAnswerStatus,
  verifiedAnswer,
} from "./answer-guard.ts";

const responseSchema = z.object({
  status: z.string(),
  output: z.array(
    z.object({
      type: z.string(),
      content: z
        .array(z.object({ type: z.string(), text: z.string().optional() }))
        .optional(),
    }),
  ),
  usage: z.object({
    input_tokens: z.number().int().nonnegative(),
    output_tokens: z.number().int().nonnegative(),
  }),
});
const embeddingsSchema = z.object({
  data: z.array(
    z.object({
      index: z.number().int(),
      embedding: z.array(z.number().finite()).length(512),
    }),
  ),
  usage: z.object({ prompt_tokens: z.number().int().nonnegative() }),
});
export const model = "gpt-5.4-mini-2026-03-17";
export const embeddingModel = "text-embedding-3-small";

export class OpenAiMemory implements MemoryIntelligence {
  lastCheck: { supported: boolean; problem: string; status: string } | null =
    null;
  readonly #key: string;
  readonly budget: Budget;
  readonly transport: typeof fetch;

  constructor(key: string, budget: Budget, transport: typeof fetch = fetch) {
    if (!/^sk-[A-Za-z0-9_-]+$/.test(key))
      throw new MemoryError("KEY_MISSING_OR_INVALID");
    this.#key = key;
    this.budget = budget;
    this.transport = transport;
  }

  extract(turn: Turn, clarification: string | null) {
    return this.structured(
      extractionInstructions,
      { ...turn, clarification },
      extractionSchema,
      "memory_extraction",
    );
  }

  async answer(
    question: string,
    at: string,
    candidates: Candidate[],
    sources: Source[] = [],
  ) {
    this.lastCheck = null;
    const evidence = candidates.map(({ memory }) => ({
      sourceId: memory.sourceId,
      text: memory.text,
      quote: memory.quote,
      kind: memory.kind,
      entities: memory.entities,
      id: memory.id,
      time: memory.time,
      provenance: memory.provenance,
      attribution: memory.attribution,
      lifecycle: memory.lifecycle,
      receivedAt: memory.receivedAt,
      zone: memory.zone,
    }));
    const generated = normalizeAnswerStatus(
      await this.structured(
        answerInstructions,
        { question, at, candidates: evidence, sources },
        providerProposalSchema,
        "memory_answer",
      ),
    );
    const proposal = attachSelectedMemories(generated, candidates);
    const answer = validateProposal(proposal, candidates);
    const constrained = constrainAnswer(
      proposal,
      candidates,
      sources,
      question,
    );
    if (constrained) {
      this.lastCheck = {
        supported: constrained.status === "answered",
        problem: "deterministic_scope_guard",
        status: constrained.status,
      };
      return constrained;
    }
    const verified = await this.structured(
      verificationInstructions,
      {
        question,
        at,
        proposal: answer,
        sources: sources.filter((source) =>
          answer.sourceIds.includes(source.id),
        ),
        candidates: evidence,
      },
      verificationSchema,
      "memory_verification",
      "low",
      1000,
    );
    this.lastCheck = verified;
    return verifiedAnswer(answer, verified);
  }

  async embed(texts: string[]): Promise<number[][]> {
    if (
      !texts.length ||
      texts.length > 80 ||
      texts.some((text) => !text || text.length > 8000)
    ) {
      throw new MemoryError("EMBEDDING_INPUT_INVALID");
    }
    const inputBytes = Buffer.byteLength(JSON.stringify(texts));
    const reservation = inputBytes * rates.embedding;
    await this.budget.reserve(reservation);
    const raw = await this.post("embeddings", {
      model: embeddingModel,
      input: texts,
      dimensions: 512,
    });
    const parsed = embeddingsSchema.safeParse(raw);
    if (!parsed.success)
      throw new MemoryError("EMBEDDING_RESPONSE_SCHEMA_INVALID");
    const result = parsed.data;
    const sorted = [...result.data].sort((a, b) => a.index - b.index);
    if (
      sorted.length !== texts.length ||
      sorted.some((item, index) => item.index !== index)
    ) {
      throw new MemoryError("EMBEDDING_COUNT");
    }
    await this.budget.settle(reservation, result.usage.prompt_tokens, 0, true);
    return sorted.map((item) => item.embedding);
  }

  private async structured<T>(
    instructions: string,
    data: unknown,
    schema: z.ZodType<T>,
    name: string,
    effort: "none" | "low" = "low",
    maxOutput = 2400,
  ): Promise<T> {
    const input = JSON.stringify(data);
    if (input.length > 48_000) throw new MemoryError("MODEL_INPUT_LIMIT");
    const body = {
      model,
      instructions,
      input,
      store: false,
      max_output_tokens: maxOutput,
      reasoning: { effort },
      text: {
        format: {
          type: "json_schema",
          name,
          strict: true,
          schema: z.toJSONSchema(schema),
        },
      },
    };
    const reservation =
      (Buffer.byteLength(JSON.stringify(body)) + 2048) * rates.input +
      maxOutput * rates.output;
    await this.budget.reserve(reservation);
    const parsed = responseSchema.safeParse(await this.post("responses", body));
    if (!parsed.success) {
      const fields = parsed.error.issues.map((issue) =>
        issue.path
          .filter(
            (part) =>
              typeof part === "string" &&
              [
                "status",
                "output",
                "content",
                "text",
                "usage",
                "input_tokens",
                "output_tokens",
              ].includes(part),
          )
          .join("_"),
      );
      throw new MemoryError(
        `PROVIDER_SCHEMA_INVALID_${[...new Set(fields)].join("_").slice(0, 100)}`,
      );
    }
    const response = parsed.data;
    await this.budget.settle(
      reservation,
      response.usage.input_tokens,
      response.usage.output_tokens,
      false,
    );
    if (response.status !== "completed")
      throw new MemoryError("MODEL_INCOMPLETE");
    const content = response.output.flatMap((item) => item.content ?? []);
    if (content.some((item) => item.type === "refusal"))
      throw new MemoryError("MODEL_REFUSAL");
    const text = content
      .filter((item) => item.type === "output_text")
      .map((item) => item.text ?? "")
      .join("");
    try {
      return schema.parse(JSON.parse(text));
    } catch {
      throw new MemoryError("MODEL_OUTPUT_INVALID");
    }
  }

  private async post(
    endpoint: "responses" | "embeddings",
    body: unknown,
  ): Promise<unknown> {
    try {
      const response = await this.transport(
        `https://api.openai.com/v1/${endpoint}`,
        {
          method: "POST",
          redirect: "error",
          signal: AbortSignal.timeout(45_000),
          headers: {
            Authorization: `Bearer ${this.#key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        },
      );
      if (!response.ok) {
        await response.body?.cancel();
        throw new MemoryError(`OPENAI_HTTP_${response.status}`);
      }
      const text = await response.text();
      if (text.length > 2_000_000)
        throw new MemoryError("PROVIDER_RESPONSE_LIMIT");
      return JSON.parse(text) as unknown;
    } catch (error) {
      if (error instanceof MemoryError) throw error;
      throw new MemoryError("OPENAI_NETWORK_OR_RESPONSE");
    }
  }
}
