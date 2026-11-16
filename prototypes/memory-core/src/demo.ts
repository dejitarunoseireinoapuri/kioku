import { harness } from "../fixtures/harness.ts";
import { single, twoPlans } from "../fixtures/scenarios.ts";
import { validateSnapshot } from "./invariants.ts";

const h = harness();
const initial = h.save(twoPlans());
const corrected = h.engine.commit(
  h.owner,
  h.prepare({
    kind: "correct",
    requestId: h.runtime.id(),
    target: initial.refs[0],
    preserveTime: true,
    draft: single("pintar acuarelas"),
  }).id,
);
const evidence = h.engine.evidence(
  h.owner,
  corrected.refs.map((ref) => ref.id),
);
h.engine.revalidate(h.owner, evidence);
h.erase(corrected.refs);
const state = h.store.read();
validateSnapshot(state);
// Only counts/statuses: this runnable example never accepts files, credentials or real input.
console.log(
  JSON.stringify(
    {
      fixture: "two-independent-plans",
      stored: initial.refs.length,
      correctedRevision: corrected.refs[0]!.revision,
      remainingUnits: Object.keys(state.units).length,
      neighborPreserved: Boolean(state.units[initial.refs[1]!.id]),
      forgottenAbsent: !state.units[initial.refs[0]!.id],
      providerCalls: 0,
      persistence: "RAM-only",
    },
    null,
    2,
  ),
);
