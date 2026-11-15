import { createRequire } from "node:module";
import { readFile, writeFile } from "node:fs/promises";
import { parseEnv, parseArgs } from "node:util";
import { randomUUID } from "node:crypto";
import { openRuntime, reportError } from "../prototypes/memory/src/runtime.ts";
import { MemoryEngine } from "../prototypes/memory/src/engine.ts";
import { FirestoreSourceControlStore } from "../backend/lib/src/firebase/source-control-store.js";
import { FirestoreSourceRetirementStore } from "../backend/lib/src/firebase/retirement-store.js";
import { scopeVersion } from "../backend/lib/src/memory-control/retirement.js";
import { correctionNotice } from "../backend/lib/src/memory-control/selection.js";
import { withoutVectors } from "../backend/lib/src/memory-control/forget-contracts.js";

// Administrative, explicitly scoped repair; never exported as an app callable or a model tool.
async function main() {
    const { values } = parseArgs({
        options: {
            "dry-run": { type: "boolean" },
            apply: { type: "boolean" },
            "approved-repair": { type: "boolean" },
            source: { type: "string" },
            version: { type: "string" },
        },
    });
    if (
        !!values["dry-run"] === !!values.apply ||
        (values.apply && !values["approved-repair"]) ||
        !/^[a-f0-9-]{36}$/u.test(values.source ?? "") ||
        !/^[a-f0-9]{64}$/u.test(values.version ?? "")
    )
        throw Error("Explicit source/version and mode required");
    if (
        process.env.FIRESTORE_EMULATOR_HOST ||
        ["DEBUG", "NODE_DEBUG", "GRPC_TRACE", "GOOGLE_SDK_NODE_LOGGING"].some(
            (k) => process.env[k],
        )
    )
        throw Error("Unsafe environment");
    const require = createRequire(
        new URL("../backend/package.json", import.meta.url),
    );
    const auth = require("firebase-tools/lib/auth.js");
    const account = auth.getGlobalDefaultAccount();
    if (!account?.tokens?.refresh_token)
        throw Error("Operator session required");
    const token = await auth.getAccessToken(account.tokens.refresh_token, [
        "https://www.googleapis.com/auth/cloud-platform",
    ]);
    const { GoogleAuth, OAuth2Client } = require("google-auth-library");
    const client = new OAuth2Client();
    client.setCredentials({
        access_token: token.access_token,
        expiry_date: token.expires_at,
    });
    const { Firestore } = require("@google-cloud/firestore");
    const db = new Firestore({
        projectId: "kioku-9454f",
        auth: new GoogleAuth({ authClient: client }),
    });
    let runtime;
    try {
        const owner = await db.doc("privateConfiguration/owner").get();
        const uid = owner.get("uid");
        if (typeof uid !== "string" || owner.get("enabled") !== true)
            throw Error("Owner unavailable");
        const control = new FirestoreSourceControlStore(db);
        const bundle = await control.bundle(uid, values.source);
        if (
            scopeVersion(bundle.scope) !== values.version ||
            bundle.sourceKind !== undefined ||
            bundle.memories.length !== 2
        )
            throw Error("Source precondition changed");
        const root = db.doc(`accounts/${uid}`);
        const [beforeSources, beforeMemories] = await Promise.all([
            root.collection("sources").limit(129).get(),
            root.collection("memories").limit(513).get(),
        ]);
        if (beforeSources.size > 128 || beforeMemories.size > 512)
            throw Error("Capacity");
        process.env.OPENAI_API_KEY = parseEnv(
            await readFile(".env.local", "utf8"),
        ).OPENAI_API_KEY;
        runtime = await openRuntime(true);
        let snapshot = { version: 4, sources: [], memories: [] };
        const engine = new MemoryEngine(
            {
                load: async () => snapshot,
                save: async (next) => {
                    snapshot = next;
                },
            },
            runtime.intelligence,
        );
        const original = { ...bundle.source, id: randomUUID() };
        const extraction = await engine.tell(original);
        if (
            extraction.status !== "saved" ||
            snapshot.sources.length !== 1 ||
            snapshot.memories.length !== 2 ||
            snapshot.sources[0].text !== bundle.source.text
        )
            throw Error("Repair cannot preserve source");
        const review = await runtime.intelligence.reviewCaptureRepair({
            original: bundle.source,
            before: withoutVectors(bundle.memories),
            after: withoutVectors(snapshot.memories),
        });
        if (!Object.values(review).every((v) => v === true))
            throw Error("Repair review refused");
        if (values["dry-run"]) {
            console.log(
                JSON.stringify({
                    dryRun: true,
                    inputFacts: 2,
                    outputFacts: 2,
                    review,
                    canApply: true,
                }),
            );
            return;
        }
        snapshot.sources = snapshot.sources.map((source) => ({
            ...source,
            text: correctionNotice + source.text,
        }));
        snapshot.memories = snapshot.memories.map((memory) => ({
            ...memory,
            revision: Math.max(...bundle.memories.map((m) => m.revision)) + 1,
        }));
        const current = await control.bundle(uid, values.source);
        if (scopeVersion(current.scope) !== values.version)
            throw Error("Source changed during review");
        await new FirestoreSourceRetirementStore(db).replace(
            uid,
            randomUUID(),
            bundle.scope,
            { snapshot, status: "corrected" },
        );
        const [afterSources, afterMemories] = await Promise.all([
            root.collection("sources").limit(129).get(),
            root.collection("memories").limit(513).get(),
        ]);
        const version = (doc) =>
            `${doc.updateTime.seconds}:${doc.updateTime.nanoseconds}`;
        const identical = (before, after, excluded) => {
            const versions = new Map(after.docs.map((d) => [d.id, version(d)]));
            return before.docs
                .filter((d) => !excluded.has(d.id))
                .every((d) => versions.get(d.id) === version(d));
        };
        const result = {
            repaired: true,
            oldSourceId: values.source,
            newSourceId: snapshot.sources[0].id,
            inputFacts: 2,
            outputFacts: 2,
            review,
            unrelatedSourcesUnchanged: identical(
                beforeSources,
                afterSources,
                new Set([values.source]),
            ),
            unrelatedMemoriesUnchanged: identical(
                beforeMemories,
                afterMemories,
                new Set(bundle.memories.map((m) => m.id)),
            ),
            sourceCountUnchanged: beforeSources.size === afterSources.size,
            memoryCountUnchanged: beforeMemories.size === afterMemories.size,
        };
        await writeFile(
            ".setup/k4-atomic-repair-result.json",
            JSON.stringify(result),
        );
        console.log(
            JSON.stringify({
                ...result,
                oldSourceId: undefined,
                newSourceId: undefined,
            }),
        );
        if (
            !result.unrelatedSourcesUnchanged ||
            !result.unrelatedMemoriesUnchanged ||
            !result.sourceCountUnchanged ||
            !result.memoryCountUnchanged
        )
            process.exitCode = 1;
    } finally {
        if (runtime) await runtime.close();
        await db.terminate();
    }
}
main().catch(reportError);
