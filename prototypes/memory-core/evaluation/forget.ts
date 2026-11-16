import type { Harness } from "../fixtures/harness.ts";
import type { Unit } from "../src/model.ts";
import type { Scenario } from "./case.ts";
import { InterpretationError } from "../ai/contracts.ts";

export function forgetTargets(
  h: Harness,
  fixture: Scenario,
  mapping: Map<string, Unit>,
) {
  const resolve = (labels: string[]) =>
    labels.map((label) => {
      const u = mapping.get(label);
      if (!u) throw new InterpretationError("EXPECTED_TARGET_MISSING");
      return { id: u.id, revision: u.revision };
    });
  const selected = resolve(fixture.forget);
  if (!fixture.forgetClosure) return selected;
  const additional = resolve(fixture.forgetClosure);
  const before = JSON.stringify(h.store.read());
  const unresolved = h.engine.prepare(h.owner, {
    kind: "forget",
    requestId: h.runtime.id(),
    targets: selected,
    excludeMatches: [],
  });
  if (
    JSON.stringify(h.store.read()) !== before ||
    unresolved.status !== "needs_scope" ||
    unresolved.reason !== "dependent_memory" ||
    JSON.stringify(unresolved.refs.map((r) => r.id).sort()) !==
      JSON.stringify(additional.map((r) => r.id).sort())
  )
    throw new InterpretationError("EXPECTED_DEPENDENCY_SCOPE");
  return [...selected, ...additional];
}
