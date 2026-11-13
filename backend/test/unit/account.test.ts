import assert from "node:assert/strict";
import { test } from "node:test";
import { AccountError } from "../../src/account/contracts.js";
import type { VerifiedIdentity } from "../../src/account/contracts.js";
import { GetConfiguration } from "../../src/account/get-configuration.js";
import { requireLocalRuntime } from "../../src/firebase/runtime.js";

const identity: VerifiedIdentity = {
  uid: "synthetic-owner",
  email: "owner@example.test",
  emailVerified: true,
  provider: "google.com",
};
const payload = { apiVersion: 1 };

test("authorized Google identity gets only safe configuration", async () => {
  let calls = 0;
  const useCase = new GetConfiguration(
    "owner@example.test",
    {
      admit: async (uid, time) => {
        assert.equal(uid, identity.uid);
        assert.equal(time, 1000);
        calls++;
      },
    },
    () => 1000,
  );
  assert.deepEqual(await useCase.execute(identity, payload), {
    apiVersion: 1,
    account: "authorized",
    ai: "notConfigured",
    revision: 0,
  });
  assert.equal(calls, 1);
});

test("unauthorized identities never reach persistence", async () => {
  const useCase = new GetConfiguration(
    "owner@example.test",
    {
      admit: async () => {
        assert.fail("Unauthorized persistence access");
      },
    },
    Date.now,
  );
  await assert.rejects(useCase.execute(undefined, payload), {
    code: "unauthenticated",
  });
  for (const patch of [
    { email: "other@example.test" },
    { email: undefined },
    { emailVerified: false },
    { provider: "password" },
    { provider: undefined },
    { uid: "../other" },
  ]) {
    await assert.rejects(useCase.execute({ ...identity, ...patch }, payload), {
      code: "permission-denied",
    });
  }
});

test("exact versioned input rejects owner and secret injection", async () => {
  const useCase = new GetConfiguration(
    "owner@example.test",
    {
      admit: async () => {
        assert.fail("Invalid input reached storage");
      },
    },
    Date.now,
  );
  for (const data of [
    null,
    {},
    { apiVersion: 2 },
    { apiVersion: 1, uid: "other" },
    { apiVersion: 1, apiKey: "synthetic-not-a-key" },
    { apiVersion: 1, projectId: "other" },
  ]) {
    await assert.rejects(useCase.execute(identity, data), {
      code: "invalid-argument",
    });
  }
});

test("missing private access configuration fails closed", () => {
  assert.throws(
    () => new GetConfiguration("", { admit: async () => {} }, Date.now),
    { code: "failed-precondition" },
  );
});

test("revocation and rate limits from storage propagate without a success state", async () => {
  for (const code of ["permission-denied", "resource-exhausted"] as const) {
    const useCase = new GetConfiguration(
      "owner@example.test",
      {
        admit: async () => {
          throw new AccountError(code);
        },
      },
      Date.now,
    );
    await assert.rejects(useCase.execute(identity, payload), { code });
  }
});

test("emulator entry point refuses missing, remote or mixed environment", () => {
  const local = {
    FUNCTIONS_EMULATOR: "true",
    GCLOUD_PROJECT: "demo-kioku-local",
    FIRESTORE_EMULATOR_HOST: "127.0.0.1:8087",
    FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9097",
  };
  requireLocalRuntime(local);
  for (const patch of [
    { FUNCTIONS_EMULATOR: undefined },
    { GCLOUD_PROJECT: "kioku-9454f" },
    { FIRESTORE_EMULATOR_HOST: undefined },
    { FIREBASE_AUTH_EMULATOR_HOST: "remote:9097" },
  ]) {
    assert.throws(() => requireLocalRuntime({ ...local, ...patch }), {
      code: "failed-precondition",
    });
  }
});
