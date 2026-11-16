import assert from "node:assert/strict";
import test from "node:test";
import { harness } from "../fixtures/harness.ts";
import { single } from "../fixtures/scenarios.ts";
import { MemoryPrototype } from "../src/memory.ts";
import { limits } from "../src/contracts.ts";

test("preparing and cancelling forget do not change canonical memory", () => {
  const h = harness(),
    saved = h.save(single("dibujar")),
    before = h.store.read();
  const plan = h.prepare({
    kind: "forget",
    requestId: h.runtime.id(),
    targets: saved.refs,
    excludeMatches: [],
  });
  assert.deepEqual(h.store.read(), before);
  h.engine.cancel(h.owner, plan.id);
  assert.throws(() => h.engine.commit(h.owner, plan.id), {
    code: "expired_plan",
  });
  assert.deepEqual(h.store.read(), before);
});

test("same prepare, double confirm and replay apply exactly once", () => {
  const h = harness(),
    input = {
      kind: "capture",
      requestId: h.runtime.id(),
      draft: single("dibujar"),
    };
  const plan = h.prepare(input);
  assert.deepEqual(h.prepare(input), plan);
  const first = h.engine.commit(h.owner, plan.id),
    state = h.store.read();
  assert.deepEqual(h.engine.commit(h.owner, plan.id), first);
  assert.deepEqual(h.engine.prepare(h.owner, input), first);
  assert.deepEqual(h.store.read(), state);
});

test("reusing a request with a different input is rejected before and after commit", () => {
  const h = harness(),
    requestId = h.runtime.id();
  const plan = h.prepare({
    kind: "capture",
    requestId,
    draft: single("dibujar"),
  });
  const changed = { kind: "capture", requestId, draft: single("pintar") };
  assert.throws(() => h.engine.prepare(h.owner, changed), {
    code: "operation_conflict",
  });
  h.engine.commit(h.owner, plan.id);
  assert.throws(() => h.engine.prepare(h.owner, changed), {
    code: "operation_conflict",
  });
});

test("lost transport before commit leaves all data untouched and permits explicit recovery", () => {
  const h = harness(),
    saved = h.save(single("dibujar"));
  const command = {
    kind: "forget",
    requestId: h.runtime.id(),
    targets: saved.refs,
    excludeMatches: [],
  };
  const plan = h.prepare(command),
    before = h.store.read();
  h.store.failNextCommit("before");
  assert.throws(() => h.engine.commit(h.owner, plan.id), {
    code: "transport_unknown",
  });
  assert.deepEqual(h.store.read(), before);
  assert.throws(() => h.engine.operation(h.owner, command.requestId), {
    code: "not_found",
  });
  h.engine.commit(h.owner, h.prepare(command).id);
  assert.equal(Object.keys(h.store.read().units).length, 0);
});

test("lost transport after commit is recovered from receipt without another mutation", () => {
  const h = harness(),
    saved = h.save(single("dibujar"));
  const command = {
    kind: "forget",
    requestId: h.runtime.id(),
    targets: saved.refs,
    excludeMatches: [],
  };
  const plan = h.prepare(command);
  h.store.failNextCommit("after");
  assert.throws(() => h.engine.commit(h.owner, plan.id), {
    code: "transport_unknown",
  });
  const state = h.store.read(),
    recovered = h.engine.operation(h.owner, command.requestId);
  assert.equal(recovered.status, "committed");
  assert.equal(Object.keys(state.units).length, 0);
  assert.deepEqual(h.engine.commit(h.owner, plan.id), recovered);
  assert.deepEqual(h.engine.prepare(h.owner, command), recovered);
  assert.deepEqual(h.store.read(), state);
});

test("a capture cannot resurrect after forget, receipt expiry and a service restart", () => {
  const h = harness(),
    command = {
      kind: "capture",
      requestId: h.runtime.id(),
      draft: single("dibujar"),
    };
  const saved = h.engine.commit(h.owner, h.prepare(command).id);
  h.erase(saved.refs);
  h.advance(limits.receiptMilliseconds + 1);
  h.store.expireReceipts(h.runtime.now());
  const restarted = new MemoryPrototype(
    h.store,
    h.runtime,
    (actor) => actor === h.owner,
  );
  const before = h.store.read(),
    replay = restarted.prepare(h.owner, command);
  assert.equal(replay.status, "committed");
  if (replay.status === "committed") {
    assert.equal(replay.current, false);
    assert.deepEqual(replay.refs, []);
  }
  assert.deepEqual(h.store.read(), before);
  assert.ok(!JSON.stringify(before).includes("dibujar"));
  assert.equal(Object.keys(before.receipts).length, 0);
});

test("an owner may deliberately recount a forgotten fact with a new operation", () => {
  const h = harness(),
    first = h.save(single("dibujar"));
  h.erase(first.refs);
  const fresh = h.save(single("dibujar"));
  assert.notEqual(fresh.refs[0]!.id, first.refs[0]!.id);
  assert.equal(Object.keys(h.store.read().units).length, 1);
});

test("changed membership invalidates an open forget plan; another copy is not silently added", () => {
  const h = harness(),
    first = h.save(single("dibujar"));
  const plan = h.prepare({
    kind: "forget",
    requestId: h.runtime.id(),
    targets: first.refs,
    excludeMatches: [],
  });
  h.save(single("dibujar", first.refs[0]!));
  const before = h.store.read();
  assert.throws(() => h.engine.commit(h.owner, plan.id), {
    code: "expired_plan",
  });
  assert.deepEqual(h.store.read(), before);
  assert.equal(Object.keys(before.occurrences).length, 2);
  h.erase(first.refs);
  assert.equal(Object.keys(h.store.read().occurrences).length, 0);
});

test("a late prepared capture cannot publish after an intervening forget", () => {
  const h = harness(),
    saved = h.save(single("dibujar"));
  const delayed = h.prepare({
    kind: "capture",
    requestId: h.runtime.id(),
    draft: single("pintar"),
  });
  h.erase(saved.refs);
  const before = h.store.read();
  assert.throws(() => h.engine.commit(h.owner, delayed.id), {
    code: "expired_plan",
  });
  assert.deepEqual(h.store.read(), before);
});

test("expired plans and clock rollback fail without applying anything", () => {
  for (const advance of [limits.planMilliseconds, -1]) {
    const h = harness(),
      saved = h.save(single("dibujar"));
    const plan = h.prepare({
      kind: "forget",
      requestId: h.runtime.id(),
      targets: saved.refs,
      excludeMatches: [],
    });
    h.advance(advance);
    assert.throws(() => h.engine.commit(h.owner, plan.id), {
      code: "expired_plan",
    });
    assert.equal(Object.keys(h.store.read().units).length, 1);
  }
});

test("foreign and revoked actors cannot read, prepare, confirm or recover results", () => {
  const h = harness(),
    saved = h.save(single("dibujar"));
  const plan = h.prepare({
    kind: "forget",
    requestId: h.runtime.id(),
    targets: saved.refs,
    excludeMatches: [],
  });
  for (const actor of ["different-synthetic-owner", h.owner]) {
    if (actor === h.owner) h.disable();
    for (const call of [
      () => h.engine.details(actor, saved.refs),
      () =>
        h.engine.prepare(actor, {
          kind: "capture",
          requestId: h.runtime.id(),
          draft: single("pintar"),
        }),
      () => h.engine.commit(actor, plan.id),
      () => h.engine.operation(actor, saved.requestId),
    ])
      assert.throws(call, { code: "not_authorized" });
  }
  assert.equal(Object.keys(h.store.read().units).length, 1);
});

test("mutating the returned plan, details or snapshot does not alter stored scope", () => {
  const h = harness(),
    first = h.save(single("dibujar")),
    second = h.save(single("pintar"));
  const plan = h.prepare({
    kind: "forget",
    requestId: h.runtime.id(),
    targets: first.refs,
    excludeMatches: [],
  });
  plan.targets.push(second.refs[0]!);
  h.engine.details(h.owner, second.refs)[0]!.unit.content.text = "tampered";
  delete h.store.read().units[second.refs[0]!.id];
  h.engine.commit(h.owner, plan.id);
  assert.equal(
    h.engine.details(h.owner, second.refs)[0]!.unit.content.text,
    "Quiero pintar",
  );
});

test("receipt recovery never returns stale corrected references", () => {
  const h = harness(),
    saved = h.save(single("dibujar"));
  h.engine.commit(
    h.owner,
    h.prepare({
      kind: "correct",
      requestId: h.runtime.id(),
      target: saved.refs[0],
      preserveTime: true,
      draft: single("pintar"),
    }).id,
  );
  const old = h.engine.operation(h.owner, saved.requestId);
  assert.equal(old.current, false);
  assert.deepEqual(old.refs, []);
});

test("changing caller-side evidence references cannot authorize an obsolete answer", () => {
  const h = harness(),
    saved = h.save(single("dibujar"));
  const packet = h.engine.evidence(h.owner, [saved.refs[0]!.id]);
  const corrected = h.engine.commit(
    h.owner,
    h.prepare({
      kind: "correct",
      requestId: h.runtime.id(),
      target: saved.refs[0],
      preserveTime: true,
      draft: single("pintar"),
    }).id,
  );
  packet.epoch = h.store.read().epoch;
  packet.refs = corrected.refs;
  assert.throws(() => h.engine.revalidate(h.owner, packet), {
    code: "stale_version",
  });
});
