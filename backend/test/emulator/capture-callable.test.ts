import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, beforeEach, test } from "node:test";
import { deleteApp } from "firebase-admin/app";
import { adminApp, callConfiguration, db, signInGoogle } from "./helpers.js";

beforeEach(async () => {
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
