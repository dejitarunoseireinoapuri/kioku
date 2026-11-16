import assert from "node:assert/strict";
import test from "node:test";
import { harness } from "../fixtures/harness.ts";
import {
  conditional,
  sharedContext,
  single,
  twoPlans,
} from "../fixtures/scenarios.ts";
import { validateSnapshot } from "../src/invariants.ts";
import { terms } from "../src/catalog.ts";

test("independent plans retain their own literal evidence and different temporal precision", () => {
  const h = harness(),
    saved = h.save(twoPlans());
  assert.equal(saved.refs.length, 2);
  const [first, second] = h.engine.details(h.owner, saved.refs);
  assert.equal(first!.unit.time.value, "2026-05-11");
  assert.equal(second!.unit.time.precision, "month");
  assert.ok(!JSON.stringify(first).includes("ajedrez"));
  assert.ok(!JSON.stringify(second).includes("dibujar"));
  assert.ok(
    Object.values(h.store.read().sources).every(
      (source) => !("text" in source),
    ),
  );
  validateSnapshot(h.store.read());
});

test("forget one plan without modifying the other unit or its evidence", () => {
  const h = harness(),
    saved = h.save(twoPlans());
  const before = h.engine.details(h.owner, [saved.refs[1]!]);
  h.erase([saved.refs[0]!]);
  assert.deepEqual(h.engine.details(h.owner, [saved.refs[1]!]), before);
  const state = h.store.read();
  assert.ok(!JSON.stringify(state).includes("dibujar"));
  assert.ok(
    !Object.values(state.projections).some((p) => p.terms.includes("dibujar")),
  );
  assert.ok(JSON.stringify(state).includes("ajedrez"));
  assert.equal(Object.keys(state.revocations).length, 1);
  validateSnapshot(state);
});

test("shared attribution survives while the independent selected clause disappears", () => {
  const h = harness(),
    saved = h.save(sharedContext());
  const before = h.store.read().units[saved.refs[1]!.id];
  h.erase([saved.refs[0]!]);
  const state = h.store.read();
  assert.deepEqual(state.units[saved.refs[1]!.id], before);
  assert.ok(JSON.stringify(state).includes("Elena me dijo que"));
  assert.ok(!JSON.stringify(state).includes("dibujará"));
  assert.ok(JSON.stringify(state).includes("estudiará"));
  assert.ok(Object.values(state.fragments).every((f) => f.owners.length === 1));
  validateSnapshot(state);
});

test("correction preserves identity and the original temporal anchor while retiring old content", () => {
  const h = harness(),
    saved = h.save(twoPlans());
  const before = h.store.read();
  h.advance(10 * 24 * 60 * 60_000);
  const plan = h.prepare({
    kind: "correct",
    requestId: h.runtime.id(),
    target: saved.refs[0],
    preserveTime: true,
    draft: single("pintar acuarelas"),
  });
  const result = h.engine.commit(h.owner, plan.id);
  assert.equal(result.refs[0]!.id, saved.refs[0]!.id);
  assert.equal(result.refs[0]!.revision, 2);
  const details = h.engine.details(h.owner, result.refs)[0]!;
  assert.equal(details.mentionCount, 1);
  assert.ok(details.sources.some((source) => source.kind === "correction"));
  assert.ok(details.sources.some((source) => source.kind === "capture"));
  const state = h.store.read(),
    unit = state.units[result.refs[0]!.id]!;
  assert.equal(unit.time.value, "2026-05-11");
  assert.equal(unit.timeEvidenceId, before.units[unit.id]!.timeEvidenceId);
  assert.equal(unit.recordedAt, before.units[unit.id]!.recordedAt);
  assert.equal(
    state.sources[state.fragments[unit.timeEvidenceId!]!.sourceId]!.recordedAt,
    Date.parse("2026-05-10T10:00:00Z"),
  );
  assert.deepEqual(
    state.units[saved.refs[1]!.id],
    before.units[saved.refs[1]!.id],
  );
  assert.ok(!JSON.stringify(state).includes("dibujar"));
  h.erase(result.refs);
  assert.ok(!JSON.stringify(h.store.read()).includes("acuarelas"));
  validateSnapshot(h.store.read());
});

test("explicit new date replaces old temporal evidence rather than shifting unrelated dates", () => {
  const h = harness(),
    saved = h.save(twoPlans());
  const draft = single("pintar");
  draft.text += " el 15 de mayo";
  draft.fragments.push({
    start: draft.fragments[0]!.end,
    end: draft.text.length,
    role: "time",
    owners: ["a"],
  });
  draft.units[0]!.time = {
    precision: "day",
    value: "2026-05-15",
    end: null,
    fragment: 1,
  };
  const plan = h.prepare({
    kind: "correct",
    requestId: h.runtime.id(),
    target: saved.refs[0],
    preserveTime: false,
    draft,
  });
  h.engine.commit(h.owner, plan.id);
  const state = h.store.read();
  assert.equal(state.units[saved.refs[0]!.id]!.time.value, "2026-05-15");
  assert.equal(state.units[saved.refs[1]!.id]!.time.value, "2026-06");
  assert.ok(!JSON.stringify(state).includes("mañana"));
});

test("a correction's reference to the erroneous value is transient, not another hidden archive", () => {
  const h = harness(),
    saved = h.save(single("pintar cerámica"));
  const draft = single("dibujar retratos");
  const end = draft.text.length;
  draft.text += ", no pintar cerámica";
  draft.fragments.push({
    start: end,
    end: draft.text.length,
    role: "replaced",
    owners: [],
  });
  h.engine.commit(
    h.owner,
    h.prepare({
      kind: "correct",
      requestId: h.runtime.id(),
      target: saved.refs[0],
      preserveTime: true,
      draft,
    }).id,
  );
  assert.ok(!JSON.stringify(h.store.read()).includes("cerámica"));
  validateSnapshot(h.store.read());
});

test("known repeated evidence shares identity and is removed from all its sources", () => {
  const h = harness(),
    first = h.save(single("tallar madera"));
  const repeated = single("tallar madera", first.refs[0]!);
  repeated.text = "Me sigue apeteciendo tallar madera";
  repeated.fragments[0]!.end = repeated.text.length;
  const second = h.save(repeated);
  assert.deepEqual(second.refs, first.refs);
  assert.equal(Object.keys(h.store.read().occurrences).length, 2);
  h.erase(first.refs);
  const state = h.store.read();
  for (const table of [
    state.units,
    state.fragments,
    state.sources,
    state.projections,
    state.occurrences,
  ]) {
    assert.equal(Object.keys(table).length, 0);
  }
  assert.ok(!JSON.stringify(state).includes("madera"));
});

test("correcting a repeated identity removes every superseded support, keeping one new identity revision", () => {
  const h = harness(),
    first = h.save(single("tallar madera"));
  h.save(single("tallar madera", first.refs[0]!));
  const corrected = h.engine.commit(
    h.owner,
    h.prepare({
      kind: "correct",
      requestId: h.runtime.id(),
      target: first.refs[0],
      preserveTime: true,
      draft: single("modelar arcilla"),
    }).id,
  );
  assert.equal(Object.keys(h.store.read().sources).length, 1);
  assert.equal(corrected.refs[0]!.revision, 2);
  assert.ok(!JSON.stringify(h.store.read()).includes("madera"));
});

test("similar words about a separate event remain after forgetting another identity", () => {
  const h = harness(),
    first = h.save(single("dibujar")),
    other = h.save(single("dibujar"));
  h.erase(first.refs);
  assert.equal(
    h.engine.details(h.owner, other.refs)[0]!.unit.content.proposition,
    "dibujar",
  );
});

test("a condition stays with the intention; it does not create the event as a fact", () => {
  const h = harness(),
    saved = h.save(conditional());
  const state = h.store.read();
  assert.equal(Object.keys(state.units).length, 1);
  assert.equal(state.units[saved.refs[0]!.id]!.content.kind, "intention");
  assert.equal(state.units[saved.refs[0]!.id]!.time.precision, "unknown");
  h.erase(saved.refs);
  assert.equal(Object.keys(h.store.read().fragments).length, 0);
});

test("real evolution preserves the previous state until explicitly forgotten", () => {
  const h = harness(),
    old = single("beber té");
  old.units[0]!.content.kind = "opinion";
  const first = h.save(old),
    fresh = single("beber café");
  fresh.units[0]!.content.kind = "opinion";
  fresh.relations.push({ kind: "evolvesFrom", from: "a", to: first.refs[0]! });
  const second = h.save(fresh);
  assert.equal(Object.keys(h.store.read().units).length, 2);
  h.erase(first.refs);
  assert.equal(
    h.engine.details(h.owner, second.refs)[0]!.unit.content.proposition,
    "beber café",
  );
});

test("index and packet of evidence can be checked after a mutation without retaining old content", () => {
  const h = harness(),
    saved = h.save(single("dibujar"));
  const packet = h.engine.evidence(h.owner, [saved.refs[0]!.id]);
  h.engine.revalidate(h.owner, packet);
  assert.deepEqual(terms("Dibujar, DIBUJAR"), ["dibujar"]);
  h.erase(saved.refs);
  assert.throws(() => h.engine.revalidate(h.owner, packet), {
    code: "stale_version",
  });
  assert.throws(() => h.engine.details(h.owner, saved.refs), {
    code: "stale_version",
  });
});
