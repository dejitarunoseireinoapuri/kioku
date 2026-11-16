import { readFile } from "node:fs/promises";
import { SolProvider, profile } from "../prototypes/memory-core/ai/provider.ts";
import { Interpreter } from "../prototypes/memory-core/ai/interpreter.ts";
import { InterpretationError } from "../prototypes/memory-core/ai/contracts.ts";
import {
    EvaluationBudget,
    executionLock,
    saveReport,
} from "../prototypes/memory-core/evaluation/runtime.ts";
import { activeBudgetWindow } from "../prototypes/memory-core/evaluation/budget-window.ts";
import { boundedReserve } from "../prototypes/memory-core/evaluation/bounded.ts";
import { finalFingerprint } from "../prototypes/memory-core/evaluation/final-protocol.ts";

async function main() {
    if (process.argv.slice(2).join(" ") !== "--live")
        throw new InterpretationError("LIVE_REQUIRED");
    if ((await activeBudgetWindow())?.id !== "bounded-v9")
        throw new InterpretationError("BUDGET_WINDOW_REQUIRED");
    if (profile.reasoning !== "high")
        throw new InterpretationError("PROFILE_REQUIRED");
    // This is an exposed diagnostic, admitted only after all frozen rounds finish.
    for (let round = 1; round <= 3; round++) {
        const r = JSON.parse(
            await readFile(
                `local-data/r2/reserve-bounded-independent-${round}.json`,
                "utf8",
            ),
        );
        if (!r.complete) throw new InterpretationError("RESERVE_INCOMPLETE");
    }
    const finish = await executionLock();
    try {
        const name = "tuning-bounded-review-pairs.json";
        try {
            await readFile(`local-data/r2/${name}`);
            throw new InterpretationError("RUN_EXISTS");
        } catch (error) {
            if (error?.code !== "ENOENT") throw error;
        }
        const budget = await EvaluationBudget.open(),
            baseline = structuredClone(budget.ledger),
            metrics = [],
            results = [];
        budget.runCeiling = baseline.spentUsd + baseline.reservedUsd + 0.75;
        let mode = "generation";
        const provider = new SolProvider(
            process.env.OPENAI_API_KEY ?? "",
            budget,
            (m) => metrics.push({ ...m, mode }),
        );
        const fixture = boundedReserve.find((c) => c.id === "j39");
        const fingerprint = await finalFingerprint([fixture]);
        const report = () => ({
            profile,
            fingerprint,
            baseline,
            budget: budget.ledger,
            results,
            metrics,
            complete: results.length === 6,
            resolvedModel: provider.resolvedModel,
        });
        for (let pair = 0; pair < 6; pair++) {
            let generatorData;
            const result = {
                pair: pair + 1,
                order:
                    pair % 2 ? ["indexed", "compact"] : ["compact", "indexed"],
                reviews: [],
                proposal: null,
                error: null,
            };
            const model = {
                async call(stage, instructions, data, schema, limit) {
                    if (stage === "interpret") {
                        mode = "generation";
                        generatorData = data;
                        return provider.call(
                            stage,
                            instructions,
                            data,
                            schema,
                            limit,
                        );
                    }
                    result.proposal = {
                        status: data.proposal.status,
                        kinds: data.proposal.units.map((u) => u.content.kind),
                        timeMatches: data.proposal.units.map((u) =>
                            fixture.units.map((g) =>
                                Object.entries(g.time).every(
                                    ([k, v]) => u.time[k] === v,
                                ),
                            ),
                        ),
                    };
                    let compact;
                    for (const variant of result.order) {
                        mode = variant;
                        const payload =
                            variant === "compact"
                                ? data
                                : { ...generatorData, proposal: data.proposal };
                        const review = await provider.call(
                            stage,
                            instructions,
                            payload,
                            schema,
                            limit,
                        );
                        result.reviews.push({
                            variant,
                            accepted: review.accepted,
                            issues: review.issues,
                            inputBytes: Buffer.byteLength(
                                JSON.stringify(payload),
                            ),
                        });
                        if (variant === "compact") compact = review;
                    }
                    return compact;
                },
            };
            try {
                await new Interpreter(model).interpret(
                    {
                        text: fixture.text,
                        at: fixture.at,
                        zone: fixture.zone,
                        mode: "capture",
                    },
                    [],
                );
            } catch (error) {
                result.error =
                    error instanceof InterpretationError
                        ? error.code
                        : "DIAGNOSTIC_INTERNAL";
            }
            results.push(result);
            await saveReport(name, report());
            console.log(JSON.stringify(result));
            if (
                result.error &&
                /^(BUDGET_|HTTP_|LOCAL_WRITE_|TRANSPORT_OR_RESPONSE|DIAGNOSTIC_INTERNAL)/u.test(
                    result.error,
                )
            )
                break;
        }
        console.log(
            JSON.stringify({
                complete: report().complete,
                pairs: results.length,
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
            : "PAIR_DIAGNOSTIC_FAILED",
    );
    process.exitCode = 1;
});
