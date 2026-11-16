import assert from "node:assert/strict";
import test from "node:test";
import { harness } from "../fixtures/harness.ts";
import { single, twoPlans } from "../fixtures/scenarios.ts";
import { validateSnapshot } from "../src/invariants.ts";

test("a dependent fact requires explicit scope resolution before a plan is created", () => {
  const h = harness(),
    base = h.save(single("viajar en septiembre"));
  const dependent = single("leer durante ese viaje");
  dependent.relations.push({ kind: "requires", from: "a", to: base.refs[0]! });
  const child = h.save(dependent),
    before = h.store.read();
  const result = h.engine.prepare(h.owner, {
    kind: "forget",
    requestId: h.runtime.id(),
    targets: base.refs,
    excludeMatches: [],
  });
  assert.equal(result.status, "needs_scope");
  if (result.status === "needs_scope") {
    assert.equal(result.reason, "dependent_memory");
    assert.deepEqual(result.refs, child.refs);
  }
  assert.deepEqual(h.store.read(), before);
  h.erase([...base.refs, ...child.refs]);
  assert.equal(Object.keys(h.store.read().units).length, 0);
});

test("deleting the dependent does not silently delete its prerequisite", () => {
  const h = harness(),
    base = h.save(single("viajar"));
  const draft = single("leer en el viaje");
  draft.relations.push({ kind: "requires", from: "a", to: base.refs[0]! });
  const child = h.save(draft);
  h.erase(child.refs);
  assert.equal(
    h.engine.details(h.owner, base.refs)[0]!.unit.content.proposition,
    "viajar",
  );
});

test("an ambiguous duplicate can be explicitly included or excluded, not silently merged", () => {
  for (const include of [true, false]) {
    const h = harness(),
      first = h.save(single("dibujar")),
      draft = single("dibujar otro día");
    draft.relations.push({
      kind: "possibleSameAs",
      from: "a",
      to: first.refs[0]!,
    });
    const second = h.save(draft),
      before = h.store.read();
    const unresolved = h.engine.prepare(h.owner, {
      kind: "forget",
      requestId: h.runtime.id(),
      targets: first.refs,
      excludeMatches: [],
    });
    assert.equal(unresolved.status, "needs_scope");
    assert.deepEqual(h.store.read(), before);
    const plan = h.prepare({
      kind: "forget",
      requestId: h.runtime.id(),
      targets: include ? [...first.refs, ...second.refs] : first.refs,
      excludeMatches: include ? [] : second.refs,
    });
    h.engine.commit(h.owner, plan.id);
    assert.equal(Object.keys(h.store.read().units).length, include ? 0 : 1);
    validateSnapshot(h.store.read());
  }
});

test("excluding a real dependency does not authorize a partial deletion", () => {
  const h = harness(),
    first = h.save(single("viajar")),
    draft = single("leer durante ese viaje");
  draft.relations.push({ kind: "requires", from: "a", to: first.refs[0]! });
  const second = h.save(draft),
    before = h.store.read();
  assert.equal(
    h.engine.prepare(h.owner, {
      kind: "forget",
      requestId: h.runtime.id(),
      targets: first.refs,
      excludeMatches: second.refs,
    }).status,
    "needs_scope",
  );
  assert.deepEqual(h.store.read(), before);
});

test("cyclic dependencies and missing targets are rejected before admission", () => {
  const h = harness(),
    draft = twoPlans();
  draft.relations = [
    { kind: "requires", from: "a", to: { key: "b" } },
    { kind: "requires", from: "b", to: { key: "a" } },
  ];
  assert.throws(() => h.save(draft), { code: "evidence_invariant" });
  draft.relations = [{ kind: "requires", from: "a", to: { key: "missing" } }];
  assert.throws(() => h.save(draft), { code: "evidence_invariant" });
  assert.equal(h.store.read().epoch, 0);
});

test("date, subject, modality and attribution differences cannot be linked as the same identity", () => {
  for (const field of [
    "date",
    "subject",
    "kind",
    "attribution",
    "polarity",
    "condition",
    "proposition",
  ]) {
    const h = harness(),
      first = h.save(single("dibujar")),
      duplicate = single("dibujar", first.refs[0]!);
    const unit = duplicate.units[0]!;
    if (field === "date") {
      duplicate.text += " mañana";
      duplicate.fragments.push({
        start: duplicate.fragments[0]!.end,
        end: duplicate.text.length,
        role: "time",
        owners: ["a"],
      });
      unit.time = {
        precision: "day",
        value: "2026-05-11",
        end: null,
        fragment: 1,
      };
    } else if (field === "subject") unit.content.subject = "Elena";
    else if (field === "kind") unit.content.kind = "fact";
    else if (field === "attribution") unit.content.attribution = "Elena";
    else if (field === "polarity") unit.content.polarity = "negative";
    else if (field === "condition") unit.content.condition = "si llueve";
    else unit.content.proposition = "otro significado";
    const before = h.store.read();
    assert.throws(() => h.save(duplicate), { code: "scope_unresolved" });
    assert.deepEqual(h.store.read(), before);
  }
});

test("adding a compatible date enriches one identity without discarding earlier evidence", () => {
  const h = harness(),
    first = h.save(single("dibujar")),
    draft = single("dibujar");
  draft.text += " en junio";
  draft.fragments.push({
    start: draft.fragments[0]!.end,
    end: draft.text.length,
    role: "time",
    owners: ["a"],
  });
  draft.units[0]!.time = {
    precision: "month",
    value: "2026-06",
    end: null,
    fragment: 1,
  };
  const result = h.engine.commit(
    h.owner,
    h.prepare({
      kind: "enrich",
      requestId: h.runtime.id(),
      target: first.refs[0],
      draft,
    }).id,
  );
  assert.equal(result.refs[0]!.id, first.refs[0]!.id);
  assert.equal(Object.keys(h.store.read().occurrences).length, 2);
  assert.equal(h.store.read().units[first.refs[0]!.id]!.time.value, "2026-06");
  h.erase(result.refs);
  assert.equal(Object.keys(h.store.read().fragments).length, 0);
});

test("a contradictory date is not accepted as enrichment", () => {
  const h = harness(),
    first = h.save(twoPlans()),
    draft = single("aprender ajedrez");
  draft.text += " en julio";
  draft.fragments.push({
    start: draft.fragments[0]!.end,
    end: draft.text.length,
    role: "time",
    owners: ["a"],
  });
  draft.units[0]!.time = {
    precision: "month",
    value: "2026-07",
    end: null,
    fragment: 1,
  };
  const before = h.store.read();
  assert.throws(
    () =>
      h.prepare({
        kind: "enrich",
        requestId: h.runtime.id(),
        target: first.refs[1],
        draft,
      }),
    { code: "scope_unresolved" },
  );
  assert.deepEqual(h.store.read(), before);
});

test("correcting a dependent preserves its known dependency unless explicitly removed", () => {
  const h = harness(),
    first = h.save(single("viajar")),
    draft = single("leer en el viaje");
  draft.relations.push({ kind: "requires", from: "a", to: first.refs[0]! });
  const second = h.save(draft);
  const replacement = single("dibujar en el viaje");
  h.engine.commit(
    h.owner,
    h.prepare({
      kind: "correct",
      requestId: h.runtime.id(),
      target: second.refs[0],
      preserveTime: true,
      draft: replacement,
    }).id,
  );
  const result = h.engine.prepare(h.owner, {
    kind: "forget",
    requestId: h.runtime.id(),
    targets: first.refs,
    excludeMatches: [],
  });
  assert.equal(result.status, "needs_scope");
  assert.equal(Object.values(h.store.read().relations)[0]!.kind, "requires");
});

test("an explicit reviewed correction may remove its own obsolete dependency, never an unrelated edge", () => {
  const h = harness(),
    base = h.save(single("viajar")),
    draft = single("leer en el viaje");
  draft.relations.push({ kind: "requires", from: "a", to: base.refs[0]! });
  const child = h.save(draft),
    edge = Object.values(h.store.read().relations)[0]!;
  const unrelated = h.save(single("pintar"));
  assert.throws(
    () =>
      h.prepare({
        kind: "correct",
        requestId: h.runtime.id(),
        target: unrelated.refs[0],
        preserveTime: true,
        removeRelations: [edge.id],
        draft: single("escribir"),
      }),
    { code: "invalid_input" },
  );
  h.engine.commit(
    h.owner,
    h.prepare({
      kind: "correct",
      requestId: h.runtime.id(),
      target: child.refs[0],
      preserveTime: true,
      removeRelations: [edge.id],
      draft: single("leer en casa"),
    }).id,
  );
  h.erase(base.refs);
  assert.equal(Object.keys(h.store.read().units).length, 2);
});
