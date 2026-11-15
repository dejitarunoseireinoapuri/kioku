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
        id: "shared-occasion-with-other-stories",
        text: "Durante el retiro Brisa704 iré a grabado el 18 de diciembre y visitaré el vivero el 20 de diciembre.",
        facts: [
            "Durante el retiro Brisa704 iré a grabado el 18 de diciembre.",
            "Durante el retiro Brisa704 visitaré el vivero el 20 de diciembre.",
        ],
        dates: ["18", "20"],
        removed: "grabado",
        context: "Brisa704",
        copies: 1,
        background: true,
    },
    {
        id: "shared-occasion-and-informant",
        text: "Nora me dijo que, durante el festival Mirto905, irá a acuarela el 22 de diciembre y visitará el jardín el 24 de diciembre.",
        facts: [
            "Nora irá a acuarela durante el festival Mirto905 el 22 de diciembre.",
            "Nora visitará el jardín durante el festival Mirto905 el 24 de diciembre.",
        ],
        dates: ["22", "24"],
        removed: "acuarela",
        context: "Mirto905",
        copies: 1,
        reported: true,
        background: true,
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
    if (row.background) {
        for (const text of [
            "Me gustan las ciruelas.",
            "Tengo una mochila de lona.",
            "Mi color favorito es el verde.",
        ]) {
            const id = randomUUID();
            sources.push({ id, text, receivedAt: at, zone: "Europe/Madrid" });
            memories.push({
                ...memories[0],
                id: `${id}-1`,
                sourceId: id,
                text,
                quote: text,
                entities: [],
                kind: "fact",
                time: {
                    precision: "unknown",
                    value: null,
                    end: null,
                    quote: null,
                },
                provenance: "personal",
                attribution: null,
                attributionEvidence: null,
                eventStatus: "unspecified",
            });
        }
    }
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
                const expectedIds = new Set(
                    raw.sources.slice(0, row.copies).map((s) => `${s.id}-1`),
                );
                if (
                    ids.size !== row.copies ||
                    [...ids].some((id) => !expectedIds.has(id))
                )
                    throw Error("SELECTION_SCOPE_FAILED");
                const changes = raw.sources.flatMap((source) => {
                    const units = raw.memories.filter(
                        (m) => m.sourceId === source.id,
                    );
                    const matched = units.filter((m) => ids.has(m.id));
                    return matched.length
                        ? [
                              separateForgetEvidence(
                                  source,
                                  units,
                                  matched.map((m) => m.id),
                                  selection.evidence.filter((e) =>
                                      units.some((m) => m.id === e.memoryId),
                                  ),
                              ),
                          ]
                        : [];
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
                          (!row.context ||
                              input.retainedSources.some((s) =>
                                  s.text.includes(row.context),
                              )) &&
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
