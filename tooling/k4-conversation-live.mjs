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
import { OpenAiMemory } from "../backend/lib/memory-core/openai.js";
import { openRuntime } from "../prototypes/memory/src/runtime.ts";
import { cases as originalCases } from "./k4-conversation-fixtures.mjs";
import { reserve } from "./k4-conversation-reserve.mjs";
import { acceptance } from "./k4-conversation-acceptance.mjs";
import { FirestoreQueryStore } from "../backend/lib/src/firebase/query-store.js";
import { QueryMemory } from "../backend/lib/src/query/query.js";

const norm = (value) =>
    value
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase();
async function main() {
    if (
        ![
            "--live",
            "--live --reserve",
            "--live --dates",
            "--live --acceptance",
        ].includes(process.argv.slice(2).join(" ")) ||
        process.env.GCLOUD_PROJECT !== "demo-kioku-local" ||
        process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:8087" ||
        process.env.FIREBASE_AUTH_EMULATOR_HOST !== "127.0.0.1:9097"
    )
        throw Error("Explicit isolated run required");
    if (
        ["NODE_DEBUG", "GRPC_TRACE", "GOOGLE_SDK_NODE_LOGGING", "DEBUG"].some(
            (key) => process.env[key],
        )
    )
        throw Error("Tracing forbidden");
    process.env.OPENAI_API_KEY = parseEnv(
        await readFile(".env.local", "utf8"),
    ).OPENAI_API_KEY;
    const runtime = await openRuntime(true);
    const app = initializeApp(
        { projectId: "demo-kioku-local" },
        "k4-conversation-live",
    );
    const db = getFirestore(app),
        uid = "k4-conversation-live",
        root = db.doc(`accounts/${uid}`);
    const corpus = process.argv[3]?.slice(2) ?? "initial";
    const fresh = ["reserve", "acceptance"].includes(corpus);
    const cases =
        corpus === "acceptance"
            ? acceptance
            : corpus === "dates"
              ? reserve.filter((f) => ["s02", "s07"].includes(f.id))
              : fresh
                ? reserve
                : originalCases;
    const initial = { ...runtime.budget.ledger },
        rows = [],
        review = [];
    const stamp = Date.now();
    const report = `docs/09-planning/k4-conversation-${corpus}-${stamp}.json`;
    const corpusHash = createHash("sha256")
        .update(JSON.stringify(cases))
        .digest("hex");
    const previous = await Promise.all(
        (await readdir("docs/09-planning"))
            .filter((name) =>
                /^k4-conversation-(?:[a-z]+-)?\d+\.json$/u.test(name),
            )
            .map(async (name) =>
                JSON.parse(await readFile(`docs/09-planning/${name}`, "utf8")),
            ),
    );
    const observed = previous.some(
        (item) => item.corpusHash === corpusHash && item.calls > 0,
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
                    evaluation:
                        fresh && !observed ? "fresh-reserve" : "regression",
                    scope: "Frozen synthetic local cases with actual provider; no production or native attestation",
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
            `.setup/k4-conversation-${corpus}-${stamp}-review.json`,
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
            let now = Date.parse(
                fixture.midnight
                    ? "2026-11-14T22:59:30Z"
                    : "2026-11-14T12:00:00Z",
            );
            const capture = new CaptureMemory(
                new FirestoreCaptureStore(db, () => now),
            );
            let original;
            if (fixture.story) {
                original = await capture.execute(
                    uid,
                    {
                        apiVersion: 1,
                        requestId: randomUUID(),
                        mode: "tell",
                        channel: "text",
                        text: fixture.story,
                        zone: "Europe/Madrid",
                    },
                    provider,
                    async () => {},
                );
                if (original.status !== "saved")
                    throw Error("FIXTURE_CAPTURE_FAILED");
            }
            const store = new FirestoreRoutingStore(db, () => now),
                sources = new FirestoreSourceControlStore(db, () => now);
            const input = {
                apiVersion: 1,
                requestId: randomUUID(),
                mode: fixture.mode ?? "ask",
                text: fixture.message,
                zone: "Europe/Madrid",
                memoryEpoch: 0,
                context: {
                    questions: fixture.context
                        ? ["¿Qué película quiero ver?"]
                        : [],
                    sourceIds: fixture.context ? [original.sourceId] : [],
                },
            };
            const started = performance.now();
            const routed = await new RouteMessage(store, sources).execute(
                uid,
                input,
                provider,
                async () => {},
            );
            const action =
                routed.status === "ready"
                    ? routed.plan.action
                    : routed.status === "needsClarification"
                      ? "clarify"
                      : routed.status;
            let result = null,
                replayCalls = 0;
            if (action === fixture.action && routed.status === "ready") {
                if (["correct", "forget", "offer"].includes(action)) {
                    const command = {
                        apiVersion: 1,
                        requestId: randomUUID(),
                        turn: input,
                        plan: routed.plan,
                        decision:
                            action === "offer"
                                ? (fixture.decide ?? "reject")
                                : "apply",
                    };
                    if (fixture.midnight) now += 60_000;
                    const apply = new ApplyMessage(
                        store,
                        sources,
                        (memoryEpoch, receivedAt) =>
                            new FirestoreCaptureStore(db, () => now, {
                                memoryEpoch,
                                receivedAt,
                            }),
                    );
                    result = await apply.execute(
                        uid,
                        command,
                        provider,
                        async () => {},
                    );
                    const before = runtime.budget.ledger.calls;
                    const replay = await apply.execute(
                        uid,
                        command,
                        provider,
                        async () => {},
                    );
                    replayCalls = runtime.budget.ledger.calls - before;
                    if (replay.status !== result.status)
                        throw Error("REPLAY_MISMATCH");
                } else if (action === "tell") {
                    result = await capture.execute(
                        uid,
                        {
                            apiVersion: 1,
                            requestId: randomUUID(),
                            mode: "tell",
                            channel: "text",
                            text: fixture.message,
                            zone: "Europe/Madrid",
                        },
                        provider,
                        async () => {},
                    );
                }
            }
            const sourceDocs = await root.collection("sources").get(),
                memoryDocs = await root.collection("memories").get();
            const text = JSON.stringify({
                sources: sourceDocs.docs.map((d) => d.data()),
                memories: memoryDocs.docs.map((d) => d.data()),
            });
            const present =
                !fixture.present || norm(text).includes(norm(fixture.present));
            const absent =
                !fixture.absent || !norm(text).includes(norm(fixture.absent));
            const keep =
                !fixture.keep || norm(text).includes(norm(fixture.keep));
            const expectedStatus =
                action === "correct"
                    ? "corrected"
                    : action === "forget"
                      ? "forgotten"
                      : action === "offer"
                        ? fixture.decide === "accept"
                            ? "saved"
                            : "declined"
                        : action === "tell"
                          ? "saved"
                          : null;
            const statusOk =
                expectedStatus === null || result?.status === expectedStatus;
            const asked =
                fixture.alsoAsk !== true ||
                (routed.status === "ready" &&
                    routed.plan.action === "offer" &&
                    routed.plan.alsoAsk);
            const queryRows = [],
                queryResults = [];
            for (const [index, question] of (fixture.queries ?? []).entries()) {
                const response = await new QueryMemory(
                    new FirestoreQueryStore(db, () => now),
                    () => now,
                ).execute(
                    uid,
                    {
                        apiVersion: 1,
                        requestId: randomUUID(),
                        text: question.text,
                    },
                    provider,
                    async () => {},
                );
                const words = (question.words ?? []).every((word) =>
                    norm(response.text).includes(norm(word)),
                );
                queryRows.push({
                    index,
                    status: response.status,
                    words,
                    pass: response.status === question.status && words,
                });
                queryResults.push(response);
            }
            const pass =
                action === fixture.action &&
                present &&
                absent &&
                keep &&
                statusOk &&
                asked &&
                replayCalls === 0 &&
                queryRows.every((row) => row.pass);
            rows.push({
                caseId: fixture.id,
                action,
                result: result?.status ?? null,
                present,
                absent,
                keep,
                statusOk,
                asked,
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
                memories: memoryDocs.docs.map((d) => d.data()),
            });
            console.log(JSON.stringify({ caseId: fixture.id, action, pass }));
            await checkpoint();
        }
        complete = true;
        await checkpoint();
        if (rows.some((row) => !row.pass)) process.exitCode = 1;
    } finally {
        await checkpoint();
        await db.recursiveDelete(root);
        await db.terminate();
        await deleteApp(app);
        await runtime.close();
    }
}
main().catch(() => {
    console.error("K4_CONVERSATION_SYNTHETIC_FAILED_DETAILS_REDACTED");
    process.exitCode = 1;
});
