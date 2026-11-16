import { z } from "zod";
import { InterpretationError } from "./contracts.ts";
import type { StructuredModel } from "./contracts.ts";

export const profile = Object.freeze({
  model: "gpt-6.1-sol",
  reasoning: "high",
  inputRate: 2.5 / 1e6,
  outputRate: 10 / 1e6,
});
export interface Meter {
  reserve(amount: number): Promise<void>;
  settle(reservation: number, input: number, output: number): Promise<void>;
}
export interface CallMetric {
  stage: string;
  milliseconds: number;
  input: number;
  output: number;
  status: string;
  model: string | null;
}
const envelope = z.object({
  status: z.string(),
  incomplete_details: z.object({ reason: z.string() }).nullable().optional(),
  model: z.string().regex(/^gpt-[A-Za-z0-9._-]+$/u),
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

export class SolProvider implements StructuredModel {
  readonly #key: string;
  readonly meter: Meter;
  readonly metric: (entry: CallMetric) => void;
  readonly transport: typeof fetch;
  resolvedModel: string | null = null;
  constructor(
    key: string,
    meter: Meter,
    metric: (entry: CallMetric) => void,
    transport: typeof fetch = fetch,
  ) {
    if (!/^sk-[A-Za-z0-9_-]+$/u.test(key))
      throw new InterpretationError("KEY_UNAVAILABLE");
    this.#key = key;
    this.meter = meter;
    this.metric = metric;
    this.transport = transport;
  }
  async call<T>(
    stage: string,
    instructions: string,
    data: unknown,
    schema: z.ZodType<T>,
    outputLimit: number,
  ): Promise<T> {
    const body = JSON.stringify({
      model: profile.model,
      reasoning: { effort: profile.reasoning },
      store: false,
      service_tier: "default",
      max_output_tokens: outputLimit,
      instructions,
      input: JSON.stringify(data),
      text: {
        verbosity: "low",
        format: {
          type: "json_schema",
          name: stage,
          strict: true,
          schema: z.toJSONSchema(schema),
        },
      },
    });
    if (body.length > 100_000 || outputLimit > 8000)
      throw new InterpretationError("PROVIDER_INPUT_LIMIT");
    const reservation =
      (Buffer.byteLength(body) + 2048) * profile.inputRate +
      outputLimit * profile.outputRate;
    await this.meter.reserve(reservation);
    const started = performance.now();
    const metric: CallMetric = {
      stage,
      milliseconds: 0,
      input: 0,
      output: 0,
      status: "transport_unknown",
      model: null,
    };
    try {
      const response = await this.transport(
        "https://api.openai.com/v1/responses",
        {
          method: "POST",
          redirect: "error",
          signal: AbortSignal.timeout(60_000),
          headers: {
            Authorization: `Bearer ${this.#key}`,
            "Content-Type": "application/json",
          },
          body,
        },
      );
      if (!response.ok) {
        await response.body?.cancel();
        throw new InterpretationError(`HTTP_${response.status}`);
      }
      const wire = await response.text();
      if (wire.length > 1_000_000)
        throw new InterpretationError("RESPONSE_LIMIT");
      const result = envelope.safeParse(JSON.parse(wire));
      if (!result.success) throw new InterpretationError("PROVIDER_SCHEMA");
      const value = result.data;
      metric.input = value.usage.input_tokens;
      metric.output = value.usage.output_tokens;
      metric.model = value.model;
      await this.meter.settle(reservation, metric.input, metric.output);
      if (this.resolvedModel !== null && this.resolvedModel !== value.model)
        throw new InterpretationError("MODEL_CHANGED");
      this.resolvedModel = value.model;
      if (value.status !== "completed")
        throw new InterpretationError(
          value.incomplete_details?.reason === "max_output_tokens"
            ? "MODEL_OUTPUT_LIMIT"
            : value.incomplete_details?.reason === "content_filter"
              ? "MODEL_CONTENT_FILTER"
              : "MODEL_INCOMPLETE",
        );
      const content = value.output.flatMap((item) => item.content ?? []);
      if (content.some((item) => item.type === "refusal"))
        throw new InterpretationError("MODEL_REFUSAL");
      const output = content
        .filter((item) => item.type === "output_text")
        .map((item) => item.text ?? "")
        .join("");
      let parsed;
      try {
        parsed = schema.safeParse(JSON.parse(output));
      } catch {
        throw new InterpretationError("MODEL_JSON");
      }
      if (!parsed.success) throw new InterpretationError("MODEL_SCHEMA");
      metric.status = "completed";
      return parsed.data;
    } catch (error) {
      metric.status =
        error instanceof InterpretationError
          ? error.code
          : "TRANSPORT_OR_RESPONSE";
      throw new InterpretationError(metric.status);
    } finally {
      metric.milliseconds = performance.now() - started;
      this.metric(metric);
    }
  }
}
