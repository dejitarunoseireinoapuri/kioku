import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { Budget } from "../src/budget.ts";
import { OpenAiMemory } from "../src/openai.ts";
import { openRuntime } from "../src/runtime.ts";
import { unknownTime } from "../src/temporal.ts";
import type { Candidate, Source } from "../src/domain.ts";
import { modelProfile } from "../src/model-config.ts";

async function fixture(maximum = 0.1) {
  await mkdir("local-data/m0/tests", { recursive: true });
  const directory = await mkdtemp("local-data/m0/tests/provider-");
  return {
    directory,
    budget: new Budget(`${directory}/budget.json`, maximum),
    async close() {
      await rm(directory, { recursive: true, force: true });
    },
  };
}

test("budget reservations survive timeouts and reload; exhaustion blocks before the next call", async () => {
  const f = await fixture();
  try {
    await f.budget.reserve(0.08);
    const reopened = new Budget(`${f.directory}/budget.json`, 0.1);
    await reopened.open();
    assert.equal(reopened.ledger.reservedUsd, 0.08);
    await assert.rejects(reopened.reserve(0.03), /BUDGET_EXHAUSTED/);
    assert.equal(reopened.ledger.calls, 1);
  } finally {
    await f.close();
  }
});

test("adding usage meters preserves the legacy accumulated budget and reservations", async () => {
  const f = await fixture();
  try {
    await writeFile(
      `${f.directory}/budget.json`,
      JSON.stringify({
        spentUsd: 1.8,
        reservedUsd: 0.04,
        inputTokens: 100,
        outputTokens: 20,
        calls: 10,
      }),
    );
    const budget = new Budget(`${f.directory}/budget.json`, 5);
    await budget.open();
    assert.equal(budget.ledger.spentUsd, 1.8);
    assert.equal(budget.ledger.reservedUsd, 0.04);
    assert.equal(budget.ledger.inputTokens, 100);
    assert.equal(budget.ledger.generationInputTokens, 0);
    await budget.settle(0.04, 10, 2, false);
    const reopened = new Budget(`${f.directory}/budget.json`, 5);
    await reopened.open();
    assert.equal(reopened.ledger.inputTokens, 110);
    assert.equal(reopened.ledger.generationInputTokens, 10);
    assert.ok(reopened.ledger.spentUsd > 1.8);
    await assert.rejects(reopened.reserve(6), /BUDGET_EXHAUSTED/);
    assert.equal(reopened.ledger.calls, 10);
  } finally {
    await f.close();
  }
});

test("provider errors are redacted and do not trigger hidden retries", async () => {
  const f = await fixture();
  try {
    let calls = 0;
    const transport: typeof fetch = async () => {
      calls++;
      return new Response("sensitive synthetic provider content", {
        status: 401,
      });
    };
    const provider = new OpenAiMemory(
      "sk-synthetic-test-only",
      f.budget,
      transport,
    );
    await assert.rejects(provider.embed(["synthetic"]), {
      message: "OPENAI_HTTP_401",
    });
    assert.equal(calls, 1);
    assert.ok(f.budget.ledger.reservedUsd > 0);
  } finally {
    await f.close();
  }
});

test("outbound provider uses fixed TLS endpoint, refuses redirects and disables Responses storage", async () => {
  const f = await fixture();
  try {
    const transport: typeof fetch = async (url, options) => {
      assert.equal(url, "https://api.openai.com/v1/responses");
      assert.equal(options?.redirect, "error");
      const body = JSON.parse(String(options?.body)) as Record<string, unknown>;
      assert.equal(body.store, false);
      assert.deepEqual(body.reasoning, { effort: modelProfile.reasoning });
      assert.equal(
        (body.text as { verbosity: string }).verbosity,
        modelProfile.verbosity,
      );
      assert.equal("tools" in body, false);
      assert.equal("previous_response_id" in body, false);
      const format = body.text as { format: { name: string } };
      return Response.json({
        status: "completed",
        output: [
          {
            type: "message",
            content: [
              {
                type: "output_text",
                text: JSON.stringify(
                  format.format.name === "memory_verification"
                    ? {
                        supported: true,
                        problem: "none",
                        status: "not_found",
                        scope: "memory",
                      }
                    : {
                        status: "not_found",
                        answer: "No consta.",
                        evidenceIds: [],
                        scope: "memory",
                      },
                ),
              },
            ],
          },
        ],
        usage: { input_tokens: 12, output_tokens: 10 },
      });
    };
    const provider = new OpenAiMemory(
      "sk-synthetic-test-only",
      f.budget,
      transport,
    );
    assert.equal(
      (await provider.answer("synthetic", "2026-11-11", [])).status,
      "not_found",
    );
  } finally {
    await f.close();
  }
});

test("live access always requires an explicit flag", async () => {
  await assert.rejects(openRuntime(false), /LIVE_FLAG_REQUIRED/);
});

test("verification repairs only the state of a faithful abstention and preserves its useful source", async () => {
  const f = await fixture();
  try {
    let calls = 0;
    const source: Source = {
      id: "plan",
      text: "Quiero llamar a Nora. Aclaración: mi prima Nora.",
      receivedAt: "2026-11-12T10:00:00Z",
      zone: "Europe/Madrid",
    };
    const candidates: Candidate[] = [
      {
        score: 1,
        memory: {
          ...source,
          id: "plan-1",
          sourceId: "plan",
          revision: 1,
          text: "Quiero llamar a mi prima Nora.",
          quote: "Quiero llamar a Nora.",
          kind: "intention",
          entities: ["Nora, prima"],
          time: unknownTime,
          provenance: "personal",
          attribution: null,
          attributionEvidence: null,
          eventStatus: "unspecified",
          lifecycle: "current",
          vector: [1],
        },
      },
    ];
    const transport: typeof fetch = async (_url, options) => {
      calls++;
      const body = JSON.parse(String(options?.body)) as {
        input: string;
        text: { format: { name: string } };
      };
      assert.match(body.input, /Aclaración: mi prima Nora/u);
      const payload =
        body.text.format.name === "memory_verification"
          ? {
              supported: true,
              problem: "none",
              status: "not_found",
              scope: "memory",
            }
          : {
              status: "answered",
              answer: "No consta que llamaras; solo querías llamar a Nora.",
              evidenceIds: ["plan-1"],
              scope: "memory",
            };
      return Response.json({
        status: "completed",
        output: [
          {
            type: "message",
            content: [
              {
                type: "output_text",
                text: JSON.stringify(payload),
              },
            ],
          },
        ],
        usage: { input_tokens: 20, output_tokens: 20 },
      });
    };
    const provider = new OpenAiMemory(
      "sk-synthetic-test-only",
      f.budget,
      transport,
    );
    const answer = await provider.answer(
      "¿Llamé a Nora?",
      "2026-11-12",
      candidates,
      [source],
    );
    assert.equal(calls, 2);
    assert.equal(answer.status, "not_found");
    assert.deepEqual(answer.sourceIds, ["plan"]);
    assert.match(answer.answer, /solo querías llamar/u);
  } finally {
    await f.close();
  }
});

for (const quoted of [false, true])
  test(
    quoted
      ? "legitimate quote questions use semantic verification and return the exact literal"
      : "a liking cannot become a favorite when the verifier rejects that unsupported comparison",
    async () => {
      const f = await fixture(0.5);
      let calls = 0;
      try {
        const text = quoted
          ? "En un prospecto leí: responde 887766."
          : "Me gusta el ramen.";
        const candidates: Candidate[] = [
          {
            score: 1,
            memory: {
              id: "x-1",
              sourceId: "x",
              revision: 1,
              receivedAt: "2026-11-12T10:00:00Z",
              zone: "Europe/Madrid",
              text,
              quote: text,
              kind: "fact",
              provenance: quoted ? "quoted" : "personal",
              attribution: quoted ? "prospecto" : null,
              attributionEvidence: quoted ? text : null,
              eventStatus: "unspecified",
              lifecycle: "current",
              time: unknownTime,
              entities: [],
              vector: [1],
            },
          },
        ];
        const transport: typeof fetch = async (_url, options) => {
          calls++;
          const b = JSON.parse(String(options?.body));
          const verification = b.text.format.name === "memory_verification";
          if (verification) {
            const data = JSON.parse(b.input);
            assert.deepEqual(data.selectedEvidenceIds, ["x-1"]);
            assert.equal(data.sources[0].text, text);
          }
          const payload = verification
            ? {
                supported: quoted,
                status: quoted ? "answered" : "not_found",
                scope: quoted ? "quotation" : "memory",
                problem: quoted ? "none" : "unsupported_claim",
              }
            : {
                status: "answered",
                answer: quoted
                  ? "El prospecto decía 887766."
                  : "Tu comida favorita es el ramen.",
                scope: quoted ? "quotation" : "memory",
                evidenceIds: ["x-1"],
              };
          return Response.json({
            status: "completed",
            output: [
              {
                type: "message",
                content: [
                  { type: "output_text", text: JSON.stringify(payload) },
                ],
              },
            ],
            usage: { input_tokens: 20, output_tokens: 20 },
          });
        };
        const p = new OpenAiMemory(
          "sk-synthetic-test-only",
          f.budget,
          transport,
        );
        const answer = await p.answer(
          quoted
            ? "¿Qué mandaba responder el prospecto que cité?"
            : "¿Cuál es mi plato favorito?",
          "2026-11-12T12:00:00Z",
          candidates,
          [
            {
              id: "x",
              text,
              receivedAt: "2026-11-12T10:00:00Z",
              zone: "Europe/Madrid",
            },
          ],
        );
        assert.equal(calls, 2);
        assert.equal(answer.status, quoted ? "answered" : "not_found");
        if (quoted) {
          assert.match(answer.answer, /contenido citado/u);
          assert.match(answer.answer, /887766/u);
        } else assert.doesNotMatch(answer.answer, /favorita es/u);
      } finally {
        await f.close();
      }
    },
  );
