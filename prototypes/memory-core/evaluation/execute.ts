import { harness } from "../fixtures/harness.ts";
import type { Unit } from "../src/model.ts";
import { Interpreter } from "../ai/interpreter.ts";
import { query } from "../ai/query.ts";
import { InterpretationError, interpretationSchema } from "../ai/contracts.ts";
import type { Input, StructuredModel } from "../ai/contracts.ts";
import type { Scenario, GoldQuery } from "./case.ts";
import { gradeUnits, gradeAnswer } from "./grade.ts";
import type { Check } from "./grade.ts";
import { CoreError } from "../src/errors.ts";
import { z } from "zod";

export interface CaseResult {
  id: string;
  family: string;
  checks: Check[];
  error: string | null;
  milliseconds: number;
  stages: Record<string, number>;
  queryCount: number;
  observations: {
    stage: string;
    status: string;
    evidenceCount?: number;
    unitCount?: number;
    kinds?: string[];
  }[];
}
function unchangedMeaning(before: Unit, after: Unit | undefined) {
  if (!after) return false;
  const { membershipRevision: ignoredBefore, ...a } = before;
  const { membershipRevision: ignoredAfter, ...b } = after;
  void ignoredBefore;
  void ignoredAfter;
  return JSON.stringify(a) === JSON.stringify(b);
}
export async function executeCase(
  provider: StructuredModel,
  fixture: Scenario,
): Promise<CaseResult> {
  const started = performance.now();
  const result: CaseResult = {
    id: fixture.id,
    family: fixture.family,
    checks: [],
    error: null,
    milliseconds: 0,
    stages: {},
    queryCount: 0,
    observations: [],
  };
  const model: StructuredModel = {
    async call<T>(
      stage: string,
      instructions: string,
      data: unknown,
      schema: z.ZodType<T>,
      outputLimit: number,
    ): Promise<T> {
      const value = await provider.call(
        stage,
        instructions,
        data,
        schema,
        outputLimit,
      );
      if (stage === "interpret") {
        const p = interpretationSchema.parse(value);
        result.observations.push({
          stage,
          status: p.status,
          unitCount: p.units.length,
          kinds: p.units.map((u) => u.content.kind),
        });
      }
      return value;
    },
  };
  const h = harness();
  h.advance(Date.parse(fixture.at) - h.runtime.now());
  const interpreter = new Interpreter(model);
  let mapping = new Map<string, Unit>();
  let expected = structuredClone(fixture.units);
  const record = (prefix: string, checks: Check[]) =>
    result.checks.push(
      ...checks.map((c) => ({ ...c, name: `${prefix}:${c.name}` })),
    );
  async function timed<T>(name: string, action: () => Promise<T>) {
    const at = performance.now();
    try {
      return await action();
    } finally {
      result.stages[name] = performance.now() - at;
    }
  }
  function inspect(prefix: string) {
    const grade = gradeUnits(h.store.read(), expected);
    mapping = grade.mapping;
    record(prefix, grade.checks);
  }
  async function queries(prefix: string, questions: GoldQuery[]) {
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]!;
      const answer = await timed(`${prefix}${i}`, () =>
        query(model, h, q.text, fixture.at, fixture.zone, q.previous),
      );
      result.queryCount++;
      result.observations.push({
        stage: `${prefix}${i}`,
        status: answer.status,
        evidenceCount: answer.ids.length,
      });
      record(`${prefix}${i}`, gradeAnswer(answer, q, mapping));
    }
  }
  try {
    const input: Input = {
      text: fixture.text,
      at: fixture.at,
      zone: fixture.zone,
      mode: "capture",
    };
    let capture = await timed("capture", () =>
      interpreter.interpret(input, []),
    );
    record("initial", [
      {
        name: "intent",
        passed: capture.proposal.status === fixture.status,
        critical:
          fixture.status !== "ready" && capture.proposal.status === "ready",
      },
    ]);
    if (
      fixture.status === "clarify" &&
      capture.proposal.status === "clarify" &&
      fixture.clarification
    ) {
      capture = await timed("clarification", () =>
        interpreter.interpret(
          {
            ...input,
            text: `${fixture.text}\n${fixture.clarification}`,
            clarification: {
              original: fixture.text,
              question: capture.proposal.question!,
            },
          },
          [],
        ),
      );
      record("clarification", [
        {
          name: "resolved_once",
          passed: capture.proposal.status === "ready",
          critical: false,
        },
      ]);
    }
    if (capture.draft) h.save(capture.draft);
    inspect("capture");
    if (fixture.repeat) {
      const before = Object.keys(h.store.read().units);
      const repeat = await timed("repeat", () =>
        interpreter.interpret(
          { ...input, text: fixture.repeat!.text },
          Object.values(h.store.read().units),
        ),
      );
      if (!repeat.draft) throw new InterpretationError("REPEAT_NOT_READY");
      h.save(repeat.draft);
      record("repeat", [
        {
          name: "count",
          passed:
            Object.keys(h.store.read().units).length === fixture.repeat.count,
          critical: false,
        },
        {
          name: "identity_retained",
          passed: before.every((id) => Boolean(h.store.read().units[id])),
          critical: true,
        },
      ]);
      inspect("repeat");
    }
    await queries("query", fixture.queries);
    if (fixture.correction) {
      const edit = fixture.correction,
        target = mapping.get(edit.label);
      if (!target) throw new InterpretationError("EXPECTED_TARGET_MISSING");
      const before = h.store.read();
      const correction = await timed("correction", () =>
        interpreter.interpret(
          {
            ...input,
            text: edit.text,
            mode: "correction",
            target,
            evidence: Object.values(before.fragments)
              .filter((f) => f.owners.includes(target.id))
              .map((fragment) => ({
                fragment,
                source: before.sources[fragment.sourceId]!,
              })),
          },
          [],
        ),
      );
      if (!correction.draft)
        throw new InterpretationError("CORRECTION_NOT_READY");
      const plan = h.prepare({
        kind: "correct",
        requestId: h.runtime.id(),
        target: { id: target.id, revision: target.revision },
        preserveTime: correction.proposal.preserveTime,
        retainedEvidence: correction.retainedEvidence,
        draft: correction.draft,
      });
      h.engine.commit(h.owner, plan.id);
      expected = expected.map((u) =>
        u.label === edit.label ? edit.expected : u,
      );
      inspect("corrected");
      record("correction", [
        {
          name: "neighbors_preserved",
          passed: Object.values(before.units)
            .filter((u) => u.id !== target.id)
            .every((u) => unchangedMeaning(u, h.store.read().units[u.id])),
          critical: true,
        },
      ]);
      await queries("corrected_query", [edit.query]);
    }
    const beforeForget = h.store.read();
    const targets = fixture.forget.map((label) => mapping.get(label));
    if (targets.some((u) => !u))
      throw new InterpretationError("EXPECTED_TARGET_MISSING");
    if (targets.length) {
      const start = performance.now();
      h.erase(targets.map((u) => ({ id: u!.id, revision: u!.revision })));
      result.stages.forget = performance.now() - start;
      const ids = targets.map((u) => u!.id);
      record("forget", [
        {
          name: "neighbors_preserved",
          passed: Object.values(beforeForget.units)
            .filter((u) => !ids.includes(u.id))
            .every((u) => unchangedMeaning(u, h.store.read().units[u.id])),
          critical: true,
        },
        {
          name: "targets_absent",
          passed: ids.every(
            (id) =>
              !h.store.read().units[id] &&
              !h.store.read().projections[id] &&
              !Object.values(h.store.read().fragments).some((f) =>
                f.owners.includes(id),
              ),
          ),
          critical: true,
        },
      ]);
      expected = expected.filter((u) => !fixture.forget.includes(u.label));
      inspect("remaining");
    }
    await queries("after", fixture.after);
  } catch (error) {
    result.error =
      error instanceof InterpretationError
        ? error.code
        : error instanceof CoreError
          ? error.message
          : error instanceof z.ZodError
            ? "EVALUATION_SCHEMA"
            : error instanceof TypeError
              ? "EVALUATION_TYPE"
              : "EVALUATION_INTERNAL";
    result.checks.push({
      name: "completed_lifecycle",
      passed: false,
      critical: false,
    });
  }
  result.milliseconds = performance.now() - started;
  return result;
}
