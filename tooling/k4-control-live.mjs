import { readFile, writeFile } from "node:fs/promises";
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
import { ChangeMemory } from "../backend/lib/src/memory-control/change.js";
import { OpenAiMemory } from "../backend/lib/memory-core/openai.js";
import { openRuntime } from "../prototypes/memory/src/runtime.ts";
import { cases } from "./k4-control-fixtures.mjs";

const normalize = (text) =>
    text
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase();
async function main() {
    if (
        process.argv.slice(2).join(" ") !== "--live" ||
        process.env.GCLOUD_PROJECT !== "demo-kioku-local" ||
        process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:8087" ||
        process.env.FIREBASE_AUTH_EMULATOR_HOST !== "127.0.0.1:9097"
    )
        throw Error("Isolated explicit live run required");
    if (
        ["NODE_DEBUG", "GRPC_TRACE", "GOOGLE_SDK_NODE_LOGGING", "DEBUG"].some(
            (name) => process.env[name],
        )
    )
        throw Error("Payload tracing is forbidden");
    process.env.OPENAI_API_KEY = parseEnv(
        await readFile(".env.local", "utf8"),
    ).OPENAI_API_KEY;
    const runtime = await openRuntime(true);
    const app = initializeApp(
        { projectId: "demo-kioku-local" },
        "k4-control-live",
    );
    const db = getFirestore(app),
        uid = "k4-control-live",
        root = db.doc(`accounts/${uid}`);
    const started = { ...runtime.budget.ledger },
        rows = [],
        review = [];
    const report = `docs/09-planning/k4-control-${Date.now()}.json`;
    const corpusHash = createHash("sha256")
        .update(JSON.stringify(cases))
        .digest("hex");
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
                    scope: "Synthetic local Firestore, actual provider; no production data or native attestation",
                    rows,
                    calls: runtime.budget.ledger.calls - started.calls,
                    estimatedUsd:
                        runtime.budget.ledger.spentUsd - started.spentUsd,
                },
                null,
                2,
            ) + "\n",
        );
        await writeFile(
            ".setup/k4-control-review.json",
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
        const captureAt = Date.parse("2026-11-14T12:00:00Z"),
            changeAt = Date.parse("2026-11-15T12:00:00Z");
        const capture = new CaptureMemory(
            new FirestoreCaptureStore(db, () => captureAt),
        );
        const store = new FirestoreSourceControlStore(db, () => changeAt),
            service = new ChangeMemory(store, () => changeAt);
        const provider = () =>
            new OpenAiMemory(process.env.OPENAI_API_KEY, runtime.budget);
        for (const fixture of cases) {
            await db.recursiveDelete(root);
            const captured = await capture.execute(
                uid,
                {
                    apiVersion: 1,
                    requestId: randomUUID(),
                    mode: "tell",
                    channel: "text",
                    text: fixture.story,
                    zone: "Europe/Madrid",
                },
                async () => provider(),
                async () => {},
            );
            if (captured.status !== "saved")
                throw Error("SYNTHETIC_CAPTURE_NOT_SAVED");
            const source = await store.details(uid, captured.sourceId);
            const ids = fixture.all
                ? source.items.map((item) => item.id)
                : source.items
                      .filter((item) =>
                          normalize(item.text).includes(
                              normalize(fixture.target),
                          ),
                      )
                      .map((item) => item.id);
            if (
                !ids.length ||
                (fixture.action === "correct" && ids.length !== 1)
            )
                throw Error("SYNTHETIC_SCOPE_UNRESOLVED");
            const startedAt = performance.now();
            const input = {
                apiVersion: 1,
                requestId: randomUUID(),
                sourceId: source.sourceId,
                expectedVersion: source.version,
                memoryIds: ids,
                action: fixture.action,
                correction: fixture.correction ?? null,
                zone: "Europe/Madrid",
            };
            const result = await service.execute(
                uid,
                input,
                async () => provider(),
                async () => {},
            );
            const documents = await root.collection("sources").get();
            const memories = await root.collection("memories").get();
            const sourceText = documents.docs
                .map((item) => String(item.get("text")))
                .join("\n");
            const memoryText = memories.docs
                .map((item) => JSON.stringify(item.data()))
                .join("\n");
            const oldRemoved = !(
                await root.collection("sources").doc(source.sourceId).get()
            ).exists;
            const absent = !normalize(sourceText + memoryText).includes(
                normalize(fixture.absent),
            );
            const keep =
                fixture.all ||
                normalize(sourceText + memoryText).includes(
                    normalize(fixture.keep),
                );
            let replayCalls = 0;
            const replay = await service.execute(
                uid,
                input,
                async () => {
                    replayCalls++;
                    return provider();
                },
                async () => {},
            );
            const pass =
                result.status ===
                    (fixture.action === "correct"
                        ? "corrected"
                        : "forgotten") &&
                oldRemoved &&
                absent &&
                keep &&
                replayCalls === 0 &&
                replay.status === result.status;
            rows.push({
                caseId: fixture.id,
                status: result.status,
                oldRemoved,
                absent,
                keep,
                replayCalls,
                pass,
                durationMs: Math.round(performance.now() - startedAt),
            });
            review.push({
                caseId: fixture.id,
                story: fixture.story,
                correction: fixture.correction,
                selected: source.items.filter((item) => ids.includes(item.id)),
                result,
                sources: documents.docs.map((item) => item.data()),
                memories: memories.docs.map((item) => item.data()),
            });
            console.log(
                JSON.stringify({
                    caseId: fixture.id,
                    status: result.status,
                    pass,
                }),
            );
            await checkpoint();
            if (!pass) throw Error("SYNTHETIC_CONTROL_CRITERION_FAILED");
        }
        complete = true;
        await checkpoint();
        console.log(
            JSON.stringify({
                stage: "complete",
                count: rows.length,
                estimatedUsd: runtime.budget.ledger.spentUsd - started.spentUsd,
            }),
        );
    } finally {
        await checkpoint();
        await db.recursiveDelete(root);
        await db.terminate();
        await deleteApp(app);
        await runtime.close();
    }
}
main().catch(() => {
    console.error("K4_SYNTHETIC_RUN_FAILED_DETAILS_REDACTED");
    process.exitCode = 1;
});
