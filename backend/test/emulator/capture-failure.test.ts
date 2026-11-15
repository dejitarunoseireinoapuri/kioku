import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, beforeEach, test } from "node:test";
import { deleteApp } from "firebase-admin/app";
import { MemoryError } from "#memory-core/domain";
import type { MemoryIntelligence } from "#memory-core/domain";
import { CaptureMemory } from "../../src/memory/capture.js";
import { FirestoreCaptureStore } from "../../src/firebase/capture-store.js";
import { captureFailure } from "../../src/memory/diagnostics.js";
import { adminApp, db } from "./helpers.js";

const uid = "capture-failure-owner";
let now = Date.parse("2026-11-15T14:00:00Z");
const store = new FirestoreCaptureStore(db, () => now);
const capture = new CaptureMemory(store);
const allowed = async () => {};
const input = () => ({
  apiVersion: 1 as const,
  requestId: randomUUID(),
  mode: "tell" as const,
  channel: "text" as const,
  text: "Quiero visitar un vivero.",
  zone: "Europe/Madrid",
});
const ai: MemoryIntelligence = {
  async extract(turn) {
    return {
      status: "saved",
      clarification: null,
      items: [
        {
          text: turn.text,
          quote: turn.text,
          kind: "intention",
          entities: [],
          time: { precision: "unknown", value: null, end: null, quote: null },
          provenance: "personal",
          attribution: null,
          attributionEvidence: null,
          eventStatus: "planned",
          lifecycle: "current",
        },
      ],
    };
  },
  async embed(texts) {
    return texts.map(() => Array(512).fill(0.5));
  },
  async answer() {
    throw new Error("Unused synthetic boundary");
  },
};
beforeEach(async () => {
  now = Date.parse("2026-11-15T14:00:00Z");
  await db.recursiveDelete(db.doc(`accounts/${uid}`));
  await db.doc("privateConfiguration/owner").set({ uid, enabled: true });
});
after(async () => {
  await db.terminate();
  await deleteApp(adminApp);
});

test("failed capture stores only private diagnostics and retry removes obsolete failure metadata", async () => {
  const command = input();
  await assert.rejects(
    capture.execute(
      uid,
      command,
      async () => ({
        ...ai,
        async embed() {
          throw new MemoryError("OPENAI_HTTP_429");
        },
      }),
      allowed,
    ),
  );
  const ref = db.doc(`accounts/${uid}/operations/${command.requestId}`);
  const failed = (await ref.get()).data()!;
  assert.deepEqual(failed.failure, {
    version: 1,
    stage: "embedding",
    reason: "usage-limit",
    code: "OPENAI_HTTP_429",
  });
  assert.deepEqual(await store.operation(uid, command.requestId), {
    apiVersion: 1,
    operationId: command.requestId,
    status: "failed",
  });
  await assert.rejects(store.operation("other", command.requestId), {
    message: "permission-denied",
  });
  assert.equal(
    (await db.collection(`accounts/${uid}/sources`).get()).empty,
    true,
  );
  assert.equal(
    (await capture.execute(uid, command, async () => ai, allowed)).status,
    "saved",
  );
  const saved = (await ref.get()).data()!;
  assert.equal(saved.failure, undefined);
  assert.equal(saved.pending, null);
  assert.equal(saved.attempts, 2);
});

test("three confirmed failures stop inference without misreporting credential configuration", async () => {
  const command = input();
  let calls = 0;
  const broken = async () => {
    calls++;
    throw new Error("Synthetic private error");
  };
  for (let i = 0; i < 3; i++)
    await assert.rejects(capture.execute(uid, command, broken, allowed));
  const result = {
    apiVersion: 1,
    operationId: command.requestId,
    status: "needsRetelling",
  };
  assert.deepEqual(await store.operation(uid, command.requestId), result);
  assert.deepEqual(
    await capture.execute(uid, command, broken, allowed),
    result,
  );
  assert.equal(calls, 3);
  assert.equal(
    (await db.collection(`accounts/${uid}/sources`).get()).empty,
    true,
  );
  now += 86_400_001;
  assert.equal(
    (await capture.execute(uid, command, broken, allowed)).status,
    "expired",
  );
  assert.equal(calls, 3);
});

test("an exhausted stale lease becomes terminal and cannot overwrite another worker", async () => {
  const command = input();
  for (let i = 0; i < 2; i++) {
    const work = await store.begin(uid, command);
    assert.ok("lease" in work);
    await store.fail(uid, work.lease);
  }
  const work = await store.begin(uid, command);
  assert.ok("lease" in work);
  now += 240_001;
  const other = await store.begin(uid, input());
  assert.ok("lease" in other);
  const result = await store.begin(uid, command);
  assert.ok("result" in result);
  assert.equal(result.result.status, "needsRetelling");
  assert.equal(
    (await db.doc(`accounts/${uid}/runtime/capture`).get()).get("nonce"),
    other.lease.nonce,
  );
  assert.equal(
    (await store.operation(uid, command.requestId)).status,
    "needsRetelling",
  );
  await assert.rejects(
    store.finish(
      uid,
      work.lease,
      { status: "ignored", clarification: null, items: [] },
      { version: 4, sources: [], memories: [] },
    ),
  );
});

test("a late failure cannot change a committed receipt or store arbitrary diagnostic text", async () => {
  const command = input();
  const work = await store.begin(uid, command);
  assert.ok("lease" in work);
  await store.finish(
    uid,
    work.lease,
    { status: "ignored", clarification: null, items: [] },
    { version: 4, sources: [], memories: [] },
  );
  await store.fail(
    uid,
    work.lease,
    captureFailure("interpretation", new MemoryError("MODEL_INCOMPLETE")),
  );
  assert.equal(
    (await store.operation(uid, command.requestId)).status,
    "ignored",
  );
  assert.equal(
    (await db.doc(`accounts/${uid}/operations/${command.requestId}`).get()).get(
      "failure",
    ),
    undefined,
  );
});

for (const stage of ["interpretation", "authorization", "commit"] as const)
  test(`capture records the actual ${stage} boundary without persisting the raw error`, async () => {
    const command = input();
    const provider = async () =>
      stage === "interpretation"
        ? {
            ...ai,
            async extract() {
              throw new MemoryError("MODEL_INCOMPLETE");
            },
          }
        : ai;
    const reauthorize = async () => {
      if (stage === "authorization")
        throw new Error("Synthetic private revoked identity");
      if (stage === "commit")
        await db.doc("privateConfiguration/owner").update({ enabled: false });
    };
    await assert.rejects(capture.execute(uid, command, provider, reauthorize));
    const failure = (
      await db.doc(`accounts/${uid}/operations/${command.requestId}`).get()
    ).get("failure");
    assert.equal(failure.stage, stage);
    assert.equal(JSON.stringify(failure).includes("Synthetic"), false);
    assert.equal(
      (await db.collection(`accounts/${uid}/sources`).get()).empty,
      true,
    );
  });
