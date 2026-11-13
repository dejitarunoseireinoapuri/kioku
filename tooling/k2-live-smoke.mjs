import { readFile } from "node:fs/promises";
import { parseEnv } from "node:util";
import { randomUUID } from "node:crypto";
import {
    initializeApp,
    deleteApp,
} from "../backend/node_modules/firebase-admin/lib/app/index.js";
import { getFirestore } from "../backend/node_modules/firebase-admin/lib/firestore/index.js";
import { CaptureMemory } from "../backend/lib/src/memory/capture.js";
import { FirestoreCaptureStore } from "../backend/lib/src/firebase/capture-store.js";
import { OpenAiMemory } from "../backend/lib/memory-core/openai.js";
import { openRuntime } from "../prototypes/memory/src/runtime.ts";

async function main() {
    if (
        process.argv.slice(2).join(" ") !== "--live" ||
        process.env.GCLOUD_PROJECT !== "demo-kioku-local" ||
        process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:8087" ||
        process.env.FIREBASE_AUTH_EMULATOR_HOST !== "127.0.0.1:9097"
    )
        throw new Error("Isolated live smoke required");
    if (
        ["NODE_DEBUG", "GRPC_TRACE", "GOOGLE_SDK_NODE_LOGGING", "DEBUG"].some(
            (name) => process.env[name],
        )
    ) {
        throw new Error("Payload tracing is forbidden");
    }
    const key = parseEnv(await readFile(".env.local", "utf8")).OPENAI_API_KEY;
    if (!key) throw new Error("Private credential missing");
    process.env.OPENAI_API_KEY = key;
    const runtime = await openRuntime(true);
    const app = initializeApp(
        { projectId: "demo-kioku-local" },
        "k2-synthetic-live",
    );
    const db = getFirestore(app),
        uid = "k2-synthetic-live";
    const start = { ...runtime.budget.ledger };
    try {
        await db
            .doc("privateConfiguration/owner")
            .set({ uid, enabled: true, window: 0, count: 1 });
        const store = new FirestoreCaptureStore(db),
            service = new CaptureMemory(store);
        const provider = () =>
            Promise.resolve(new OpenAiMemory(key, runtime.budget));
        const authorize = async () => {};
        const cases = [];
        const first = {
            apiVersion: 1,
            requestId: randomUUID(),
            mode: "tell",
            channel: "text",
            zone: "Europe/Madrid",
            text: "El 20 de febrero de 2027 iré con Nora al museo ficticio de Liria. También quiero ver la película ficticia Bruma al volver.",
        };
        let at = performance.now();
        const saved = await service.execute(uid, first, provider, authorize);
        if (saved.status !== "saved" || saved.memoryCount < 2)
            throw new Error("Clear capture failed");
        if ((await store.source(uid, first.requestId)).text !== first.text)
            throw new Error("Source mismatch");
        const calls = runtime.budget.ledger.calls;
        if (
            (await service.execute(uid, first, provider, authorize)).status !==
                "saved" ||
            runtime.budget.ledger.calls !== calls
        )
            throw new Error("Replay called provider");
        cases.push({
            id: "clear-multiple-topics",
            status: saved.status,
            items: saved.memoryCount,
            durationMs: Math.round(performance.now() - at),
        });
        const second = {
            ...first,
            requestId: randomUUID(),
            text: "Él me dijo que el taller ficticio será el 4 de abril de 2027.",
        };
        const pending = await service.execute(uid, second, provider, authorize);
        if (pending.status !== "needsClarification")
            throw new Error("Ambiguity not clarified");
        if (
            (await db.doc(`accounts/${uid}/sources/${second.requestId}`).get())
                .exists
        )
            throw new Error("Premature memory");
        at = performance.now();
        const answer = "Me refiero a Iker, mi compañero ficticio de robótica.";
        const clarified = await service.execute(
            uid,
            {
                apiVersion: 1,
                requestId: randomUUID(),
                clarificationId: pending.clarificationId,
                expectedRevision: pending.revision,
                text: answer,
            },
            provider,
            authorize,
        );
        if (clarified.status !== "saved")
            throw new Error("Clarification not saved");
        const canonical = await store.source(uid, second.requestId);
        if (canonical.text !== `${second.text}\nAclaración: ${answer}`)
            throw new Error("Clarification lost");
        cases.push({
            id: "ambiguous-then-clarified",
            status: clarified.status,
            items: clarified.memoryCount,
            durationMs: Math.round(performance.now() - at),
        });
        console.log(
            JSON.stringify({
                status: "passed",
                model: "gpt-6.1-sol",
                reasoning: "medium",
                cases,
                calls: runtime.budget.ledger.calls - start.calls,
                inputTokens:
                    runtime.budget.ledger.inputTokens - start.inputTokens,
                outputTokens:
                    runtime.budget.ledger.outputTokens - start.outputTokens,
                estimatedUsd: runtime.budget.ledger.spentUsd - start.spentUsd,
            }),
        );
    } finally {
        await db.recursiveDelete(db.doc(`accounts/${uid}`));
        await db.doc("privateConfiguration/owner").delete();
        await db.terminate();
        await deleteApp(app);
        await runtime.close();
        delete process.env.OPENAI_API_KEY;
    }
}
main().catch(() => {
    console.error(
        "K2_LIVE_SMOKE_FAILED; inspect safe status and budget before retrying.",
    );
    process.exitCode = 1;
});
