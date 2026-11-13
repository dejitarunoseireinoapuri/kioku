import { readFile, writeFile } from "node:fs/promises";
import { parseEnv } from "node:util";
import { randomUUID } from "node:crypto";
import { MemoryEngine } from "../prototypes/memory/src/engine.ts";
import { openRuntime } from "../prototypes/memory/src/runtime.ts";
import { cases, stories } from "./k3-context-fixtures.mjs";

const normalize = (value) =>
    value
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase();
const at = "2026-11-13T12:00:00Z";
const reportPath = `docs/09-planning/k3-context-2026-11-13-${Date.now()}.json`;
let stage = "initial";
async function main() {
    if (process.argv.slice(2).join(" ") !== "--live")
        throw Error("Explicit live flag required");
    if (
        ["DEBUG", "NODE_DEBUG", "GRPC_TRACE", "GOOGLE_SDK_NODE_LOGGING"].some(
            (name) => process.env[name],
        )
    ) {
        throw Error("Debug logging forbidden");
    }
    stage = "load-existing-key";
    process.env.OPENAI_API_KEY = parseEnv(
        await readFile(".env.local", "utf8"),
    ).OPENAI_API_KEY;
    stage = "open-runtime";
    const runtime = await openRuntime(true);
    const start = { ...runtime.budget.ledger };
    let snapshot = { version: 4, sources: [], memories: [] };
    const engine = new MemoryEngine(
        {
            load: async () => structuredClone(snapshot),
            save: async (next) => {
                snapshot = next;
            },
        },
        runtime.intelligence,
    );
    const ids = new Map();
    const rows = [],
        review = [];
    let complete = false;
    const checkpoint = async () => {
        await writeFile(
            reportPath,
            JSON.stringify(
                {
                    stage: complete ? "complete" : "partial",
                    model: "gpt-6.1-sol",
                    reasoning: "medium",
                    scope: "M0 pipeline, contextual client question text, synthetic in-memory sources; no production Firebase",
                    rows,
                    estimatedUsd:
                        runtime.budget.ledger.spentUsd - start.spentUsd,
                    calls: runtime.budget.ledger.calls - start.calls,
                },
                null,
                2,
            ) + "\n",
        );
        await writeFile(
            ".setup/k3-context-review.json",
            JSON.stringify({ stories, review }, null, 2),
        );
    };
    try {
        for (const [label, text] of stories) {
            stage = "synthetic-capture";
            const id = randomUUID();
            const result = await engine.tell({
                id,
                text,
                receivedAt: at,
                zone: "Europe/Madrid",
            });
            if (result.status !== "saved")
                throw Error("Synthetic capture failed");
            ids.set(label, id);
            console.log(
                JSON.stringify({
                    caseId: label,
                    stage: "synthetic-capture",
                    status: result.status,
                }),
            );
            await checkpoint();
        }
        for (const item of cases) {
            stage = "synthetic-query";
            const text = item.previous.length
                ? JSON.stringify({
                      pregunta_actual: item.current,
                      preguntas_anteriores_solo_contexto: item.previous,
                  })
                : item.current;
            if (text.length > 2000 || item.previous.length > 4)
                throw Error("Client protocol bound exceeded");
            const started = performance.now();
            const { answer } = await engine.ask(text, at);
            const normalized = normalize(answer.answer);
            const references = answer.sourceIds.map(
                (id) =>
                    [...ids].find(([, source]) => source === id)?.[0] ??
                    "unknown",
            );
            const row = {
                id: item.id,
                status: answer.status,
                references,
                automaticMatch:
                    item.statuses.includes(answer.status) &&
                    item.sources.every((label) => references.includes(label)) &&
                    item.words.every((word) =>
                        normalized.includes(normalize(word)),
                    ) &&
                    (item.forbidden ?? []).every(
                        (word) => !normalized.includes(normalize(word)),
                    ) &&
                    (!item.any ||
                        item.any.some((word) =>
                            normalized.includes(normalize(word)),
                        )),
                durationMs: Math.round(performance.now() - started),
            };
            rows.push(row);
            review.push({ id: item.id, answer, expected: item.sources });
            console.log(JSON.stringify(row));
            await checkpoint();
        }
        complete = true;
        await checkpoint();
        console.log(
            JSON.stringify({
                stage: "complete",
                matched: rows.filter((row) => row.automaticMatch).length,
                cases: rows.length,
                estimatedUsd: runtime.budget.ledger.spentUsd - start.spentUsd,
            }),
        );
    } finally {
        try {
            await checkpoint();
        } finally {
            await runtime.close();
            delete process.env.OPENAI_API_KEY;
        }
    }
}
main().catch((error) => {
    const code = /^[A-Z_]{1,80}$/.test(error?.code ?? "")
        ? error.code
        : /^[A-Z_]{1,80}$/.test(error?.message ?? "")
          ? error.message
          : "SAFE_FAILURE";
    console.error(
        `K3_CONTEXT_LIVE_FAILED: ${stage} ${code}; inspect safe case results and the preserved budget.`,
    );
    console.error(
        JSON.stringify({
            type: /^[A-Za-z]{1,40}$/.test(error?.name ?? "")
                ? error.name
                : "unknown",
            fields: Array.isArray(error?.issues)
                ? error.issues.map((issue) => ({
                      code: issue.code,
                      path: issue.path,
                  }))
                : [],
        }),
    );
    process.exitCode = 1;
});
