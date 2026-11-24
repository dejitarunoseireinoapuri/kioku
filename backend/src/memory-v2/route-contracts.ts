import { z } from "zod";
import { routingInput, routingPlan } from "../conversation/contracts.js";
export const routeSchema = z
  .strictObject({
    ...routingInput.shape,
    apiVersion: z.literal(2),
    context: z.strictObject({
      questions: z.array(z.string().min(1).max(2000)).max(4),
      sourceIds: z.array(z.uuid()).max(32),
    }),
  })
  .refine(
    (value) =>
      (value.mode !== "ask" || value.text.length <= 2000) &&
      value.context.questions.reduce((n, t) => n + t.length, 0) <= 2000 &&
      !/sk-[A-Za-z0-9_-]{20,}/u.test(JSON.stringify(value)),
  );
export const applySchema = z.strictObject({
  apiVersion: z.literal(2),
  requestId: z.uuid(),
  turn: routeSchema,
  plan: routingPlan,
  decision: z.enum(["apply", "accept", "reject"]),
  continueManagement: z.boolean().optional(),
});
export const dispatchSchema = routeSchema
  .safeExtend({
    executionId: z.uuid().optional(),
  })
  .refine((input) => input.executionId !== input.requestId);
export type Route = z.infer<typeof routeSchema>;
export type Apply = z.infer<typeof applySchema>;
export type Plan = z.infer<typeof routingPlan>;
