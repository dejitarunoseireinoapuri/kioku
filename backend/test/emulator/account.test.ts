import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { deleteApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FirestoreOwnerAccess } from "../../src/firebase/owner-access.js";
import { adminApp, callConfiguration, db, signInGoogle } from "./helpers.js";

const owner = db.doc("privateConfiguration/owner");
beforeEach(async () => {
  await owner.delete();
  const response = await fetch(
    "http://127.0.0.1:9097/emulator/v1/projects/demo-kioku-local/accounts",
    {
      method: "DELETE",
      signal: AbortSignal.timeout(10_000),
    },
  );
  assert.equal(response.status, 200, "Synthetic Auth fixture reset failed");
});
after(async () => {
  await db.terminate();
  await deleteApp(adminApp);
});

test("callable accepts owner and restores the same account from a second sign-in", async () => {
  const first = await signInGoogle("owner-restored");
  const result = await callConfiguration(first.idToken);
  assert.equal(result.status, 200);
  assert.deepEqual(result.body, {
    result: {
      apiVersion: 1,
      account: "authorized",
      ai: "notConfigured",
      revision: 0,
    },
  });
  const second = await signInGoogle("owner-restored");
  assert.equal(second.localId, first.localId);
  assert.equal((await callConfiguration(second.idToken)).status, 200);
  const stored = (await owner.get()).data();
  assert.deepEqual(Object.keys(stored ?? {}).sort(), [
    "count",
    "enabled",
    "uid",
    "window",
  ]);
});

test("unauthenticated and another Google account cannot read or bind owner", async () => {
  assert.equal((await callConfiguration()).status, 401);
  const other = await signInGoogle("other", "other@example.test");
  assert.equal((await callConfiguration(other.idToken)).status, 403);
  assert.equal((await owner.get()).exists, false);
});

test("unverified email and payload owner injection are rejected", async () => {
  const unverified = await signInGoogle(
    "unverified",
    "owner@example.test",
    false,
  );
  assert.equal((await callConfiguration(unverified.idToken)).status, 403);
  const valid = await signInGoogle("input-owner");
  assert.equal(
    (await callConfiguration(valid.idToken, { apiVersion: 1, uid: "other" }))
      .status,
    400,
  );
  assert.equal(
    (
      await callConfiguration(valid.idToken, {
        apiVersion: 1,
        padding: "x".repeat(300),
      })
    ).status,
    400,
  );
  assert.equal((await owner.get()).exists, false);
});

test("a different UID with the permitted email cannot take over a bound account", async () => {
  await owner.set({
    uid: "previous-owner",
    enabled: true,
    window: 0,
    count: 1,
  });
  const candidate = await signInGoogle("same-email-new-identity");
  assert.equal((await callConfiguration(candidate.idToken)).status, 403);
  assert.equal((await owner.get()).get("uid"), "previous-owner");
});

test("disabled owner and disabled Firebase identity are refused", async () => {
  const identity = await signInGoogle("disabled-owner");
  assert.equal((await callConfiguration(identity.idToken)).status, 200);
  await owner.update({ enabled: false });
  assert.equal((await callConfiguration(identity.idToken)).status, 403);
  await owner.update({ enabled: true });
  await getAuth(adminApp).updateUser(identity.localId, { disabled: true });
  assert.equal((await callConfiguration(identity.idToken)).status, 401);
});

test("configuration reads are bounded and concurrent requests do not lose counts", async () => {
  const access = new FirestoreOwnerAccess(db);
  await owner.set({ uid: "rate-owner", enabled: true, window: 1, count: 28 });
  const results = await Promise.allSettled(
    Array.from({ length: 4 }, () => access.admit("rate-owner", 60_000)),
  );
  assert.equal(
    results.filter((result) => result.status === "fulfilled").length,
    2,
  );
  for (const result of results) {
    if (result.status === "rejected")
      assert.equal(result.reason.code, "resource-exhausted");
  }
  assert.equal((await owner.get()).get("count"), 30);
  await access.admit("rate-owner", 120_000);
  assert.equal((await owner.get()).get("count"), 1);
});

test("concurrent initial binding keeps exactly one immutable owner", async () => {
  const access = new FirestoreOwnerAccess(db);
  const results = await Promise.allSettled([
    access.admit("first", 1000),
    access.admit("second", 1000),
  ]);
  assert.equal(
    results.filter((result) => result.status === "fulfilled").length,
    1,
  );
  assert.equal(
    results.filter((result) => result.status === "rejected").length,
    1,
  );
  const storedUid: unknown = (await owner.get()).get("uid");
  assert.ok(storedUid === "first" || storedUid === "second");
  const loser = storedUid === "first" ? "second" : "first";
  await assert.rejects(access.admit(loser, 2000), {
    code: "permission-denied",
  });
});

test("a token older than server revocation is denied without rebinding", async () => {
  const identity = await signInGoogle("revoked-session");
  assert.equal((await callConfiguration(identity.idToken)).status, 200);
  // Set a deterministic revocation cutoff in the local Auth fixture; no sleeps.
  const result = await fetch(
    "http://127.0.0.1:9097/identitytoolkit.googleapis.com/v1/projects/demo-kioku-local/accounts:update",
    {
      method: "POST",
      signal: AbortSignal.timeout(10_000),
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer owner",
      },
      body: JSON.stringify({
        localId: identity.localId,
        validSince: String(Math.floor(Date.now() / 1000) + 60),
      }),
    },
  );
  assert.equal(result.status, 200, "Synthetic revocation setup failed");
  assert.equal((await callConfiguration(identity.idToken)).status, 401);
  assert.equal((await owner.get()).get("uid"), identity.localId);
});

test("corrupt private configuration fails closed", async () => {
  await owner.set({ uid: "corrupt-owner", enabled: "yes" });
  await assert.rejects(
    new FirestoreOwnerAccess(db).admit("corrupt-owner", 1000),
    {
      code: "failed-precondition",
    },
  );
});
