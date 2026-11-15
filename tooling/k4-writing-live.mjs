import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { parseEnv } from "node:util";
import { openRuntime, reportError } from "../prototypes/memory/src/runtime.ts";
import { MemoryEngine } from "../backend/lib/memory-core/engine.js";
import { OpenAiMemory } from "../backend/lib/memory-core/openai.js";
import { modelProfile } from "../backend/lib/memory-core/model-config.js";
import { interpretCapture } from "../backend/lib/src/memory/interpretation.js";
import { ChangeMemory } from "../backend/lib/src/memory-control/change.js";
import { RouteMessage } from "../backend/lib/src/conversation/route.js";
import { sharedCases, checkSharedCorrection } from "./k4-writing-shared.mjs";
import { scopeVersion } from "../backend/lib/src/memory-control/retirement.js";

const at = "2026-11-15T13:00:00Z";
const zone = "Europe/Madrid";
const ambiguous = "quiero jugary prender";
const complete = "Quiero jugar a la Play y aprender japonés.";
const cases = [
    { id: "joined-ambiguous", text: ambiguous, count: 0 },
    {
        id: "complete-rephrasing",
        text: ambiguous,
        clarification: complete,
        count: 2,
        words: [/Play/iu, /japonés/iu],
    },
    {
        id: "latest-rephrasing",
        text: ambiguous,
        clarification: `jugary prender\n${complete}`,
        count: 2,
        words: [/Play/iu, /japonés/iu],
    },
    {
        id: "unrelated-fact-survives-rephrasing",
        text: `${ambiguous}. El examen de japonés es el 20 de noviembre de 2026.`,
        clarification: "La primera frase era: quiero jugar a la Play.",
        count: 2,
        words: [/Play/iu, /examen/iu],
        dated: "2026-11-20",
    },
    {
        id: "ordinary-typing-errors",
        text: "manana qiero jugar a la play",
        count: 1,
        words: [/Play/iu],
        dated: "2026-11-16",
    },
    {
        id: "unaccented-weekday",
        text: "El sabado tengo un examen de japonés.",
        count: 1,
        words: [/examen/iu],
        dated: "2026-11-21",
    },
    {
        id: "invalid-date-needs-rephrasing",
        text: "Quiero ir a clase el 31 de febrero de 2026.",
        count: 0,
    },
];

async function main() {
    const routingOnly = process.argv.slice(2).join(" ") === "--live --routing";
    const sharedOnly = process.argv.slice(2).join(" ") === "--live --shared";
    if (
        !sharedOnly &&
        !routingOnly &&
        process.argv.slice(2).join(" ") !== "--live"
    )
        throw Error("Explicit --live required");
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
        before = runtime.budget.ledger.spentUsd;
    const rows = [],
        file = `docs/09-planning/k4-writing-${Date.now()}.json`;
    let calls = 0;
    const ai = new OpenAiMemory(
        process.env.OPENAI_API_KEY,
        runtime.budget,
        async (url, init) => {
            calls++;
            return fetch(url, init);
        },
    );
    const report = () =>
        writeFile(
            file,
            JSON.stringify(
                {
                    kind: "synthetic-writing-and-rephrasing",
                    profile: modelProfile,
                    resolvedModel: ai.resolvedModel,
                    at,
                    firebaseWrites: 0,
                    apiCalls: calls,
                    estimatedUsd: runtime.budget.ledger.spentUsd - before,
                    rows,
                },
                null,
                2,
            ),
        );
    async function check(id, action) {
        try {
            const result = await action();
            rows.push({ id, passed: true, result });
        } catch (error) {
            rows.push({
                id,
                passed: false,
                code:
                    error?.name === "MemoryError" &&
                    /^[A-Z0-9_]{1,100}$/u.test(error.message)
                        ? error.message
                        : "ACCEPTANCE_CHECK_FAILED",
            });
        }
        await report();
        const row = rows.at(-1);
        console.log(
            JSON.stringify({ id: row.id, passed: row.passed, code: row.code }),
        );
    }
    async function capture(text, clarification = null) {
        let snapshot = { version: 4, sources: [], memories: [] };
        const engine = new MemoryEngine(
            {
                load: async () => snapshot,
                save: async (next) => {
                    snapshot = next;
                },
            },
            ai,
        );
        const extraction = await interpretCapture(
            engine,
            { id: randomUUID(), text, receivedAt: at, zone },
            clarification,
        );
        return { snapshot, extraction };
    }
    try {
        if (sharedOnly) {
            for (const item of sharedCases)
                await check(item.id, () =>
                    checkSharedCorrection(item, ai, capture, at, zone),
                );
            if (rows.some((r) => !r.passed)) process.exitCode = 1;
            return;
        }
        await check("main-message-routing-and-full-rephrasing", async () => {
            const routing = new RouteMessage(
                {
                    begin: async (_uid, input) => ({
                        requestId: input.requestId,
                        nonce: randomUUID(),
                        receivedAt: at,
                    }),
                    epoch: async () => 0,
                    issue: async () => {},
                    fail: async () => {},
                    retrieve: async () => {
                        throw Error(
                            "New text must not retrieve a correction target",
                        );
                    },
                },
                {},
            );
            let first;
            for (const text of [
                ambiguous,
                `${ambiguous}\nAclaración: ${complete}`,
            ]) {
                const route = await routing.execute(
                    "synthetic-owner",
                    {
                        apiVersion: 1,
                        requestId: randomUUID(),
                        text,
                        mode: "tell",
                        zone,
                        memoryEpoch: 0,
                        context: { questions: [], sourceIds: [] },
                    },
                    async () => ai,
                    async () => {},
                );
                if (first === undefined) {
                    first = route.status;
                    if (route.status === "needsClarification") {
                        assert.match(
                            route.text,
                            /reescrib|reformul|separa|frase completa/iu,
                        );
                    } else assert.equal(route.plan?.action, "tell");
                } else {
                    assert.equal(route.status, "ready");
                    assert.equal(route.plan.action, "tell");
                    const { snapshot, extraction } = await capture(text);
                    assert.equal(extraction.status, "saved");
                    assert.equal(snapshot.memories.length, 2);
                    assert.ok(
                        snapshot.memories.some(
                            (m) =>
                                /Play/iu.test(m.text) &&
                                !/aprender/iu.test(m.text),
                        ),
                    );
                    assert.ok(
                        snapshot.memories.some(
                            (m) =>
                                /aprender japonés/iu.test(m.text) &&
                                !/Play/iu.test(m.text),
                        ),
                    );
                    return { firstRoute: first, extraction };
                }
            }
        });
        if (routingOnly) {
            if (rows.some((r) => !r.passed)) process.exitCode = 1;
            return;
        }
        for (const item of cases)
            await check(item.id, async () => {
                const { extraction, snapshot } = await capture(
                    item.text,
                    item.clarification,
                );
                assert.equal(snapshot.memories.length, item.count);
                if (!item.count) {
                    assert.equal(extraction.status, "needs_clarification");
                    assert.ok(extraction.clarification?.trim());
                    assert.equal(snapshot.sources.length, 0);
                    if (item.id === "joined-ambiguous") {
                        assert.match(
                            extraction.clarification,
                            /reescrib|reformul|separa|frase completa/iu,
                        );
                        assert.doesNotMatch(
                            extraction.clarification,
                            /encender|aprender/iu,
                        );
                    }
                    return { extraction };
                }
                assert.equal(extraction.status, "saved");
                const text = snapshot.memories.map((m) => m.text).join("\n");
                for (const word of item.words) assert.match(text, word);
                assert.doesNotMatch(text, /jugary|\bprender\b/iu);
                if (item.dated)
                    assert.ok(
                        snapshot.memories.some(
                            (m) =>
                                m.time.precision === "day" &&
                                m.time.value === item.dated,
                        ),
                    );
                return { extraction };
            });
        await check(
            "management-rejects-ambiguous-edit-and-accepts-rewrite",
            async () => {
                const saved = await capture("Quiero leer un cómic mañana.");
                assert.equal(saved.extraction.status, "saved");
                let current = saved.snapshot,
                    noChanges = 0,
                    commits = 0;
                const source = current.sources[0];
                const scope = {
                    scope: "entireSource",
                    sourceId: source.id,
                    sourceVersion: "1:1",
                    memories: current.memories.map((m) => ({
                        id: m.id,
                        version: "1:1",
                    })),
                    expiresAtMs: Date.parse(at) + 300000,
                };
                const bundle = {
                    scope,
                    source,
                    memories: current.memories,
                    memoryEpoch: 0,
                    ownerTextVersion: 1,
                };
                const store = {
                    begin: async (_uid, input) => ({
                        requestId: input.requestId,
                        nonce: randomUUID(),
                    }),
                    bundle: async () => bundle,
                    noChange: async (_uid, work, text) => {
                        noChanges++;
                        return {
                            apiVersion: 1,
                            operationId: work.requestId,
                            status: "needsClarification",
                            text,
                            sources: [],
                            memoryEpoch: 0,
                        };
                    },
                    commit: async (_uid, input, _scope, snapshot) => {
                        commits++;
                        current = snapshot;
                        return {
                            apiVersion: 1,
                            operationId: input.requestId,
                            status: "corrected",
                            text: "Dato corregido.",
                            sources: [],
                            memoryEpoch: 1,
                        };
                    },
                    fail: async () => {
                        throw Error("Unexpected failure");
                    },
                };
                const service = new ChangeMemory(store, () => Date.parse(at));
                const input = {
                    apiVersion: 1,
                    requestId: randomUUID(),
                    sourceId: source.id,
                    expectedVersion: scopeVersion(scope),
                    memoryIds: [current.memories[0].id],
                    action: "correct",
                    correction: ambiguous,
                    zone,
                };
                const original = JSON.stringify(current);
                const rejected = await service.execute(
                    "synthetic-owner",
                    input,
                    async () => ai,
                    async () => {},
                );
                assert.equal(rejected.status, "needsClarification");
                assert.match(rejected.text, /^No he modificado el recuerdo\./u);
                assert.equal(JSON.stringify(current), original);
                assert.equal(noChanges, 1);
                assert.equal(commits, 0);
                const corrected = await service.execute(
                    "synthetic-owner",
                    {
                        ...input,
                        requestId: randomUUID(),
                        correction: "manana qiero jugar al ajedrez",
                    },
                    async () => ai,
                    async () => {},
                );
                assert.equal(corrected.status, "corrected");
                assert.equal(commits, 1);
                assert.equal(current.memories.length, 1);
                assert.match(current.memories[0].text, /ajedrez/iu);
                assert.equal(current.memories[0].time.value, "2026-11-16");
                assert.doesNotMatch(
                    current.sources.map((s) => s.text).join("\n"),
                    /cómic/iu,
                );
                return {
                    rejected,
                    corrected: current.memories.map(
                        ({ vector: _vector, ...memory }) => memory,
                    ),
                    commits,
                    noChanges,
                };
            },
        );
        console.log(
            JSON.stringify({
                file,
                passed: rows.filter((r) => r.passed).length,
                total: rows.length,
                apiCalls: calls,
                estimatedUsd: runtime.budget.ledger.spentUsd - before,
            }),
        );
        if (rows.some((r) => !r.passed)) process.exitCode = 1;
    } finally {
        await runtime.close();
    }
}
main().catch(reportError);
