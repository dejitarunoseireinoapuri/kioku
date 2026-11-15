import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { ChangeMemory } from "../backend/lib/src/memory-control/change.js";
import { scopeVersion } from "../backend/lib/src/memory-control/retirement.js";
import { validateCorrectionRetention } from "../backend/lib/src/memory-control/correction-selection.js";

export const sharedCases = [
    {
        id: "shared-correction-after-rephrasing",
        text: "quiero jugary prender",
        clarification:
            "Quiero visitar el vivero mañana y leer un cómic pasado mañana.",
        correction: "Quiero visitar el planetario mañana.",
        provenance: "personal",
    },
    {
        id: "shared-owner-correction",
        text: "Quiero visitar el vivero mañana y leer un cómic pasado mañana.",
        correction: "Quiero visitar el planetario mañana.",
        provenance: "personal",
    },
    {
        id: "shared-reported-correction",
        text: "Pablo me dijo que quiere visitar el vivero mañana y leer un cómic pasado mañana.",
        correction: "Pablo me dijo que quiere visitar el planetario mañana.",
        provenance: "reported",
    },
];

export async function checkSharedCorrection(item, ai, capture, at, zone) {
    const initial = await capture(item.text, item.clarification);
    assert.equal(initial.extraction.status, "saved");
    assert.equal(initial.snapshot.memories.length, 2);
    const current = initial.snapshot,
        source = current.sources[0];
    const target = current.memories.find((m) => /vivero/iu.test(m.text));
    const kept = current.memories.find((m) => /cómic/iu.test(m.text));
    assert.ok(target && kept);
    assert.equal(target.quote, kept.quote);
    const scope = {
        scope: "entireSource",
        sourceId: source.id,
        sourceVersion: "1:1",
        memories: current.memories.map((m) => ({ id: m.id, version: "1:1" })),
        expiresAtMs: Date.parse(at) + 300000,
    };
    const bundle = {
        scope,
        source,
        memories: current.memories,
        memoryEpoch: 0,
    };
    let saved, proof;
    const store = {
        begin: async (_uid, input) => ({
            requestId: input.requestId,
            nonce: randomUUID(),
        }),
        bundle: async () => bundle,
        noChange: async (_uid, work, text) => ({
            apiVersion: 1,
            operationId: work.requestId,
            status: "needsClarification",
            text,
            sources: [],
            memoryEpoch: 0,
        }),
        commit: async (_uid, input, _scope, snapshot, _work, evidence) => {
            validateCorrectionRetention(
                bundle,
                input.memoryIds,
                evidence,
                snapshot,
            );
            saved = snapshot;
            proof = evidence;
            return {
                apiVersion: 1,
                operationId: input.requestId,
                status: "corrected",
                text: "Dato corregido.",
                sources: [],
                memoryEpoch: 1,
            };
        },
        fail: async () => {},
    };
    const result = await new ChangeMemory(store, () => Date.parse(at)).execute(
        "synthetic-owner",
        {
            apiVersion: 1,
            requestId: randomUUID(),
            sourceId: source.id,
            expectedVersion: scopeVersion(scope),
            memoryIds: [target.id],
            action: "correct",
            correction: item.correction,
            zone,
        },
        async () => ai,
        async () => {},
    );
    assert.equal(result.status, "corrected");
    assert.equal(saved.memories.length, 2);
    const preserved = saved.memories.find((m) => /cómic/iu.test(m.text));
    const changed = saved.memories.find((m) => /planetario/iu.test(m.text));
    assert.equal(preserved.text, kept.text);
    assert.equal(preserved.time.value, "2026-11-17");
    assert.equal(changed.time.value, "2026-11-16");
    assert.equal(preserved.provenance, item.provenance);
    assert.equal(changed.provenance, item.provenance);
    assert.doesNotMatch(
        saved.sources.map((s) => s.text).join("\n"),
        /vivero/iu,
    );
    assert.doesNotMatch(
        JSON.stringify(saved.memories.map(({ vector: _v, ...m }) => m)),
        /vivero/iu,
    );
    return {
        result: result.status,
        items: saved.memories.map(({ vector: _v, ...m }) => m),
        evidenceCount: proof.length,
    };
}
