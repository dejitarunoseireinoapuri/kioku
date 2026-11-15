import { readFile, writeFile } from "node:fs/promises";
import { parseEnv } from "node:util";
import { createHash } from "node:crypto";
import { openRuntime, reportError } from "../prototypes/memory/src/runtime.ts";
const cases = [
    {
        id: "owner-and-brother",
        items: [
            ["El usuario quiere ir al parque.", "Quiero ir al parque."],
            [
                "El hermano del usuario, Pablo, quiere ir al cine.",
                "Mi hermano Pablo quiere ir al cine.",
            ],
        ],
    },
    {
        id: "negation-and-condition",
        items: [
            [
                "El usuario no quiere volver al parque hasta que Gemma regrese.",
                "No quiero volver al parque hasta que Gemma regrese.",
            ],
            [
                "El usuario pensaba que estudiar japonés le ayudaría.",
                "Pensaba que estudiar japonés me ayudaría.",
            ],
        ],
    },
    {
        id: "quote-is-not-owner",
        items: [
            [
                "El cartel decía: «Quiero viajar a Japón».",
                "El cartel decía: «Quiero viajar a Japón».",
            ],
            ["El usuario estudia japonés.", "Estudio japonés."],
        ],
    },
];
async function main() {
    const captureOnly =
        process.argv.slice(2).join(" ") === "--live --capture-only";
    const reportedOnly =
        process.argv.slice(2).join(" ") === "--live --reported-only";
    const selectedCases = reportedOnly
        ? [
              {
                  id: "reported-attribution",
                  items: [
                      [
                          "Pablo dijo al usuario que quiere ir al parque.",
                          "Pablo me dijo que quiere ir al parque.",
                      ],
                      [
                          "Pablo recomendó al usuario el libro Bruma.",
                          "Pablo me recomendó el libro Bruma.",
                      ],
                  ],
              },
          ]
        : cases;
    if (
        !captureOnly &&
        !reportedOnly &&
        process.argv.slice(2).join(" ") !== "--live"
    )
        throw Error("Explicit live run required");
    if (
        ["NODE_DEBUG", "GRPC_TRACE", "GOOGLE_SDK_NODE_LOGGING", "DEBUG"].some(
            (k) => process.env[k],
        )
    )
        throw Error("Tracing forbidden");
    process.env.OPENAI_API_KEY = parseEnv(
        await readFile(".env.local", "utf8"),
    ).OPENAI_API_KEY;
    const runtime = await openRuntime(true);
    const initial = { ...runtime.budget.ledger },
        rows = [],
        review = [];
    const file = `docs/09-planning/k4-perspective-${Date.now()}.json`;
    const captureTurn = {
        id: "perspective-capture",
        text: "Quiero ir al parque. Mi hermano Pablo quiere ir al cine. Un cartel decía: «Quiero viajar a Japón».",
        receivedAt: "2026-11-15T12:00:00Z",
        zone: "Europe/Madrid",
    };
    try {
        if (captureOnly) {
            const extraction = await runtime.intelligence.extract(
                captureTurn,
                null,
            );
            const own = extraction.items.find(
                (item) =>
                    item.provenance === "personal" && /parque/i.test(item.text),
            );
            const brother = extraction.items.find(
                (item) =>
                    item.provenance === "personal" && /Pablo/i.test(item.text),
            );
            const quoted = extraction.items.find(
                (item) => item.provenance === "quoted",
            );
            rows.push({
                id: "fresh-owner-capture",
                passed:
                    extraction.status === "saved" &&
                    extraction.items.length === 3 &&
                    Boolean(
                        own &&
                            /quiero/i.test(own.text) &&
                            brother &&
                            /quiere/i.test(brother.text) &&
                            quoted &&
                            /Quiero viajar a Japón/.test(quoted.text),
                    ),
            });
            review.push({ captureTurn, extraction });
        } else {
            for (const row of selectedCases) {
                const memories = row.items.map(([text, quote], index) => ({
                    id: `${row.id}-${index + 1}`,
                    text,
                    quote,
                    kind:
                        row.id === "negation-and-condition" && index === 1
                            ? "thought"
                            : "intention",
                    time: {
                        precision: "unknown",
                        value: null,
                        end: null,
                        quote: null,
                    },
                    provenance: reportedOnly
                        ? "reported"
                        : row.id === "quote-is-not-owner" && index === 0
                          ? "quoted"
                          : "personal",
                    attribution: reportedOnly
                        ? "Pablo"
                        : row.id === "quote-is-not-owner" && index === 0
                          ? "el cartel"
                          : null,
                    eventStatus: reportedOnly
                        ? "completed"
                        : row.id === "quote-is-not-owner"
                          ? "unspecified"
                          : "planned",
                    lifecycle: "current",
                }));
                const started = Date.now();
                const presentation = await runtime.intelligence.presentMemories(
                    { memories },
                );
                const validation =
                    await runtime.intelligence.reviewMemoryPresentation({
                        memories,
                        presentation,
                    });
                const ids = new Set(memories.map((m) => m.id));
                const valid =
                    presentation.items.length === ids.size &&
                    new Set(presentation.items.map((m) => m.id)).size ===
                        ids.size &&
                    presentation.items.every((m) => ids.has(m.id));
                rows.push({
                    id: row.id,
                    passed: valid && Object.values(validation).every(Boolean),
                    ms: Date.now() - started,
                });
                review.push({ memories, presentation, validation });
            }
            if (!reportedOnly) {
                const source = {
                    id: "synthetic-source",
                    text: "Quiero ir al parque. Mi hermano Pablo quiere ir al cine.",
                    receivedAt: "2026-11-15T12:00:00Z",
                    zone: "Europe/Madrid",
                };
                const candidates = review[0].memories.map((m) => ({
                    memory: {
                        ...m,
                        sourceId: source.id,
                        revision: 1,
                        receivedAt: source.receivedAt,
                        zone: source.zone,
                        vector: [1],
                        attributionEvidence: null,
                    },
                    score: 1,
                }));
                const answer = await runtime.intelligence.answer(
                    "¿Dónde quiero ir?",
                    source.receivedAt,
                    candidates,
                    [source],
                );
                review.push({ answer });
                rows.push({
                    id: "owner-answer",
                    passed:
                        answer.status === "answered" &&
                        /parque/i.test(answer.answer) &&
                        /quiero|me apetece|tengo previsto/i.test(answer.answer),
                });
            }
        }
    } finally {
        await writeFile(
            captureOnly
                ? ".setup/k4-first-person-capture-review.json"
                : reportedOnly
                  ? ".setup/k4-reported-perspective-review.json"
                  : ".setup/k4-perspective-live-review.json",
            JSON.stringify(review, null, 2),
        );
        await writeFile(
            file,
            JSON.stringify(
                {
                    model: "gpt-6.1-sol",
                    reasoning: "medium",
                    corpusHash: createHash("sha256")
                        .update(
                            JSON.stringify(
                                captureOnly ? captureTurn : selectedCases,
                            ),
                        )
                        .digest("hex"),
                    scope: "Synthetic fixtures in RAM; actual provider; no production or native proof",
                    rows,
                    calls: runtime.budget.ledger.calls - initial.calls,
                    estimatedUsd:
                        runtime.budget.ledger.spentUsd - initial.spentUsd,
                },
                null,
                2,
            ) + "\n",
        );
        await runtime.close();
        process.stdout.write(JSON.stringify({ report: file, rows }));
    }
    if (
        rows.length !== (captureOnly || reportedOnly ? 1 : 4) ||
        rows.some((r) => !r.passed)
    )
        process.exitCode = 1;
}
main().catch(reportError);
