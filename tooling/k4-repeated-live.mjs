import { readFile, writeFile, readdir } from "node:fs/promises";
import { parseEnv } from "node:util";
import { createHash, randomUUID } from "node:crypto";
import {
    initializeApp,
    deleteApp,
} from "../backend/node_modules/firebase-admin/lib/app/index.js";
import { getFirestore } from "../backend/node_modules/firebase-admin/lib/firestore/index.js";
import { CaptureMemory } from "../backend/lib/src/memory/capture.js";
import { FirestoreCaptureStore } from "../backend/lib/src/firebase/capture-store.js";
import { FirestoreSourceControlStore } from "../backend/lib/src/firebase/source-control-store.js";
import { FirestoreRoutingStore } from "../backend/lib/src/firebase/routing-store.js";
import { RouteMessage } from "../backend/lib/src/conversation/route.js";
import { ApplyMessage } from "../backend/lib/src/conversation/apply.js";
import { FirestoreQueryStore } from "../backend/lib/src/firebase/query-store.js";
import { QueryMemory } from "../backend/lib/src/query/query.js";
import { OpenAiMemory } from "../backend/lib/memory-core/openai.js";
import { openRuntime } from "../prototypes/memory/src/runtime.ts";
import { cases as initialCases } from "./k4-repeated-fixtures.mjs";
import { reserve } from "./k4-repeated-reserve.mjs";
import { finalCases } from "./k4-repeated-final.mjs";
import { ChangeMemory } from "../backend/lib/src/memory-control/change.js";

const norm = (text) =>
    text
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase();
async function main() {
    if (
        !["--live", "--live --reserve", "--live --final"].includes(
            process.argv.slice(2).join(" "),
        ) ||
        process.env.GCLOUD_PROJECT !== "demo-kioku-local" ||
        process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:8087" ||
        process.env.FIREBASE_AUTH_EMULATOR_HOST !== "127.0.0.1:9097"
    )
        throw Error("Explicit isolated run required");
    if (
        ["NODE_DEBUG", "GRPC_TRACE", "GOOGLE_SDK_NODE_LOGGING", "DEBUG"].some(
            (k) => process.env[k],
        )
    )
        throw Error("Tracing forbidden");
    process.env.OPENAI_API_KEY = parseEnv(
        await readFile(".env.local", "utf8"),
    ).OPENAI_API_KEY;
    // Owner authorized the necessary spend; keep the entire existing ledger and reservations.
    const runtime = await openRuntime(true, 30);
    const corpus = process.argv[3]?.slice(2) ?? "initial";
    const prefix = corpus === "initial" ? "" : `${corpus}-`;
    const cases =
        corpus === "final"
            ? finalCases
            : corpus === "reserve"
              ? reserve
              : initialCases;
    const app = initializeApp(
            { projectId: "demo-kioku-local" },
            "k4-repeated-live",
        ),
        db = getFirestore(app);
    const uid = "k4-repeated-live",
        root = db.doc(`accounts/${uid}`),
        at = Date.parse("2026-11-14T12:00:00Z");
    const initial = { ...runtime.budget.ledger },
        stamp = Date.now(),
        rows = [],
        review = [];
    const report = `docs/09-planning/k4-repeated-${prefix}${stamp}.json`,
        corpusHash = createHash("sha256")
            .update(JSON.stringify(cases))
            .digest("hex");
    const previous = await Promise.all(
        (await readdir("docs/09-planning"))
            .filter((n) => /^k4-repeated-(?:[a-z]+-)?\d+\.json$/u.test(n))
            .map(async (n) =>
                JSON.parse(await readFile(`docs/09-planning/${n}`, "utf8")),
            ),
    );
    const observed = previous.some(
        (r) => r.corpusHash === corpusHash && r.calls > 0,
    );
    let complete = false;
    const checkpoint = async () => {
        await writeFile(
            report,
            JSON.stringify(
                {
                    stage: complete ? "complete" : "partial",
                    model: "gpt-6.1-sol",
                    reasoning: "medium",
                    corpusHash,
                    evaluation: observed ? "regression" : "fresh-reserve",
                    scope: "Synthetic complete-inventory local execution with actual provider; no production/native attestation",
                    rows,
                    calls: runtime.budget.ledger.calls - initial.calls,
                    estimatedUsd:
                        runtime.budget.ledger.spentUsd - initial.spentUsd,
                },
                null,
                2,
            ) + "\n",
        );
        await writeFile(
            `.setup/k4-repeated-${prefix}${stamp}-review.json`,
            JSON.stringify({ cases, review }, null, 2),
        );
    };
    try {
        await db
            .doc("privateConfiguration/owner")
            .set({ uid, enabled: true, window: 0, count: 1 });
        await db
            .doc("privateConfiguration/search")
            .set({ uid, schema: 1, ready: true });
        const provider = async () =>
            new OpenAiMemory(process.env.OPENAI_API_KEY, runtime.budget);
        for (const fixture of cases) {
            await db.recursiveDelete(root);
            const captureStore = new FirestoreCaptureStore(db, () => at),
                capture = new CaptureMemory(captureStore),
                original = [];
            const started = performance.now();
            for (const story of fixture.stories) {
                const result = await capture.execute(
                    uid,
                    {
                        apiVersion: 1,
                        requestId: randomUUID(),
                        mode: "tell",
                        channel: "text",
                        text: story,
                        zone: "Europe/Madrid",
                    },
                    provider,
                    async () => {},
                );
                if (result.status !== "saved")
                    throw Error("FIXTURE_CAPTURE_FAILED");
                original.push(result.sourceId);
            }
            const store = new FirestoreRoutingStore(db, () => at),
                sources = new FirestoreSourceControlStore(db, () => at);
            if (fixture.prepareCorrection) {
                const prep = fixture.prepareCorrection,
                    details = await sources.details(
                        uid,
                        original[prep.sourceIndex],
                    );
                const selected = details.items.filter((item) =>
                    norm(item.text).includes(norm(prep.match)),
                );
                if (selected.length !== 1) throw Error("PREPARATION_AMBIGUOUS");
                const corrected = await new ChangeMemory(
                    sources,
                    () => at,
                ).execute(
                    uid,
                    {
                        apiVersion: 1,
                        requestId: randomUUID(),
                        sourceId: details.sourceId,
                        expectedVersion: details.version,
                        memoryIds: [selected[0].id],
                        action: "correct",
                        correction: prep.text,
                        zone: "Europe/Madrid",
                    },
                    provider,
                    async () => {},
                );
                if (corrected.status !== "corrected")
                    throw Error("PREPARATION_FAILED");
                original.splice(
                    0,
                    original.length,
                    ...(await root.collection("sources").get()).docs.map(
                        (d) => d.id,
                    ),
                );
            }
            const input = {
                apiVersion: 1,
                requestId: randomUUID(),
                mode: "ask",
                text: fixture.message,
                zone: "Europe/Madrid",
                memoryEpoch: await sources.epoch(uid),
                context: {
                    questions: [],
                    sourceIds: fixture.contextual ? [original[0]] : [],
                },
            };
            const routed = await new RouteMessage(store, sources).execute(
                uid,
                input,
                provider,
                async () => {},
            );
            let result = null,
                replayCalls = 0;
            const action =
                routed.status === "ready" ? routed.plan.action : routed.status;
            const scopeOk =
                fixture.clarify ||
                (routed.status === "ready" &&
                    routed.plan.action === "forget" &&
                    routed.plan.forgetScope ===
                        (fixture.scope ?? "allOccurrences"));
            if (action === "forget" && scopeOk) {
                const apply = new ApplyMessage(
                    store,
                    sources,
                    (memoryEpoch, receivedAt) =>
                        new FirestoreCaptureStore(db, () => at, {
                            memoryEpoch,
                            receivedAt,
                        }),
                );
                const command = {
                    apiVersion: 1,
                    requestId: randomUUID(),
                    turn: input,
                    plan: routed.plan,
                    decision: "apply",
                };
                result = await apply.execute(
                    uid,
                    command,
                    provider,
                    async () => {},
                );
                const calls = runtime.budget.ledger.calls;
                const replay = await apply.execute(
                    uid,
                    command,
                    provider,
                    async () => {},
                );
                replayCalls = runtime.budget.ledger.calls - calls;
                if (result.status !== replay.status)
                    throw Error("REPLAY_MISMATCH");
            }
            const removed = await Promise.all(
                original.map((id) =>
                    root.collection("revocations").doc(id).get(),
                ),
            );
            const removedCount = removed.filter((d) => d.exists).length;
            const queryRows = [],
                queryResults = [];
            for (const query of fixture.queries ?? []) {
                const answer = await new QueryMemory(
                    new FirestoreQueryStore(db, () => at),
                    () => at,
                ).execute(
                    uid,
                    {
                        apiVersion: 1,
                        requestId: randomUUID(),
                        text: query.text,
                    },
                    provider,
                    async () => {},
                );
                const words = (query.words ?? []).every((w) =>
                    norm(answer.text).includes(norm(w)),
                );
                queryRows.push({
                    status: answer.status,
                    words,
                    pass: answer.status === query.status && words,
                });
                queryResults.push(answer);
            }
            const sourceDocs = await root.collection("sources").get(),
                memoryDocs = await root.collection("memories").get();
            const pass =
                (fixture.clarify
                    ? routed.status === "needsClarification"
                    : result?.status ===
                      (fixture.operationClarify
                          ? "needsClarification"
                          : "forgotten")) &&
                scopeOk &&
                removedCount === fixture.removedSources &&
                replayCalls === 0 &&
                queryRows.every((r) => r.pass);
            rows.push({
                caseId: fixture.id,
                action,
                result: result?.status ?? null,
                scopeOk,
                removedCount,
                expectedRemoved: fixture.removedSources,
                replayCalls,
                queries: queryRows,
                pass,
                durationMs: Math.round(performance.now() - started),
            });
            review.push({
                caseId: fixture.id,
                routed,
                result,
                queryResults,
                sources: sourceDocs.docs.map((d) => d.data()),
                memories: memoryDocs.docs.map((d) => {
                    const { vector, searchVector, ...rest } = d.data();
                    return rest;
                }),
            });
            console.log(JSON.stringify({ caseId: fixture.id, pass, action }));
            await checkpoint();
        }
        complete = true;
        await checkpoint();
        if (rows.some((r) => !r.pass)) process.exitCode = 1;
    } finally {
        await checkpoint();
        await db.recursiveDelete(root);
        await db.terminate();
        await deleteApp(app);
        await runtime.close();
    }
}
main().catch(() => {
    console.error("K4_REPEATED_SYNTHETIC_FAILED_DETAILS_REDACTED");
    process.exitCode = 1;
});
