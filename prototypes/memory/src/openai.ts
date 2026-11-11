import { z } from "zod";
import { extractionSchema, answerSchema, MemoryError } from "./domain.ts";
import type { Candidate, MemoryIntelligence, Turn } from "./domain.ts";
import { Budget, rates } from "./budget.ts";
import { extractionInstructions, answerInstructions } from "./prompts.ts";

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

  answer(question: string, at: string, candidates: Candidate[]) {
    const evidence = candidates.map(({ memory }) => ({
      sourceId: memory.sourceId,
      text: memory.text,
      quote: memory.quote,
      kind: memory.kind,
      entities: memory.entities,
      occurredOn: memory.occurredOn,
      receivedAt: memory.receivedAt,
      zone: memory.zone,
    }));
    return this.structured(
      answerInstructions,
      { question, at, candidates: evidence },
      answerSchema,
      "memory_answer",
    );
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
    const result = embeddingsSchema.parse(raw);
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
  ): Promise<T> {
    const input = JSON.stringify(data);
    if (input.length > 32_000) throw new MemoryError("MODEL_INPUT_LIMIT");
    const body = {
      model,
      instructions,
      input,
      store: false,
      max_output_tokens: 2400,
      reasoning: { effort: "none" },
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
      2400 * rates.output;
    await this.budget.reserve(reservation);
    const response = responseSchema.parse(await this.post("responses", body));
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
