import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, beforeEach, test } from "node:test";
import { deleteApp } from "firebase-admin/app";
import { adminApp, callConfiguration, db, signInGoogle } from "./helpers.js";
import { fixture } from "./retirement-fixtures.js";
import { searchProjection } from "../../src/query/search-projection.js";
import { z } from "zod";
import { FirestoreRoutingStore } from "../../src/firebase/routing-store.js";
import { FirestoreSourceControlStore } from "../../src/firebase/source-control-store.js";
import { RouteMessage } from "../../src/conversation/route.js";
import { turn, ConversationIntelligence } from "./conversation-fixtures.js";

beforeEach(async () => {
  const fixtureOwner = await signInGoogle("capture-http-owner");
  await db.recursiveDelete(db.doc(`accounts/${fixtureOwner.localId}`));
  await db.doc("privateConfiguration/owner").delete();
  await db.doc("privateConfiguration/ai").delete();
});
after(async () => {
  await db.terminate();
  await deleteApp(adminApp);
});

async function call(name: string, data: unknown, token?: string) {
  const response = await fetch(
    `http://127.0.0.1:5007/demo-kioku-local/europe-west1/${name}`,
    {
      method: "POST",
      signal: AbortSignal.timeout(20_000),
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ data }),
    },
  );
  return { status: response.status, body: (await response.json()) as unknown };
}

test("memory endpoints refuse missing/foreign identity before any payload or provider work", async () => {
  const other = await signInGoogle("capture-http-other", "other@example.test");
  for (const name of [
    "submitTurn",
    "resolveClarification",
    "getOperation",
    "getSource",
    "queryMemory",
    "getSourceDetails",
    "changeMemory",
    "routeMessage",
    "applyMessage",
  ]) {
    assert.equal((await call(name, { apiVersion: 1 })).status, 401);
    assert.equal(
      (await call(name, { apiVersion: 1 }, other.idToken)).status,
      403,
    );
  }
  assert.equal(
    (await db.doc("privateConfiguration/owner").get()).exists,
    false,
  );
});

test("authenticated conversation tickets reject tampering and decline through HTTPS without provider access", async () => {
  const identity = await signInGoogle("conversation-http-owner");
  await callConfiguration(identity.idToken);
  await db
    .doc("privateConfiguration/search")
    .set({ uid: identity.localId, schema: 1, ready: true });
  const model = new ConversationIntelligence();
  const input = turn("Me gusta el miso.");
  model.intent = {
    action: "offer",
    fact: input.text,
    question: null,
    alsoAsk: false,
    useContext: false,
  };
  const service = new RouteMessage(
    new FirestoreRoutingStore(db),
    new FirestoreSourceControlStore(db),
  );
  const routed = await service.execute(
    identity.localId,
    input,
    async () => model,
    async () => {},
  );
  assert.equal(routed.status, "ready");
  if (routed.status !== "ready") throw new Error("Expected a ready fixture");
  const command = {
    apiVersion: 1,
    requestId: randomUUID(),
    turn: input,
    plan: routed.plan,
    decision: "reject",
  };
  assert.equal(
    (
      await call(
        "applyMessage",
        { ...command, uid: "foreign" },
        identity.idToken,
      )
    ).status,
    400,
  );
  const declined = await call("applyMessage", command, identity.idToken);
  assert.equal(declined.status, 200);
  assert.deepEqual(declined.body, {
    result: {
      apiVersion: 1,
      operationId: command.requestId,
      status: "declined",
    },
  });
  assert.deepEqual(
    (await call("applyMessage", command, identity.idToken)).body,
    declined.body,
  );
  assert.equal(
    (
      await call(
        "applyMessage",
        { ...command, decision: "accept" },
        identity.idToken,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await call(
        "routeMessage",
        { ...input, model: "arbitrary" },
        identity.idToken,
      )
    ).status,
    400,
  );
  assert.equal(
    (await db.collection(`accounts/${identity.localId}/sources`).get()).size,
    0,
  );
});

test("protected source details and full withdrawal work without provider access, with confirmed replay", async () => {
  const identity = await signInGoogle("control-http-owner");
  await callConfiguration(identity.idToken);
  await db
    .doc("privateConfiguration/search")
    .set({ uid: identity.localId, schema: 1, ready: true });
  const { source, memories } = fixture();
  const root = db.doc(`accounts/${identity.localId}`);
  await root.collection("sources").doc(source.id).set(source);
  for (const memory of memories)
    await root
      .collection("memories")
      .doc(memory.id)
      .set({ ...memory, ...searchProjection(memory) });
  const details = await call(
    "getSourceDetails",
    { apiVersion: 1, sourceId: source.id },
    identity.idToken,
  );
  assert.equal(details.status, 200);
  const data = z
    .object({
      result: z.object({
        version: z.string(),
        items: z.array(z.object({ id: z.string() })),
      }),
    })
    .parse(details.body).result;
  assert.equal(data.items.length, 2);
  const input = {
    apiVersion: 1,
    requestId: randomUUID(),
    sourceId: source.id,
    expectedVersion: data.version,
    memoryIds: data.items.map((item) => item.id),
    action: "forget",
    correction: null,
    zone: "Europe/Madrid",
  };
  assert.equal(
    (await call("changeMemory", { ...input, uid: "other" }, identity.idToken))
      .status,
    400,
  );
  const result = await call("changeMemory", input, identity.idToken);
  assert.equal(result.status, 200);
  assert.equal(
    z
      .object({
        result: z.object({
          status: z.literal("forgotten"),
          memoryEpoch: z.literal(1),
        }),
      })
      .safeParse(result.body).success,
    true,
  );
  assert.deepEqual(
    (await call("changeMemory", input, identity.idToken)).body,
    result.body,
  );
  assert.equal(
    (await root.collection("sources").doc(source.id).get()).exists,
    false,
  );
  assert.equal(
    (
      await call(
        "getSourceDetails",
        { apiVersion: 1, sourceId: source.id },
        identity.idToken,
      )
    ).status,
    400,
  );
});

test("authorized text capture rejects owner/secret injection, preserves exact input and does not save without AI", async () => {
  const owner = await signInGoogle("capture-http-owner");
  assert.equal((await callConfiguration(owner.idToken)).status, 200);
  const data = {
    apiVersion: 1,
    requestId: randomUUID(),
    mode: "tell",
    channel: "text",
    text: "Un dato ficticio",
    zone: "Europe/Madrid",
  };
  for (const invalid of [
    { ...data, uid: "different" },
    { ...data, mode: "ask" },
    { ...data, text: `sk-${"x".repeat(30)}` },
    { ...data, zone: "Invalid/Zone" },
  ]) {
    assert.equal(
      (await call("submitTurn", invalid, owner.idToken)).status,
      400,
    );
  }
  assert.equal(
    (await db.collection(`accounts/${owner.localId}/operations`).get()).empty,
    true,
  );
  assert.equal((await call("submitTurn", data, owner.idToken)).status, 400);
  assert.equal(
    (await db.collection(`accounts/${owner.localId}/sources`).get()).empty,
    true,
  );
  const operation = await call(
    "getOperation",
    { apiVersion: 1, requestId: data.requestId },
    owner.idToken,
  );
  assert.equal(operation.status, 200);
  assert.deepEqual(operation.body, {
    result: { apiVersion: 1, status: "failed", operationId: data.requestId },
  });
});
