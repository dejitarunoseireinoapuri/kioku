import { readFile, writeFile } from "node:fs/promises";
import { parseEnv } from "node:util";
import { createHash, randomUUID } from "node:crypto";
import { openRuntime, reportError } from "../prototypes/memory/src/runtime.ts";
import { separateForgetEvidence } from "../backend/lib/src/memory-control/forget-evidence.js";
import { withoutVectors } from "../backend/lib/src/memory-control/forget-contracts.js";

// Synthetic regression corpus, deliberately sharing complete evidence between independent facts.
const cases = [
    {
        id: "two-plans-two-dates",
        text: "Iré a cerámica el 18 de diciembre y visitaré el acuario el 20 de diciembre.",
        facts: [
            "Iré a cerámica el 18 de diciembre",
            "visitaré el acuario el 20 de diciembre.",
        ],
        dates: ["18", "20"],
        removed: "cerámica",
        copies: 2,
    },
    {
        id: "reported-independent-plans",
        text: "Nora me dijo: «Iré a esgrima el 22 de diciembre y visitaré el planetario el 24 de diciembre».",
        facts: [
            "Nora irá a esgrima el 22 de diciembre.",
            "Nora visitará el planetario el 24 de diciembre.",
        ],
        dates: ["22", "24"],
        removed: "esgrima",
        copies: 1,
        reported: true,
    },
    {
        id: "dependent-fact-must-stay-unchanged",
        text: "Iré al museo el 19 de diciembre. Mi excursión al faro del 20 de diciembre empezará después de mi visita al museo del 19 de diciembre.",
        facts: [
            "Iré al museo el 19 de diciembre",
            "Mi excursión al faro del 20 de diciembre empezará después de mi visita al museo del 19 de diciembre.",
        ],
        dates: ["19", "20"],
        removed: "museo",
        copies: 1,
        refuse: true,
    },
];
const at = "2026-11-15T12:00:00Z";
function inventory(row) {
    const sources = Array.from({ length: row.copies }, () => ({
        id: randomUUID(),
        text: row.text,
        receivedAt: at,
        zone: "Europe/Madrid",
    }));
    const memories = sources.flatMap((source) =>
        row.facts.map((text, index) => ({
            id: `${source.id}-${index + 1}`,
            sourceId: source.id,
            text,
            quote: row.text,
            kind: "intention",
            entities: [],
            time: {
                precision: "day",
                value: `2026-12-${row.dates[index]}`,
                end: null,
                quote: `${row.dates[index]} de diciembre`,
            },
            provenance: row.reported ? "reported" : "personal",
            attribution: row.reported ? "Nora" : null,
            attributionEvidence: row.reported ? "Nora me dijo" : null,
            eventStatus: "planned",
            lifecycle: "current",
            receivedAt: at,
            zone: source.zone,
            revision: 1,
            vector: Array.from({ length: 512 }, () => 0.1),
        })),
    );
    return { sources, memories, targets: [memories[0]] };
}
async function main() {
    if (process.argv.slice(2).join(" ") !== "--live")
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
    const file = `docs/09-planning/k4-shared-evidence-${Date.now()}.json`;
    try {
        for (const row of cases) {
            const raw = inventory(row),
                data = {
                    ...raw,
                    memories: withoutVectors(raw.memories),
                    targets: withoutVectors(raw.targets),
                };
            const selection =
                await runtime.intelligence.selectDuplicateFacts(data);
            let passed = false;
            const detail = { id: row.id, selection };
            review.push(detail);
            if (selection.unresolved || selection.question) {
                passed = row.refuse === true;
            } else {
                const ids = new Set(selection.memoryIds);
                if (
                    ids.size !== row.copies ||
                    raw.memories.some(
                        (m, index) => ids.has(m.id) !== (index % 2 === 0),
                    )
                )
                    throw Error("SELECTION_SCOPE_FAILED");
                const changes = raw.sources.map((source) => {
                    const units = raw.memories.filter(
                        (m) => m.sourceId === source.id,
                    );
                    return separateForgetEvidence(
                        source,
                        units,
                        units.filter((m) => ids.has(m.id)).map((m) => m.id),
                        selection.evidence.filter((e) =>
                            units.some((m) => m.id === e.memoryId),
                        ),
                    );
                });
                const input = {
                    ...data,
                    selectedIds: [...ids],
                    evidence: selection.evidence,
                    retainedSources: changes.flatMap(
                        (c) => c.replacement.sources,
                    ),
                    retainedMemories: withoutVectors(
                        changes.flatMap((c) => c.replacement.memories),
                    ),
                };
                const verdict =
                    await runtime.intelligence.reviewDuplicateFacts(input);
                Object.assign(detail, { input, verdict });
                passed =
                    row.refuse === true
                        ? !verdict.allowed
                        : verdict.allowed &&
                          !JSON.stringify([
                              input.retainedSources,
                              input.retainedMemories,
                          ]).includes(row.removed) &&
                          input.retainedMemories.length === row.copies &&
                          input.retainedMemories.every(
                              (m) =>
                                  m.text === row.facts[1] &&
                                  m.time.value === `2026-12-${row.dates[1]}`,
                          );
            }
            rows.push({ id: row.id, passed });
        }
    } finally {
        await writeFile(
            ".setup/k4-shared-evidence-provider-review.json",
            JSON.stringify(review, null, 2),
        );
        await writeFile(
            file,
            JSON.stringify(
                {
                    model: "gpt-6.1-sol",
                    reasoning: "medium",
                    corpusHash: createHash("sha256")
                        .update(JSON.stringify(cases))
                        .digest("hex"),
                    scope: "Synthetic regression in RAM; actual provider; no production or native proof",
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
    if (rows.length !== cases.length || rows.some((r) => !r.passed))
        process.exitCode = 1;
}
main().catch(reportError);
