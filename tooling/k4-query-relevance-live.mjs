import { readFile, writeFile } from "node:fs/promises";
import { parseEnv } from "node:util";
import { openRuntime, reportError } from "../prototypes/memory/src/runtime.ts";
import { OpenAiMemory } from "../prototypes/memory/src/openai.ts";

const at = "2026-11-15T12:00:00Z";
const source = {
    id: "relevance-planetarium",
    text: "[Fragmento de una corrección tuya]\nEn la prueba Loto quiero visitar el planetario el 21 de diciembre de 2026.",
    receivedAt: at,
    zone: "Europe/Madrid",
    sourceKind: "correction",
};
const memory = {
    id: "relevance-planetarium-1",
    sourceId: source.id,
    revision: 2,
    text: "Quiero visitar el planetario el 21 de diciembre de 2026.",
    quote: "En la prueba Loto quiero visitar el planetario el 21 de diciembre de 2026.",
    kind: "intention",
    entities: ["prueba Loto", "planetario"],
    time: {
        precision: "day",
        value: "2026-12-21",
        end: null,
        quote: "el 21 de diciembre de 2026",
    },
    provenance: "personal",
    attribution: null,
    attributionEvidence: null,
    eventStatus: "planned",
    lifecycle: "current",
    receivedAt: at,
    zone: "Europe/Madrid",
    vector: [1],
};
const otherSource = {
    id: "relevance-bookbinding",
    text: "En la prueba Loto iré a encuadernación el 18 de diciembre de 2026.",
    receivedAt: at,
    zone: "Europe/Madrid",
};
const otherMemory = {
    ...memory,
    id: "relevance-bookbinding-1",
    sourceId: otherSource.id,
    text: otherSource.text,
    quote: otherSource.text,
    entities: ["prueba Loto", "encuadernación"],
    time: {
        ...memory.time,
        value: "2026-12-18",
        quote: "el 18 de diciembre de 2026",
    },
};
const absentQuestion = "En la prueba Loto, ¿cuándo iré a encuadernación?";
const cases = [
    {
        id: "absent-with-corrected-distractor",
        question: absentQuestion,
        status: "not_found",
    },
    {
        id: "current-correction-answers-own-question",
        question: "En la prueba Loto, ¿cuándo quiero visitar el planetario?",
        status: "answered",
        day: "21",
    },
    {
        id: "absent-with-retained-distractor",
        question: absentQuestion,
        status: "not_found",
        retained: true,
    },
    {
        id: "same-marker-different-activities",
        question: absentQuestion,
        status: "answered",
        day: "18",
        withOther: true,
    },
    {
        id: "review-rejects-faithful-wrong-topic",
        question: absentQuestion,
        status: "not_found",
        forced: true,
    },
];

async function main() {
    if (process.argv.slice(2).join(" ") !== "--live")
        throw Error("Explicit live run required");
    if (
        ["DEBUG", "NODE_DEBUG", "GRPC_TRACE", "GOOGLE_SDK_NODE_LOGGING"].some(
            (k) => process.env[k],
        )
    )
        throw Error("Tracing forbidden");
    process.env.OPENAI_API_KEY = parseEnv(
        await readFile(".env.local", "utf8"),
    ).OPENAI_API_KEY;
    const runtime = await openRuntime(true);
    const before = { ...runtime.budget.ledger };
    let apiCalls = 0,
        injectedDrafts = 0;
    const rows = [];
    const reportFile = `docs/09-planning/k4-query-relevance-${Date.now()}.json`;
    try {
        for (const fixture of cases) {
            const transport = async (url, init) => {
                const body = JSON.parse(init.body);
                if (
                    fixture.forced &&
                    body.text?.format?.name === "memory_answer"
                ) {
                    injectedDrafts++;
                    return Response.json({
                        status: "completed",
                        output: [
                            {
                                type: "message",
                                content: [
                                    {
                                        type: "output_text",
                                        text: JSON.stringify({
                                            status: "answered",
                                            answer: "El plan corregido es visitar el planetario el 21 de diciembre de 2026.",
                                            scope: "memory",
                                            evidenceIds: [memory.id],
                                        }),
                                    },
                                ],
                            },
                        ],
                        usage: { input_tokens: 0, output_tokens: 0 },
                    });
                }
                apiCalls++;
                return fetch(url, init);
            };
            const intelligence = new OpenAiMemory(
                process.env.OPENAI_API_KEY,
                runtime.budget,
                transport,
            );
            const currentSource = fixture.retained
                ? {
                      ...source,
                      sourceKind: "retained",
                      text:
                          "[Texto conservado tras un cambio solicitado por ti]\n" +
                          memory.quote,
                  }
                : source;
            const sources = fixture.withOther
                ? [currentSource, otherSource]
                : [currentSource];
            const candidates = (
                fixture.withOther ? [memory, otherMemory] : [memory]
            ).map((m) => ({ score: 1, memory: m }));
            const answer = await intelligence.answer(
                fixture.question,
                at,
                candidates,
                sources,
            );
            const expectedSource = fixture.withOther
                ? otherSource.id
                : source.id;
            const passed =
                answer.status === fixture.status &&
                (fixture.status !== "answered" ||
                    (answer.answer.includes(fixture.day) &&
                        answer.sourceIds.length === 1 &&
                        answer.sourceIds[0] === expectedSource)) &&
                (fixture.status !== "not_found" ||
                    answer.sourceIds.length === 0) &&
                (!fixture.forced ||
                    intelligence.lastCheck?.supported === false);
            rows.push({
                id: fixture.id,
                passed,
                question: fixture.question,
                answer,
                verification: intelligence.lastCheck,
                selected: intelligence.lastEvidenceIds,
                resolvedModel: intelligence.resolvedModel,
            });
            console.log(
                JSON.stringify({
                    id: fixture.id,
                    passed,
                    status: answer.status,
                }),
            );
        }
        const report = {
            kind: "synthetic-query-relevance-regression",
            at,
            apiCalls,
            injectedDrafts,
            estimatedUsd: runtime.budget.ledger.spentUsd - before.spentUsd,
            sources: [source, otherSource],
            memories: [memory, otherMemory],
            rows,
        };
        await writeFile(reportFile, JSON.stringify(report, null, 2));
        console.log(
            JSON.stringify({
                reportFile,
                passed: rows.filter((r) => r.passed).length,
                total: rows.length,
                apiCalls,
                injectedDrafts,
                estimatedUsd: report.estimatedUsd,
            }),
        );
        if (rows.some((r) => !r.passed)) process.exitCode = 1;
    } finally {
        await runtime.close();
    }
}
main().catch(reportError);
