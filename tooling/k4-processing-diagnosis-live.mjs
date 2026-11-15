import { readFile, writeFile } from "node:fs/promises";
import { parseEnv } from "node:util";
import { randomUUID } from "node:crypto";
import { openRuntime, reportError } from "../prototypes/memory/src/runtime.ts";
import { OpenAiMemory } from "../prototypes/memory/src/openai.ts";
import { MemoryEngine } from "../prototypes/memory/src/engine.ts";

const cases = [
    {
        id: "next-tuesday-agenda",
        text: "El próximo martes tengo una revisión en el observatorio Loto.",
    },
    {
        id: "tuesday-that-comes",
        text: "El martes que viene tengo una revisión en el observatorio Loto.",
    },
    {
        id: "next-tuesday-intention",
        text: "El próximo martes quiero visitar el observatorio Loto.",
    },
    {
        id: "next-tuesday-errand",
        text: "El martes que viene voy a llevar una maqueta al taller Loto.",
    },
    {
        id: "next-tuesday-exam",
        text: "El próximo martes tengo un examen práctico de ingeniería ficticia.",
    },
    {
        id: "undated-control",
        text: "Tengo una libreta de papel reciclado.",
        unknown: true,
    },
];
const calendarCases = [
    {
        id: "next-month",
        text: "El mes que viene quiero empezar cerámica.",
        expected: [{ precision: "month", value: "2026-12" }],
    },
    {
        id: "current-month",
        text: "Este mes quiero terminar una maqueta.",
        expected: [{ precision: "month", value: "2026-11" }],
    },
    {
        id: "previous-month",
        text: "El mes pasado empecé a construir una maqueta.",
        expected: [{ precision: "month", value: "2026-10" }],
    },
    {
        id: "next-year",
        text: "El año que viene quiero visitar un vivero.",
        expected: [{ precision: "year", value: "2027" }],
    },
    {
        id: "current-year",
        text: "Este año quiero aprender grabado.",
        expected: [{ precision: "year", value: "2026" }],
    },
    {
        id: "previous-year",
        text: "El año pasado aprendí a hacer una maqueta.",
        expected: [{ precision: "year", value: "2025" }],
    },
    {
        id: "next-week",
        text: "La semana que viene quiero visitar el observatorio Loto.",
        expected: [
            { precision: "interval", value: "2026-11-16", end: "2026-11-22" },
        ],
    },
    {
        id: "current-week",
        text: "Esta semana quiero terminar la maqueta Loto.",
        expected: [
            { precision: "interval", value: "2026-11-09", end: "2026-11-15" },
        ],
    },
    {
        id: "previous-week",
        text: "La semana pasada visité el vivero Loto.",
        expected: [
            { precision: "interval", value: "2026-11-02", end: "2026-11-08" },
        ],
    },
    {
        id: "next-month-and-tuesday",
        text: "Quiero empezar cerámica el mes que viene, la matrícula es el próximo martes.",
        expected: [
            { precision: "month", value: "2026-12" },
            { precision: "day", value: "2026-11-17" },
        ],
    },
    {
        id: "indefinite-future",
        text: "Algún día quiero visitar el vivero Loto.",
        expected: [{ precision: "unknown", value: null }],
    },
];
async function main() {
    const calendarOnly =
        process.argv.slice(2).join(" ") === "--live --calendar-only";
    if (!calendarOnly && process.argv.slice(2).join(" ") !== "--live")
        throw Error("Explicit live run required");
    if (["DEBUG", "NODE_DEBUG", "GRPC_TRACE"].some((k) => process.env[k]))
        throw Error("Tracing forbidden");
    process.env.OPENAI_API_KEY = parseEnv(
        await readFile(".env.local", "utf8"),
    ).OPENAI_API_KEY;
    const runtime = await openRuntime(true),
        initial = { ...runtime.budget.ledger };
    const rows = [],
        file = `docs/09-planning/k4-processing-diagnosis-${Date.now()}.json`;
    try {
        for (const fixture of calendarOnly ? calendarCases : cases) {
            const stages = [];
            const ai = new OpenAiMemory(
                process.env.OPENAI_API_KEY,
                runtime.budget,
                async (url, init) => {
                    const body = JSON.parse(init.body),
                        stage = body.text?.format?.name ?? "embeddings";
                    const response = await fetch(url, init);
                    if (response.ok && stage !== "embeddings") {
                        const value = await response.clone().json();
                        const texts = (value.output ?? [])
                            .flatMap((item) => item.content ?? [])
                            .filter((item) => item.type === "output_text")
                            .map((item) => item.text ?? "")
                            .join("");
                        let result;
                        try {
                            result = JSON.parse(texts);
                        } catch {
                            result = { malformed: true };
                        }
                        stages.push({
                            stage,
                            http: response.status,
                            providerState: value.status,
                            result,
                        });
                    } else stages.push({ stage, http: response.status });
                    return response;
                },
            );
            let snapshot = { version: 4, sources: [], memories: [] };
            const original = {
                id: randomUUID(),
                text: fixture.text,
                receivedAt: "2026-11-15T14:00:00Z",
                zone: "Europe/Madrid",
            };
            let row;
            try {
                const engine = new MemoryEngine(
                    {
                        load: async () => snapshot,
                        save: async (next) => {
                            snapshot = next;
                        },
                    },
                    ai,
                );
                const result = await engine.tell(original),
                    memory = snapshot.memories[0];
                const passed = fixture.expected
                    ? result.status === "saved" &&
                      snapshot.memories.length === fixture.expected.length &&
                      fixture.expected.every((expected) =>
                          snapshot.memories.some(
                              (m) =>
                                  m.time.precision === expected.precision &&
                                  m.time.value === expected.value &&
                                  m.time.end === (expected.end ?? null),
                          ),
                      )
                    : result.status === "saved" &&
                      snapshot.memories.length === 1 &&
                      memory.time.precision ===
                          (fixture.unknown ? "unknown" : "day") &&
                      (fixture.unknown || memory.time.value === "2026-11-17");
                row = {
                    id: fixture.id,
                    passed,
                    source: original,
                    result,
                    stages,
                };
            } catch (error) {
                row = {
                    id: fixture.id,
                    passed: false,
                    source: original,
                    errorCode:
                        error?.name === "MemoryError"
                            ? error.message
                            : "CHECK_FAILED",
                    stages,
                };
            }
            rows.push(row);
            await writeFile(
                file,
                JSON.stringify(
                    {
                        kind: "synthetic-processing-diagnosis",
                        rows,
                        estimatedUsd:
                            runtime.budget.ledger.spentUsd - initial.spentUsd,
                    },
                    null,
                    2,
                ),
            );
            console.log(
                JSON.stringify({
                    id: row.id,
                    passed: row.passed,
                    errorCode: row.errorCode,
                    stages: stages.map((s) => s.stage),
                }),
            );
        }
        console.log(
            JSON.stringify({
                file,
                passed: rows.filter((r) => r.passed).length,
                total: rows.length,
                estimatedUsd: runtime.budget.ledger.spentUsd - initial.spentUsd,
            }),
        );
        if (rows.some((r) => !r.passed)) process.exitCode = 1;
    } finally {
        await runtime.close();
    }
}
main().catch(reportError);
