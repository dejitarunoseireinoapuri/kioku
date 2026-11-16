import { access } from "node:fs/promises";
import { harness } from "../prototypes/memory-core/fixtures/harness.ts";
import { Interpreter } from "../prototypes/memory-core/ai/interpreter.ts";
import { SolProvider, profile } from "../prototypes/memory-core/ai/provider.ts";
import { InterpretationError } from "../prototypes/memory-core/ai/contracts.ts";
import {
    EvaluationBudget,
    executionLock,
    saveReport,
} from "../prototypes/memory-core/evaluation/runtime.ts";

// Additional fictitious admission cases, deliberately different from the frozen stories.
const cases = [
    [
        "i01",
        "Dejé el dedal de cobre en la bandeja lila.",
        "El dedal de cobre está en la bandeja lila.",
        1,
    ],
    [
        "i02",
        "Puse la espátula de silicona en la gaveta estrecha.",
        "La espátula de silicona está dentro de la gaveta estrecha.",
        1,
    ],
    [
        "i03",
        "Guardé el silbato de entrenamiento en la bolsa de rayas.",
        "El silbato de entrenamiento sigue en la bolsa de rayas.",
        1,
    ],
    [
        "i04",
        "El metro plegable está en el cajón de la mesa de trabajo.",
        "El metro plegable lo dejé en el cajón de la mesa de trabajo.",
        1,
    ],
    [
        "i05",
        "Guardé los guantes de jardinería en el armario de la terraza.",
        "Los guantes de jardinería están guardados en el armario de la terraza.",
        1,
    ],
    [
        "i06",
        "Dejé la aguja de coser cuero en el estuche de lunares.",
        "La aguja de coser cuero está en el estuche de lunares.",
        1,
    ],
    [
        "i07",
        "Guardé el transportador de ángulos en la carpeta verde.",
        "He trasladado el transportador de ángulos a la caja roja.",
        2,
    ],
    [
        "i08",
        "El 1 de julio de 2026 dejé el sombrero en recepción.",
        "El 13 de julio de 2026 volví a dejar el sombrero en recepción.",
        2,
    ],
    [
        "i09",
        "El cable del escáner está en la bolsa blanca.",
        "El cable del monitor está en la bolsa blanca.",
        2,
    ],
    [
        "i10",
        "Mi hermano Pau dejó su casco en el altillo.",
        "Mi vecino Pau dejó su casco en el altillo.",
        2,
    ],
    [
        "i11",
        "Quiero guardar las tijeras de podar en el cobertizo.",
        "He guardado las tijeras de podar en el cobertizo.",
        2,
    ],
    [
        "i12",
        "El cuaderno cuadriculado está en la repisa.",
        "Volví a dejar el cuaderno cuadriculado en la repisa después de usarlo.",
        2,
    ],
];

async function runCase(interpreter, fixture) {
    const [id, first, second, expected] = fixture;
    const h = harness();
    h.advance(Date.parse("2026-07-14T18:00:00Z") - h.runtime.now());
    const input = {
        text: first,
        at: "2026-07-14T18:00:00Z",
        zone: "Europe/Madrid",
        mode: "capture",
    };
    try {
        const initial = await interpreter.interpret(input, []);
        if (!initial.draft)
            throw new InterpretationError("IDENTITY_INITIAL_NOT_READY");
        h.save(initial.draft);
        const before = Object.values(h.store.read().units);
        const next = await interpreter.interpret(
            { ...input, text: second },
            before,
        );
        if (!next.draft)
            throw new InterpretationError("IDENTITY_SECOND_NOT_READY");
        h.save(next.draft);
        const state = h.store.read();
        const units = Object.values(state.units);
        const originalUnchanged = before.every(
            (u) =>
                state.units[u.id]?.revision === u.revision &&
                JSON.stringify(state.units[u.id].content) ===
                    JSON.stringify(u.content) &&
                JSON.stringify(state.units[u.id].time) ===
                    JSON.stringify(u.time),
        );
        const countCorrect = units.length === expected;
        const linkedOccurrence =
            expected !== 1 ||
            Object.values(state.occurrences).filter(
                (o) => o.unitId === before[0].id,
            ).length === 2;
        h.erase(units.map((u) => ({ id: u.id, revision: u.revision })));
        const cleared = Object.keys(h.store.read().fragments).length === 0;
        return {
            id,
            expectedUnits: expected,
            actualUnits: units.length,
            originalUnchanged,
            linkedOccurrence,
            cleared,
            passed:
                countCorrect &&
                originalUnchanged &&
                linkedOccurrence &&
                cleared,
            error: null,
        };
    } catch (error) {
        return {
            id,
            expectedUnits: expected,
            passed: false,
            error:
                error instanceof InterpretationError
                    ? error.code
                    : "IDENTITY_CORE_REJECTED",
        };
    }
}

async function main() {
    if (!process.argv.includes("--live"))
        throw new InterpretationError("LIVE_REQUIRED");
    const finish = await executionLock();
    try {
        const name = "identity-audit-v3.json";
        try {
            await access(`local-data/r2/${name}`);
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
        const budget = await EvaluationBudget.open(),
            baseline = structuredClone(budget.ledger),
            metrics = [];
        budget.runCeiling = baseline.spentUsd + baseline.reservedUsd + 2;
        const model = new SolProvider(
            process.env.OPENAI_API_KEY ?? "",
            budget,
            (m) => metrics.push(m),
        );
        const interpreter = new Interpreter(model),
            results = [];
        for (const fixture of cases) {
            const result = await runCase(interpreter, fixture);
            results.push(result);
            await saveReport(name, {
                type: "post-reserve-identity-check-not-a-full-reserve",
                profile,
                results,
                metrics,
                baseline,
                budget: budget.ledger,
                complete: results.length === cases.length,
            });
            console.log(JSON.stringify(result));
            if (
                result.error &&
                /^(BUDGET_|HTTP_(401|403|429)|TRANSPORT_)/u.test(result.error)
            )
                throw new InterpretationError("AUDIT_HALTED");
        }
        console.log(
            JSON.stringify({
                total: results.length,
                passed: results.filter((r) => r.passed).length,
                calls: metrics.length,
                spentUsd: budget.ledger.spentUsd - baseline.spentUsd,
            }),
        );
    } finally {
        await finish();
    }
}
main().catch((error) => {
    console.error(
        error instanceof InterpretationError
            ? error.code
            : "IDENTITY_AUDIT_ERROR",
    );
    process.exitCode = 1;
});
