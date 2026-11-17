import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { unanchoredQuestion } from "../../src/memory-v2/intent-clarification.js";
import type { Route } from "../../src/memory-v2/route-contracts.js";

const turn = (text: string): Route => ({
  apiVersion: 2,
  requestId: randomUUID(),
  mode: "ask",
  text,
  zone: "UTC",
  memoryEpoch: 3,
  context: { questions: [], sourceIds: [] },
});

test("standalone unanchored follow-ups ask for the topic without inventing one", () => {
  for (const text of [
    "¿Y ahora?",
    " Y AHORA... ",
    "¿Y entonces?",
    "¿Y después?",
    "¿Y eso?",
  ])
    assert.equal(
      unanchoredQuestion(turn(text), 3),
      "¿Sobre qué quieres preguntar ahora?",
    );
});

test("current context, complete questions, owner clarification and telling are not blocked", () => {
  for (const text of [
    "¿Qué quiero hacer?",
    "¿Qué planes tengo ahora?",
    "¿Y ahora qué planes tengo?",
    "¿Y ahora?\nAclaración: Qué planes tengo pendientes.",
    "¿Quién dijo ‘y ahora’?",
    "Ahora quiero ir al cine.",
  ])
    assert.equal(unanchoredQuestion(turn(text), 3), null);
  assert.equal(
    unanchoredQuestion({ ...turn("¿Y ahora?"), mode: "tell" }, 3),
    null,
  );
  assert.equal(
    unanchoredQuestion(
      {
        ...turn("¿Y ahora?"),
        context: {
          questions: ["¿Qué planes tengo?"],
          sourceIds: [],
        },
      },
      3,
    ),
    null,
  );
  assert.equal(
    unanchoredQuestion(
      {
        ...turn("¿Y ahora?"),
        context: {
          questions: [],
          sourceIds: [randomUUID()],
        },
      },
      3,
    ),
    null,
  );
});

test("stale context cannot supply an antecedent after a memory change", () => {
  assert.notEqual(
    unanchoredQuestion(
      {
        ...turn("¿Y ahora?"),
        context: {
          questions: ["¿Qué planes tengo?"],
          sourceIds: [randomUUID()],
        },
      },
      4,
    ),
    null,
  );
});
