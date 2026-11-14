import { randomUUID } from "node:crypto";
import type {
  RoutingInput,
  RoutingIntelligence,
} from "../../src/conversation/contracts.js";
import type {
  MessageIntent,
  TargetSelection,
} from "#memory-core/conversation-format";
import { vector } from "./retirement-fixtures.js";

export const turn = (
  text: string,
  mode: "ask" | "tell" = "ask",
): RoutingInput => ({
  apiVersion: 1,
  requestId: randomUUID(),
  mode,
  text,
  zone: "Europe/Madrid",
  memoryEpoch: 0,
  context: { questions: [], sourceIds: [] },
});

export class ConversationIntelligence implements RoutingIntelligence {
  calls = 0;
  intent: MessageIntent = {
    action: "ask",
    fact: null,
    alsoAsk: false,
    useContext: false,
    question: null,
    forgetScope: null,
  };
  selection: TargetSelection = {
    memoryIds: [],
    correction: null,
    question: "¿Qué dato?",
  };
  allowed = true;
  clarifyCapture = false;
  afterReview: () => Promise<void> = async () => {};
  async interpretMessage() {
    this.calls++;
    return this.intent;
  }
  async selectMemoryTarget() {
    this.calls++;
    return this.selection;
  }
  async reviewMessagePlan() {
    this.calls++;
    await this.afterReview();
    return { allowed: this.allowed };
  }
  async reviewSourceChange() {
    this.calls++;
    return {
      authorized: true,
      unrelatedPreserved: true,
      noRemovedDataRemains: true,
    };
  }
  async embed(texts: string[]) {
    this.calls++;
    return texts.map(vector);
  }
  async answer(): Promise<never> {
    throw new Error("Routing must not invent a memory answer");
  }
  async extract(input: { text: string }) {
    this.calls++;
    return this.clarifyCapture
      ? {
          status: "needs_clarification" as const,
          clarification: "¿Qué examen?",
          items: [],
        }
      : {
          status: "saved" as const,
          clarification: null,
          items: [
            {
              text: input.text,
              quote: input.text,
              kind: "fact" as const,
              entities: [],
              time: {
                precision: "unknown" as const,
                value: null,
                end: null,
                quote: null,
              },
              provenance: "personal" as const,
              attribution: null,
              attributionEvidence: null,
              eventStatus: "unspecified" as const,
              lifecycle: "current" as const,
            },
          ],
        };
  }
}
