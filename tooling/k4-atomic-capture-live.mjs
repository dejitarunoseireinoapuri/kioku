import { readFile, writeFile } from "node:fs/promises";
import { parseEnv } from "node:util";
import { randomUUID } from "node:crypto";
import { openRuntime, reportError } from "../prototypes/memory/src/runtime.ts";
import { OpenAiMemory } from "../prototypes/memory/src/openai.ts";
import { MemoryEngine } from "../prototypes/memory/src/engine.ts";
import { separateForgetEvidence } from "../backend/lib/src/memory-control/forget-evidence.js";
import { withoutVectors } from "../backend/lib/src/memory-control/forget-contracts.js";

const at = "2026-11-15T12:00:00Z";
const compound = "Quiero visitar el vivero esta tarde y leer un cómic mañana.";
const cases = [
    { id: "shared-want-two-times", text: compound, count: 2 },
    {
        id: "mixed-draft-must-be-replaced",
        text: compound,
        count: 2,
        forced: true,
    },
    {
        id: "reported-shared-subject",
        text: "Nora me dijo que quiere visitar el vivero esta tarde y leer un cómic mañana.",
        count: 2,
        reported: true,
    },
    {
        id: "condition-is-not-an-independent-fact",
        text: "Cuando Nora regrese, quiero visitar el vivero esta tarde.",
        count: 1,
        conditional: true,
    },
];
const normalization = {
    id: "post-canonical-text-review",
    text: "Quiero visitar el vivero el 16 de noviembre de 2026 y leer un cómic el 17 de noviembre de 2026.",
    count: 2,
    normalized: true,
};

function mixedDraft(text) {
    const item = {
        text,
        kind: "intention",
        entities: ["vivero", "cómic"],
        provenance: "personal",
        attribution: null,
        attributionEvidenceId: null,
        eventStatus: "planned",
        lifecycle: "current",
        evidenceId: "s1",
        time: {
            precision: "unknown",
            value: null,
            end: null,
            evidenceId: null,
            evidenceText: null,
        },
    };
    return {
        status: "saved",
        clarification: null,
        items: [
            item,
            {
                ...item,
                text: "Quiero leer un cómic mañana.",
                entities: ["cómic"],
                time: {
                    precision: "day",
                    value: "2026-11-16",
                    end: null,
                    evidenceId: "s1",
                    evidenceText: "mañana",
                },
            },
        ],
    };
}

async function main() {
    const normalizationOnly =
        process.argv.slice(2).join(" ") === "--live --normalization-only";
    if (!normalizationOnly && process.argv.slice(2).join(" ") !== "--live")
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
    const initial = { ...runtime.budget.ledger };
    const rows = [];
    let apiCalls = 0,
        injectedDrafts = 0;
    const file = `docs/09-planning/k4-atomic-capture-${Date.now()}.json`;
    try {
        for (const fixture of normalizationOnly ? [normalization] : cases) {
            const ai = new OpenAiMemory(
                process.env.OPENAI_API_KEY,
                runtime.budget,
                async (url, init) => {
                    const body = JSON.parse(init.body);
                    if (
                        fixture.forced &&
                        body.text?.format?.name === "memory_extraction"
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
                                            text: JSON.stringify(
                                                mixedDraft(fixture.text),
                                            ),
                                        },
                                    ],
                                },
                            ],
                            usage: { input_tokens: 0, output_tokens: 0 },
                        });
                    }
                    apiCalls++;
                    return fetch(url, init);
                },
            );
            let snapshot = { version: 4, sources: [], memories: [] };
            const engine = new MemoryEngine(
                {
                    load: async () => snapshot,
                    save: async (next) => {
                        snapshot = next;
                    },
                },
                fixture.normalized
                    ? {
                          extract: async () => ({
                              status: "saved",
                              clarification: null,
                              items: [
                                  {
                                      text: "Quiero visitar el vivero el 18 de noviembre de 2026.",
                                      quote: fixture.text,
                                      kind: "intention",
                                      entities: ["vivero"],
                                      provenance: "personal",
                                      attribution: null,
                                      attributionEvidence: null,
                                      eventStatus: "planned",
                                      lifecycle: "current",
                                      time: {
                                          precision: "day",
                                          value: "2026-11-18",
                                          end: null,
                                          quote: "16 de noviembre de 2026",
                                      },
                                  },
                                  {
                                      text: "Quiero leer un cómic el 17 de noviembre de 2026.",
                                      quote: fixture.text,
                                      kind: "intention",
                                      entities: ["cómic"],
                                      provenance: "personal",
                                      attribution: null,
                                      attributionEvidence: null,
                                      eventStatus: "planned",
                                      lifecycle: "current",
                                      time: {
                                          precision: "day",
                                          value: "2026-11-17",
                                          end: null,
                                          quote: "17 de noviembre de 2026",
                                      },
                                  },
                              ],
                          }),
                          refineCapture: (...args) => ai.refineCapture(...args),
                          embed: (...args) => ai.embed(...args),
                          answer: (...args) => ai.answer(...args),
                      }
                    : ai,
            );
            const original = {
                id: randomUUID(),
                text: fixture.text,
                receivedAt: at,
                zone: "Europe/Madrid",
            };
            const extraction = await engine.tell(original);
            const items = snapshot.memories;
            const own = items.find((m) => /vivero/iu.test(m.text));
            const other = items.find((m) => /cómic/iu.test(m.text));
            const passed =
                extraction.status === "saved" &&
                items.length === fixture.count &&
                !!own &&
                own.time.value ===
                    (fixture.normalized ? "2026-11-16" : "2026-11-15") &&
                (!fixture.normalized || !/18 de noviembre/iu.test(own.text)) &&
                (fixture.conditional
                    ? /Nora/iu.test(own.text) && !other
                    : !!other &&
                      !/cómic/iu.test(own.text) &&
                      !/vivero/iu.test(other.text) &&
                      other.time.value ===
                          (fixture.normalized ? "2026-11-17" : "2026-11-16")) &&
                (!fixture.reported ||
                    items.every(
                        (m) =>
                            m.provenance === "reported" &&
                            m.attribution === "Nora",
                    )) &&
                (!fixture.forced || ai.lastCaptureReviewDecision === "replace");
            rows.push({
                id: fixture.id,
                passed,
                source: original,
                items: withoutVectors(items),
                captureReview: ai.lastCaptureReviewDecision,
                changes: ai.lastCaptureReview,
            });
            console.log(
                JSON.stringify({ id: fixture.id, passed, count: items.length }),
            );
            if (fixture.id !== "shared-want-two-times" || !passed) continue;
            const data = {
                targets: withoutVectors([other]),
                sources: snapshot.sources,
                memories: withoutVectors(items),
            };
            const selection = await ai.selectDuplicateFacts(data);
            let forgetPassed = false;
            let retained = null;
            if (!selection.unresolved && selection.question === null) {
                const change = separateForgetEvidence(
                    original,
                    items,
                    selection.memoryIds,
                    selection.evidence,
                );
                const review = await ai.reviewDuplicateFacts({
                    ...data,
                    selectedIds: selection.memoryIds,
                    retainedSources: change.replacement.sources,
                    retainedMemories: withoutVectors(
                        change.replacement.memories,
                    ),
                    evidence: selection.evidence,
                });
                retained = {
                    sources: change.replacement.sources,
                    memories: withoutVectors(change.replacement.memories),
                    review,
                };
                forgetPassed =
                    review.allowed &&
                    change.replacement.memories.length === 1 &&
                    !JSON.stringify(retained).includes("cómic") &&
                    change.replacement.memories[0].time.value === "2026-11-15";
            }
            rows.push({
                id: "forget-only-second-action",
                passed: forgetPassed,
                selection,
                retained,
            });
            const before = withoutVectors(items).map((m, i) =>
                i === 0 ? { ...m, text: fixture.text } : m,
            );
            const repair = await ai.reviewCaptureRepair({
                original,
                before,
                after: withoutVectors(items),
            });
            const loss = await ai.reviewCaptureRepair({
                original,
                before,
                after: withoutVectors([own]),
            });
            rows.push({
                id: "whole-source-repair-keeps-both-facts",
                passed: Object.values(repair).every((v) => v === true),
                review: repair,
            });
            rows.push({
                id: "whole-source-repair-rejects-a-lost-plan",
                passed: loss.sameFacts === false,
                review: loss,
            });
        }
        const report = {
            at,
            kind: "synthetic-atomic-capture-regression",
            apiCalls,
            injectedDrafts,
            estimatedUsd: runtime.budget.ledger.spentUsd - initial.spentUsd,
            rows,
        };
        await writeFile(file, JSON.stringify(report, null, 2));
        console.log(
            JSON.stringify({
                file,
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
