import { readFile, writeFile } from "node:fs/promises";
import { parseEnv } from "node:util";
import { createHash } from "node:crypto";
import { openRuntime } from "../prototypes/memory/src/runtime.ts";
import { MemoryEngine } from "../prototypes/memory/src/engine.ts";
import {
    captureDateCases as initialCases,
    freshCaptureDateCases,
} from "../tooling/capture-date-fixtures.mjs";
const fresh = process.argv[3] === "--fresh";
const captureDateCases = fresh ? freshCaptureDateCases : initialCases;
if (
    process.argv[2] !== "--live" ||
    !["--initial", "--fresh"].includes(process.argv[3]) ||
    process.argv.length !== 4
)
    throw Error("Explicit live synthetic scope required");
if (
    ["NODE_DEBUG", "GRPC_TRACE", "GOOGLE_SDK_NODE_LOGGING", "DEBUG"].some(
        (k) => process.env[k],
    )
)
    throw Error("Tracing forbidden");
process.env.OPENAI_API_KEY = parseEnv(
    await readFile(".env.local", "utf8"),
).OPENAI_API_KEY;
const runtime = await openRuntime(true, 30);
const initial = { ...runtime.budget.ledger },
    stamp = Date.now(),
    rows = [],
    review = [];
const reportFile = `docs/09-planning/capture-dates-${stamp}.json`;
try {
    for (const c of captureDateCases) {
        let snapshot = { version: 4, sources: [], memories: [] };
        const repository = {
            load: async () => snapshot,
            save: async (value) => {
                snapshot = value;
            },
        };
        const engine = new MemoryEngine(repository, runtime.intelligence);
        let status = "error",
            code = null;
        try {
            status = (
                await engine.tell({
                    id: c.id,
                    text: c.text,
                    receivedAt: c.at,
                    zone: "Europe/Madrid",
                })
            ).status;
        } catch (error) {
            code =
                error.name === "MemoryError" &&
                /^[A-Z0-9_]{1,120}$/.test(error.message)
                    ? error.message
                    : "UNCLASSIFIED";
        }
        const dates = c.expected.every((e) =>
            snapshot.memories.some(
                (m) =>
                    m.text.toLowerCase().includes(e.term) &&
                    e.dates.includes(m.time.value),
            ),
        );
        const shape =
            c.status === "saved"
                ? snapshot.sources.length === 1 && snapshot.memories.length > 0
                : snapshot.sources.length === 0;
        const quotes = snapshot.memories.filter(
            (m) => m.provenance === "quoted",
        );
        const quotation =
            !c.quoted ||
            (fresh
                ? quotes.length > 0 &&
                  quotes.every(
                      (m) =>
                          m.time.precision === "unknown" &&
                          m.eventStatus === "unspecified",
                  ) &&
                  snapshot.memories
                      .filter((m) => m.provenance !== "quoted")
                      .every(
                          (m) =>
                              m.kind !== "intention" &&
                              m.eventStatus !== "planned" &&
                              m.time.precision === "unknown",
                      )
                : snapshot.memories.every(
                      (m) =>
                          m.provenance === "quoted" &&
                          m.time.precision === "unknown" &&
                          m.eventStatus === "unspecified",
                  ));
        rows.push({
            id: c.id,
            partition: c.partition,
            status,
            code,
            passed: status === c.status && dates && shape && quotation,
        });
        review.push({ id: c.id, input: c, actual: snapshot });
        await writeFile(
            reportFile,
            JSON.stringify(
                {
                    complete: rows.length === captureDateCases.length,
                    corpusHash: createHash("sha256")
                        .update(JSON.stringify(captureDateCases))
                        .digest("hex"),
                    rows,
                    calls: runtime.budget.ledger.calls - initial.calls,
                    estimatedUsd:
                        runtime.budget.ledger.spentUsd - initial.spentUsd,
                },
                null,
                2,
            ),
        );
        await writeFile(
            `.setup/capture-dates-${stamp}-review.json`,
            JSON.stringify(review, null, 2),
        );
    }
    console.log(
        JSON.stringify({
            report: reportFile,
            passed: rows.filter((r) => r.passed).length,
            total: rows.length,
            calls: runtime.budget.ledger.calls - initial.calls,
            estimatedUsd: runtime.budget.ledger.spentUsd - initial.spentUsd,
        }),
    );
} finally {
    await runtime.close();
}
