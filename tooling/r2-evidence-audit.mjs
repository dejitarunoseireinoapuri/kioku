import { harness } from "../prototypes/memory-core/fixtures/harness.ts";
import { Interpreter } from "../prototypes/memory-core/ai/interpreter.ts";
import { SolProvider } from "../prototypes/memory-core/ai/provider.ts";
import { InterpretationError } from "../prototypes/memory-core/ai/contracts.ts";
import {
    EvaluationBudget,
    executionLock,
    saveReport,
} from "../prototypes/memory-core/evaluation/runtime.ts";
import { reserve } from "../prototypes/memory-core/evaluation/reserve.ts";
import { access } from "node:fs/promises";
import assert from "node:assert/strict";

function replacedTextPresent(state, patterns) {
    const texts = [
        ...Object.values(state.units).flatMap((u) =>
            Object.values(u.content).filter((v) => typeof v === "string"),
        ),
        ...Object.values(state.fragments).map((f) => f.text),
        ...Object.values(state.projections).flatMap((p) => p.terms),
    ]
        .join("\n")
        .normalize("NFD")
        .replace(/\p{M}/gu, "")
        .toLowerCase();
    return patterns.some((term) =>
        new RegExp(`\\b(?:${term})\\b`, "u").test(texts),
    );
}
// Metadata, role names and digits in opaque IDs are not remembered text.
assert.equal(
    replacedTextPresent(
        {
            units: {},
            fragments: { id5: { role: "primary", text: "cuatro fichas" } },
            projections: {},
        },
        ["cinco|5", "prima"],
    ),
    false,
);
assert.equal(
    replacedTextPresent(
        {
            units: {},
            fragments: { one: { text: "cinco fichas" } },
            projections: {},
        },
        ["cinco|5"],
    ),
    true,
);

// Diagnostic outside the frozen evaluator. Never accepts personal text, paths or model overrides.
function deterministicAudit() {
    const h = harness();
    const text = "Guardé cinco fichas en la caja violeta.";
    const time = {
        precision: "unknown",
        value: null,
        end: null,
        fragment: null,
    };
    const content = {
        text,
        proposition: "stored-tokens",
        subject: "owner",
        kind: "fact",
        polarity: "positive",
        attribution: null,
        condition: null,
    };
    h.save({
        text,
        zone: "Europe/Madrid",
        units: [{ key: "one", content, time, existing: null }],
        fragments: [
            { start: 0, end: text.length, role: "primary", owners: ["one"] },
        ],
        relations: [],
    });
    const target = Object.values(h.store.read().units)[0];
    const previous = Object.values(h.store.read().fragments)[0];
    const correction = "Eran cuatro fichas, no cinco.";
    const cut = correction.indexOf(",");
    const plan = h.prepare({
        kind: "correct",
        requestId: h.runtime.id(),
        target: { id: target.id, revision: target.revision },
        preserveTime: true,
        retainedEvidence: [
            { fragmentId: previous.id, start: 0, end: text.indexOf("cinco") },
            {
                fragmentId: previous.id,
                start: text.indexOf(" fichas"),
                end: text.length,
            },
        ],
        draft: {
            text: correction,
            zone: "Europe/Madrid",
            units: [
                {
                    key: "one",
                    content: {
                        ...content,
                        text: "Guardé cuatro fichas en la caja violeta.",
                    },
                    time,
                    existing: null,
                },
            ],
            fragments: [
                { start: 0, end: cut, role: "primary", owners: ["one"] },
                {
                    start: cut,
                    end: correction.length,
                    role: "replaced",
                    owners: [],
                },
            ],
            relations: [],
        },
    });
    h.engine.commit(h.owner, plan.id);
    const state = h.store.read();
    const literal = Object.values(state.fragments)
        .map((f) => f.text)
        .join(" ");
    return {
        id: "partial-edit-provenance",
        committed: true,
        canonicalRetainsUnchangedDetail:
            state.units[target.id].content.text.includes("caja violeta"),
        literalRetainsUnchangedDetail: literal.includes("caja violeta"),
        replacedValueAbsent: !JSON.stringify(state).includes("cinco"),
        providerCalls: 0,
    };
}

async function distinctEventAudit(interpreter) {
    const fixtures = [
        [
            "cross-date",
            "El 5 de julio de 2026 visité la torre de Vistaclara.",
            "El 19 de julio de 2026 quiero volver a la torre de Vistaclara.",
        ],
        [
            "cross-person",
            "Mi compañera Vera quiere estudiar polaco.",
            "Mi vecina Vera quiere estudiar danés.",
        ],
        [
            "cross-object",
            "Me gusta el sorbete de lima.",
            "No me gusta el caramelo de lima.",
        ],
        [
            "cross-event",
            "Quiero recorrer el bosque de Albora el 22 de julio de 2026.",
            "También quiero recorrer el bosque de Albora el 29 de julio de 2026.",
        ],
    ];
    const results = [];
    for (const [id, first, second] of fixtures) {
        const h = harness();
        try {
            const input = {
                text: first,
                at: "2026-07-14T18:00:00Z",
                zone: "Europe/Madrid",
                mode: "capture",
            };
            const initial = await interpreter.interpret(input, []);
            if (!initial.draft)
                throw new InterpretationError("AUDIT_CAPTURE_NOT_READY");
            h.save(initial.draft);
            const prior = Object.values(h.store.read().units)[0];
            const next = await interpreter.interpret(
                { ...input, text: second },
                Object.values(h.store.read().units),
            );
            if (!next.draft)
                throw new InterpretationError("AUDIT_SECOND_NOT_READY");
            h.save(next.draft);
            const units = Object.values(h.store.read().units);
            const retained = units.find((u) => u.id === prior.id);
            results.push({
                id,
                completed: true,
                distinctIdentities: units.length === 2,
                firstUnchanged:
                    retained?.revision === prior.revision &&
                    JSON.stringify(retained.content) ===
                        JSON.stringify(prior.content) &&
                    JSON.stringify(retained.time) ===
                        JSON.stringify(prior.time),
            });
        } catch (error) {
            results.push({
                id,
                completed: false,
                error:
                    error instanceof InterpretationError
                        ? error.code
                        : "AUDIT_CORE_ERROR",
            });
        }
    }
    return results;
}

async function liveAudit() {
    const finish = await executionLock();
    try {
        try {
            await access("local-data/r2/evidence-audit-v3.json");
            throw new InterpretationError("AUDIT_EXISTS");
        } catch (error) {
            if (
                !(
                    error instanceof Error &&
                    "code" in error &&
                    error.code === "ENOENT"
                )
            )
                throw error;
        }
        const budget = await EvaluationBudget.open();
        const baseline = structuredClone(budget.ledger);
        budget.runCeiling = baseline.spentUsd + baseline.reservedUsd + 1;
        const metrics = [];
        const provider = new SolProvider(
            process.env.OPENAI_API_KEY ?? "",
            budget,
            (m) => metrics.push(m),
        );
        const interpreter = new Interpreter(provider);
        const results = [];
        for (const id of ["r45", "r46"]) {
            const c = reserve.find((c) => c.id === id);
            const h = harness();
            h.advance(Date.parse(c.at) - h.runtime.now());
            try {
                const input = {
                    text: c.text,
                    at: c.at,
                    zone: c.zone,
                    mode: "capture",
                };
                const initial = await interpreter.interpret(input, []);
                if (!initial.draft)
                    throw new InterpretationError("AUDIT_CAPTURE_NOT_READY");
                h.save(initial.draft);
                const target = Object.values(h.store.read().units)[0];
                const edit = c.correction;
                const next = await interpreter.interpret(
                    {
                        ...input,
                        mode: "correction",
                        text: edit.text,
                        target,
                        evidence: Object.values(h.store.read().fragments)
                            .filter((f) => f.owners.includes(target.id))
                            .map((fragment) => ({
                                fragment,
                                source: h.store.read().sources[
                                    fragment.sourceId
                                ],
                            })),
                    },
                    [],
                );
                if (!next.draft)
                    throw new InterpretationError("AUDIT_EDIT_NOT_READY");
                const plan = h.prepare({
                    kind: "correct",
                    requestId: h.runtime.id(),
                    target: { id: target.id, revision: target.revision },
                    preserveTime: next.proposal.preserveTime,
                    retainedEvidence: next.retainedEvidence,
                    draft: next.draft,
                });
                h.engine.commit(h.owner, plan.id);
                const state = h.store.read();
                const normalize = (text) =>
                    text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
                const literal = normalize(
                    Object.values(state.fragments)
                        .map((f) => f.text)
                        .join(" "),
                );
                results.push({
                    id,
                    completed: true,
                    retainedLiteralDetails: edit.expected.terms.map(
                        (term, index) => ({
                            index,
                            present: new RegExp(term, "u").test(literal),
                        }),
                    ),
                    replacedValueInAnyStoredContent: replacedTextPresent(
                        state,
                        edit.expected.forbidden ?? [],
                    ),
                });
            } catch (error) {
                results.push({
                    id,
                    completed: false,
                    error:
                        error instanceof InterpretationError
                            ? error.code
                            : "AUDIT_CORE_ERROR",
                });
            }
        }
        if (!process.argv.includes("--evidence-only"))
            results.push(...(await distinctEventAudit(interpreter)));
        const report = {
            type: "post-reserve-diagnostic-not-a-new-reserve",
            results,
            metrics,
            baseline,
            budget: budget.ledger,
        };
        await saveReport("evidence-audit-v3.json", report);
        console.log(
            JSON.stringify({
                results,
                calls: metrics.length,
                spentUsd: budget.ledger.spentUsd - baseline.spentUsd,
            }),
        );
    } finally {
        await finish();
    }
}
console.log(JSON.stringify(deterministicAudit()));
if (process.argv.includes("--live"))
    await liveAudit().catch((error) => {
        console.error(
            error instanceof InterpretationError
                ? error.code
                : "AUDIT_INTERNAL",
        );
        process.exitCode = 1;
    });
