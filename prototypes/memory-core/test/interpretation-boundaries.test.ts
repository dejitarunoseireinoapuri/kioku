import test from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import { expandInterpretation } from "../ai/indexed-evidence.ts";
import type { IndexedInterpretation } from "../ai/indexed-evidence.ts";
import { Interpreter, materialize } from "../ai/interpreter.ts";
import type { Input, StructuredModel } from "../ai/contracts.ts";
import { content, unknownTime } from "../fixtures/scenarios.ts";
import { harness } from "../fixtures/harness.ts";

const input: Input = {
  text: "Quiero pintar \nquiero coser",
  at: "2026-07-14T18:00:00Z",
  zone: "Europe/Madrid",
  mode: "capture",
};
function wire(): IndexedInterpretation {
  return {
    status: "ready",
    question: null,
    preserveTime: false,
    retention: [],
    relations: [],
    units: ["pintar", "coser"].map((label, i) => ({
      key: i ? "b" : "a",
      content: content(label),
      time: unknownTime,
      existing: null,
    })),
    segments: [
      { end: 2, role: "primary", owners: ["a"] },
      { end: 3, role: "context", owners: ["a", "b"] },
      { end: 6, role: "primary", owners: ["b"] },
    ],
  };
}

test("whitespace context is losslessly represented as a separator with the same owners", () => {
  const p = expandInterpretation(wire(), input);
  assert.deepEqual(p.segments[1], {
    literal: " \n",
    role: "separator",
    owners: ["a", "b"],
  });
  assert.equal(p.segments.map((s) => s.literal).join(""), input.text);
  const h = harness(),
    saved = h.save(materialize(p, input, []));
  const neighbor = h.store.read().units[saved.refs[1]!.id]!;
  h.erase([saved.refs[0]!]);
  assert.equal(
    h.store.read().units[neighbor.id]!.content.text,
    neighbor.content.text,
  );
  assert.ok(
    Object.values(h.store.read().fragments).every(
      (f) => !f.owners.includes(saved.refs[0]!.id),
    ),
  );
});

test("whitespace conversion keeps time indices and does not authorize whitespace as date evidence", () => {
  const p = wire();
  p.units = [p.units[0]!];
  p.units[0]!.time = {
    precision: "day",
    value: "2026-07-15",
    end: null,
    fragment: 2,
  };
  p.segments[1]!.owners = ["a"];
  p.segments[2] = { end: 4, role: "time", owners: ["a"] };
  const timed = { ...input, text: "Quiero pintar \nmañana" };
  const draft = materialize(expandInterpretation(p, timed), timed, []);
  assert.equal(draft.units[0]!.time.fragment, 2);
  assert.equal(draft.text.slice(draft.fragments[2]!.start), "mañana");
  p.units[0]!.time.fragment = 1;
  assert.throws(() => materialize(expandInterpretation(p, timed), timed, []));
});

test("layout normalization cannot hide empty primary, semantic separators or missing owners", () => {
  for (const role of ["primary", "time", "replaced"] as const) {
    const p = wire();
    p.segments[1] = { end: 3, role, owners: role === "replaced" ? [] : ["a"] };
    assert.throws(() => materialize(expandInterpretation(p, input), input, []));
  }
  const p = wire();
  p.segments[0]!.role = "separator";
  assert.throws(() => materialize(expandInterpretation(p, input), input, []));
  p.segments[0]!.role = "context";
  assert.equal(expandInterpretation(p, input).segments[0]!.role, "context");
  p.segments[1]!.owners = ["unknown"];
  assert.throws(() => materialize(expandInterpretation(p, input), input, []));
});

test("review sees normalized evidence; clarify still requires approval and cannot save partial facts", async () => {
  let observed = false;
  const model: StructuredModel = {
    async call<T>(
      stage: string,
      _instructions: string,
      data: unknown,
      schema: z.ZodType<T>,
    ) {
      if (stage === "interpret") return schema.parse(wire());
      const p = z
        .object({
          proposal: z.object({
            segments: z.array(z.object({ role: z.string() })),
          }),
        })
        .parse(data);
      assert.equal(p.proposal.segments[1]!.role, "separator");
      observed = true;
      return schema.parse({ accepted: true, issues: [] });
    },
  };
  assert.ok((await new Interpreter(model).interpret(input, [])).draft);
  assert.ok(observed);
  for (const accepted of [true, false]) {
    const clarification: StructuredModel = {
      async call<T>(
        stage: string,
        _instructions: string,
        _data: unknown,
        schema: z.ZodType<T>,
      ) {
        return schema.parse(
          stage === "interpret"
            ? {
                ...wire(),
                status: "clarify",
                question: "¿A qué te refieres?",
                units: [],
                segments: [],
              }
            : { accepted, issues: accepted ? [] : ["clarification"] },
        );
      },
    };
    const action = new Interpreter(clarification).interpret(input, []);
    if (accepted) assert.equal((await action).draft, null);
    else await assert.rejects(action, { message: "REVIEW_clarification" });
  }
});
