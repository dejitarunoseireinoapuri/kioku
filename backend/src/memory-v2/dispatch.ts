import type { Firestore } from "firebase-admin/firestore";
import { routingPlan } from "../conversation/contracts.js";
import { V2Capture, type ModelFactory } from "./capture.js";
import { querySchema, submitSchema, type V2Reply } from "./contracts.js";
import { queryV2 } from "./query.js";
import type { Route } from "./route-contracts.js";
import { routeV2 } from "./route.js";

export async function dispatchTurn(
  db: Firestore,
  uid: string,
  generation: string,
  { executionId, ...turn }: Route & { executionId?: string | undefined },
  model: ModelFactory,
  reauthorize: () => Promise<void>,
  directLocations: boolean,
): Promise<V2Reply> {
  const routed = await routeV2(
    db,
    uid,
    generation,
    turn,
    model,
    reauthorize,
    executionId,
  );
  if (!executionId || routed.status !== "ready") return routed;
  const plan = routingPlan.parse(routed.plan);
  if (plan.action !== "ask" && plan.action !== "tell") return routed;
  const base = {
    apiVersion: 2 as const,
    requestId: executionId,
    zone: turn.zone,
  };
  let result: V2Reply;
  if (plan.action === "tell") {
    result = await new V2Capture(db, undefined, directLocations).execute(
      uid,
      generation,
      submitSchema.parse({
        ...base,
        mode: "tell",
        channel: "text",
        text: turn.text,
        expectedEpoch: plan.memoryEpoch,
      }),
      model,
      reauthorize,
      undefined,
      plan.receivedAt,
      plan.expiresAtMs,
    );
  } else {
    const questions =
      turn.memoryEpoch === plan.memoryEpoch ? turn.context.questions : [];
    const text = questions.length
      ? JSON.stringify({
          pregunta_actual: turn.text,
          ...(plan.memoryEpoch ? { memory_revision: plan.memoryEpoch } : {}),
          preguntas_anteriores_solo_contexto: questions,
        })
      : turn.text;
    result = await queryV2(
      db,
      uid,
      generation,
      querySchema.parse({ ...base, text }),
      model,
      reauthorize,
      directLocations,
    );
  }
  return { ...routed, result };
}
