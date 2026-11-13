import { readFile, writeFile } from "node:fs/promises";
import { parseEnv } from "node:util";
import { randomUUID } from "node:crypto";
import {
    initializeApp,
    deleteApp,
} from "../backend/node_modules/firebase-admin/lib/app/index.js";
import { getFirestore } from "../backend/node_modules/firebase-admin/lib/firestore/index.js";
import { CaptureMemory } from "../backend/lib/src/memory/capture.js";
import { FirestoreCaptureStore } from "../backend/lib/src/firebase/capture-store.js";
import { QueryMemory } from "../backend/lib/src/query/query.js";
import { FirestoreQueryStore } from "../backend/lib/src/firebase/query-store.js";
import { canonicalMemory } from "../backend/lib/src/query/search-projection.js";
import { OpenAiMemory } from "../backend/lib/memory-core/openai.js";
import { openRuntime } from "../prototypes/memory/src/runtime.ts";
import * as regression from "./k3-fixtures.mjs";
import * as reserve from "./k3-reserve.mjs";

const normalize = (text) =>
    text
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase();
const fresh = process.argv.slice(2).join(" ") === "--live --fresh";
const { stories, questions } = fresh ? reserve : regression;
const reportPath = `docs/09-planning/k3-live-smoke-2026-11-13-${fresh ? "reserve" : "regression"}-${Date.now()}.json`;
async function main() {
    if (
        (!fresh && process.argv.slice(2).join(" ") !== "--live") ||
        process.env.GCLOUD_PROJECT !== "demo-kioku-local" ||
        process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:8087" ||
        process.env.FIREBASE_AUTH_EMULATOR_HOST !== "127.0.0.1:9097"
    )
        throw new Error("Isolated live query required");
    if (
        ["NODE_DEBUG", "GRPC_TRACE", "GOOGLE_SDK_NODE_LOGGING", "DEBUG"].some(
            (name) => process.env[name],
        )
    )
        throw new Error("Debug logging forbidden");
    const key = parseEnv(await readFile(".env.local", "utf8")).OPENAI_API_KEY;
    if (!key) throw new Error("Existing key missing");
    process.env.OPENAI_API_KEY = key;
    const runtime = await openRuntime(true),
        start = { ...runtime.budget.ledger };
    const app = initializeApp(
            { projectId: "demo-kioku-local" },
            "k3-live-smoke",
        ),
        db = getFirestore(app);
    const uid = "k3-synthetic-live",
        now = () => Date.UTC(2026, 10, 13, 12);
    const ids = new Map(),
        rows = [],
        review = [],
        captures = [];
    let completed = false,
        observed;
    const provider = () => {
        observed = new OpenAiMemory(key, runtime.budget);
        return Promise.resolve(observed);
    };
    const checkpoint = async () => {
        const ledger = runtime.budget.ledger;
        const report = {
            stage: completed ? "complete" : "partial",
            model: "gpt-6.1-sol",
            reasoning: "medium",
            role: fresh
                ? "new reserve after adapter repair"
                : "regression after attempt1",
            rows,
            calls: ledger.calls - start.calls,
            inputTokens: ledger.inputTokens - start.inputTokens,
            outputTokens: ledger.outputTokens - start.outputTokens,
            estimatedUsd: ledger.spentUsd - start.spentUsd,
            semanticReview: "pending",
        };
        await writeFile(
            ".setup/k3-synthetic-review.json",
            JSON.stringify({ captures, review }, null, 2) + "\n",
        );
        await writeFile(reportPath, JSON.stringify(report, null, 2) + "\n");
    };
    try {
        await db
            .doc("privateConfiguration/owner")
            .set({ uid, enabled: true, window: 0, count: 1 });
        await db
            .doc("privateConfiguration/search")
            .set({ uid, schema: 1, ready: true });
        const captureStore = new FirestoreCaptureStore(db, now),
            capture = new CaptureMemory(captureStore);
        const queryStore = new FirestoreQueryStore(db, now),
            query = new QueryMemory(queryStore, now);
        for (const [label, text] of stories) {
            const requestId = randomUUID();
            const saved = await capture.execute(
                uid,
                {
                    apiVersion: 1,
                    requestId,
                    mode: "tell",
                    channel: "text",
                    text,
                    zone: "Europe/Madrid",
                },
                provider,
                async () => {},
            );
            if (saved.status !== "saved")
                throw new Error("Synthetic capture failed");
            ids.set(label, requestId);
            const memories = await db
                .collection(`accounts/${uid}/memories`)
                .where("sourceId", "==", requestId)
                .get();
            captures.push({
                id: label,
                items: memories.docs.map((document) => {
                    const memory = canonicalMemory(document.data());
                    return {
                        kind: memory.kind,
                        text: memory.text,
                        quote: memory.quote,
                        time: memory.time,
                        provenance: memory.provenance,
                        eventStatus: memory.eventStatus,
                        lifecycle: memory.lifecycle,
                    };
                }),
            });
            console.log(
                JSON.stringify({
                    stage: "capture",
                    caseId: label,
                    status: saved.status,
                }),
            );
            await checkpoint();
        }
        const synthetic = (
            await db.collection(`accounts/${uid}/memories`).get()
        ).docs.map((doc) => canonicalMemory(doc.data()));
        await writeFile(
            ".setup/k3-synthetic-captures.json",
            JSON.stringify({
                ids: [...ids],
                memories: synthetic,
                sources: stories.map(([label, text]) => ({
                    id: ids.get(label),
                    text,
                    receivedAt: new Date(now()).toISOString(),
                    zone: "Europe/Madrid",
                })),
            }),
        );
        for (const item of questions) {
            const requestId = randomUUID(),
                started = performance.now();
            try {
                const result = await query.execute(
                    uid,
                    { apiVersion: 1, requestId, text: item.text },
                    provider,
                    async () => {},
                );
                const durationMs = Math.round(performance.now() - started),
                    check = observed.lastCheck;
                const text = normalize(result.text);
                const references = result.sources.map(
                    (source) =>
                        [...ids.entries()].find(
                            ([, id]) => id === source.sourceId,
                        )?.[0] ?? "unknown",
                );
                const intel = await provider(),
                    vector = (await intel.embed([item.text]))[0];
                const retrieved = await queryStore.retrieve(
                    uid,
                    item.text,
                    vector,
                );
                const retrievedIds = new Set(
                    retrieved.snapshot.memories.map(
                        (memory) => memory.sourceId,
                    ),
                );
                const coverage = item.sources.every((label) =>
                    retrievedIds.has(ids.get(label)),
                );
                const match =
                    result.status === item.status &&
                    item.sources.every((label) => references.includes(label)) &&
                    item.words.every((word) => text.includes(word)) &&
                    (item.forbidden ?? []).every(
                        (word) => !text.includes(word),
                    );
                const row = {
                    id: item.id,
                    category: item.category,
                    status: result.status,
                    references,
                    coverage,
                    automaticMatch: match,
                    durationMs,
                };
                rows.push(row);
                review.push({
                    id: item.id,
                    text: result.text,
                    status: result.status,
                    references,
                    check,
                });
                console.log(JSON.stringify(row));
            } catch (error) {
                const code =
                    typeof error?.code === "string"
                        ? error.code
                        : /^[A-Z_]{1,80}$/.test(error?.message ?? "")
                          ? error.message
                          : "SAFE_QUERY_FAILURE";
                rows.push({
                    id: item.id,
                    category: item.category,
                    status: "error",
                    code,
                    automaticMatch: false,
                    durationMs: Math.round(performance.now() - started),
                });
                console.log(
                    JSON.stringify({ id: item.id, status: "error", code }),
                );
            }
            await checkpoint();
        }
        completed = true;
        await checkpoint();
        console.log(
            JSON.stringify({
                stage: "complete",
                cases: rows.length,
                automaticMatches: rows.filter((row) => row.automaticMatch)
                    .length,
                estimatedUsd: runtime.budget.ledger.spentUsd - start.spentUsd,
            }),
        );
    } finally {
        await checkpoint();
        await db.recursiveDelete(db.doc(`accounts/${uid}`));
        await db.doc("privateConfiguration/owner").delete();
        await db.doc("privateConfiguration/search").delete();
        await db.terminate();
        await deleteApp(app);
        await runtime.close();
        delete process.env.OPENAI_API_KEY;
    }
}
main().catch(() => {
    console.error(
        "K3_LIVE_SMOKE_FAILED; review safe case status and budget before proceeding.",
    );
    process.exitCode = 1;
});
