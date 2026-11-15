import { readFile, writeFile } from "node:fs/promises";
import { parseEnv } from "node:util";
import { openRuntime, reportError } from "../prototypes/memory/src/runtime.ts";
import { OpenAiMemory } from "../prototypes/memory/src/openai.ts";
import { modelProfile } from "../prototypes/memory/src/model-config.ts";
import { unknownTime } from "../prototypes/memory/src/temporal.ts";

const at = "2026-11-15T12:00:00Z";
function fixture(id, text, options = {}) {
    const source = { id, text, receivedAt: at, zone: "Europe/Madrid" };
    const memory = {
        id: `${id}-1`,
        sourceId: id,
        revision: 1,
        text,
        quote: text,
        kind: "intention",
        entities: [],
        time: unknownTime,
        provenance: "personal",
        attribution: null,
        attributionEvidence: null,
        eventStatus: "planned",
        lifecycle: "current",
        receivedAt: at,
        zone: source.zone,
        vector: [1],
        ...options,
    };
    return { source, memory };
}
const today = {
    precision: "day",
    value: "2026-11-15",
    end: null,
    quote: "Hoy",
};
const play = fixture("address-play", "Hoy quiero jugar a la Play.", {
    time: today,
});
const past = fixture(
    "address-past",
    "Tenía previsto visitar el vivero el 14 de noviembre de 2026.",
    {
        time: {
            precision: "day",
            value: "2026-11-14",
            end: null,
            quote: "el 14 de noviembre de 2026",
        },
    },
);
const call = fixture("address-call", "Hoy llamé a mi padre.", {
    kind: "fact",
    eventStatus: "completed",
    time: today,
});
const taste = fixture("address-taste", "No me gusta el apio.", {
    kind: "opinion",
    eventStatus: "unspecified",
});
const mother = fixture(
    "address-mother",
    "Mi madre tiene un examen el 17 de noviembre de 2026.",
    {
        kind: "fact",
        time: {
            precision: "day",
            value: "2026-11-17",
            end: null,
            quote: "el 17 de noviembre de 2026",
        },
    },
);
const pablo = fixture("address-pablo", "Pablo me dijo que quiere ir al cine.", {
    provenance: "reported",
    attribution: "Pablo",
    attributionEvidence: "Pablo me dijo",
});
const quotation = fixture(
    "address-quotation",
    "Leí en un cuento: «Quiero ir a la Luna».",
    {
        provenance: "quoted",
        attribution: "un cuento",
        attributionEvidence: "un cuento",
        eventStatus: "unspecified",
        kind: "fact",
    },
);
const cases = [
    {
        id: "owner-intention",
        question: "¿Qué quiero hacer hoy?",
        facts: [play],
        check: (a) =>
            /\bquieres\b/iu.test(a) &&
            /Play/u.test(a) &&
            !/\bquiero\b/iu.test(a),
    },
    {
        id: "owner-past-plan",
        question: "¿Qué tenía previsto hacer el 14 de noviembre?",
        facts: [past],
        check: (a) =>
            /tenías|querías|planeabas|habías/iu.test(a) &&
            /vivero/iu.test(a) &&
            !/visitaste|fuiste/iu.test(a),
    },
    {
        id: "owner-completed-and-relative",
        question: "¿A quién llamé hoy?",
        facts: [call],
        check: (a) =>
            /llamaste/iu.test(a) &&
            /tu padre/iu.test(a) &&
            !/mi padre/iu.test(a),
    },
    {
        id: "owner-negative-preference",
        question: "¿Me gusta el apio?",
        facts: [taste],
        check: (a) => /no te gusta/iu.test(a) && /apio/iu.test(a),
    },
    {
        id: "third-person-and-possessive",
        question: "¿Cuándo tiene un examen mi madre?",
        facts: [mother],
        check: (a) =>
            /tu madre/iu.test(a) &&
            /17/u.test(a) &&
            !/tienes un examen/iu.test(a),
    },
    {
        id: "reported-desire-not-owner",
        question: "¿Qué me dijo Pablo que quiere hacer?",
        facts: [pablo],
        check: (a) =>
            /te (dijo|contó)/iu.test(a) &&
            /quiere|quería/iu.test(a) &&
            /cine/iu.test(a) &&
            !/quieres ir/iu.test(a),
    },
    {
        id: "literal-first-person-quotation",
        question: "¿Qué decía el cuento que leí?",
        facts: [quotation],
        check: (a) => a.includes("Quiero ir a la Luna"),
    },
    {
        id: "two-subjects",
        question: "¿Qué quiero hacer yo y qué quiere hacer Pablo?",
        facts: [play, pablo],
        check: (a) =>
            /quieres/iu.test(a) &&
            /Play/u.test(a) &&
            /Pablo/iu.test(a) &&
            /quiere|quería/iu.test(a) &&
            /cine/iu.test(a),
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
    const runtime = await openRuntime(true),
        before = { ...runtime.budget.ledger };
    const file = `docs/09-planning/k4-answer-perspective-${Date.now()}.json`,
        rows = [];
    let apiCalls = 0;
    const ai = new OpenAiMemory(
        process.env.OPENAI_API_KEY,
        runtime.budget,
        async (url, options) => {
            apiCalls++;
            return fetch(url, options);
        },
    );
    const report = async () =>
        writeFile(
            file,
            JSON.stringify(
                {
                    kind: "synthetic-answer-perspective",
                    at,
                    profile: modelProfile,
                    resolvedModel: ai.resolvedModel,
                    apiCalls,
                    estimatedUsd:
                        runtime.budget.ledger.spentUsd - before.spentUsd,
                    rows,
                },
                null,
                2,
            ),
        );
    try {
        for (const item of cases) {
            const original = JSON.stringify(item.facts);
            try {
                const answer = await ai.answer(
                    item.question,
                    at,
                    item.facts.map(({ memory }) => ({ score: 1, memory })),
                    item.facts.map((f) => f.source),
                );
                const ids = item.facts.map((f) => f.source.id).sort();
                const passed =
                    answer.status === "answered" &&
                    item.check(answer.answer) &&
                    JSON.stringify([...answer.sourceIds].sort()) ===
                        JSON.stringify(ids) &&
                    JSON.stringify(item.facts) === original;
                rows.push({
                    id: item.id,
                    passed,
                    question: item.question,
                    facts: item.facts,
                    answer,
                    verification: ai.lastCheck,
                });
            } catch (error) {
                rows.push({
                    id: item.id,
                    passed: false,
                    errorCode:
                        error?.name === "MemoryError"
                            ? error.message
                            : "CHECK_FAILED",
                });
            }
            await report();
            console.log(
                JSON.stringify({
                    id: rows.at(-1).id,
                    passed: rows.at(-1).passed,
                }),
            );
        }
        const memories = [play.memory, pablo.memory].map(
            ({ vector, ...memory }) => memory,
        );
        const presentation = await ai.presentMemories({ memories });
        const review = await ai.reviewMemoryPresentation({
            memories,
            presentation,
        });
        const own =
            presentation.items.find((item) => item.id === play.memory.id)
                ?.text ?? "";
        rows.push({
            id: "management-stays-first-person",
            passed:
                /quiero/iu.test(own) &&
                !/quieres/iu.test(own) &&
                review.faithful &&
                review.ownerPerspective &&
                review.attributionPreserved,
            presentation,
            review,
        });
        await report();
        console.log(
            JSON.stringify({
                file,
                passed: rows.filter((r) => r.passed).length,
                total: rows.length,
                apiCalls,
                estimatedUsd: runtime.budget.ledger.spentUsd - before.spentUsd,
            }),
        );
        if (rows.some((row) => !row.passed)) process.exitCode = 1;
    } finally {
        await runtime.close();
    }
}
main().catch(reportError);
