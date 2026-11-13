import assert from "node:assert/strict";
import { test } from "node:test";
import { AccountError } from "../../src/account/contracts.js";
import type {
  CredentialRecord,
  CredentialStore,
  CredentialVault,
} from "../../src/credential/contracts.js";
import { PromoteCredential } from "../../src/credential/promote-credential.js";
import { OpenAiCredentialValidator } from "../../src/credential/openai-validator.js";
import { backendRuntime } from "../../src/firebase/runtime.js";

const key = "sk-" + "synthetic".repeat(5);
const input = {
  uid: "owner",
  expectedRevision: 0,
  operationId: "f5120a00-16b2-4af8-9e2c-21aed3940506",
  key,
};
const version = "projects/kioku-9454f/secrets/kioku-openai-owner/versions/1";

class Store implements CredentialStore {
  record: CredentialRecord | undefined;
  async current() {
    return this.record;
  }
  async activate(record: CredentialRecord, expected: number) {
    if ((this.record?.revision ?? 0) !== expected)
      throw new AccountError("failed-precondition");
    this.record = record;
  }
}

function fixture(store: CredentialStore = new Store(), valid = true) {
  const discarded: string[] = [];
  let staged = 0;
  const vault: CredentialVault = {
    stage: async (candidate) => {
      assert.equal(candidate, key);
      staged++;
      return version;
    },
    discard: async (name) => {
      discarded.push(name);
    },
  };
  return {
    service: new PromoteCredential(
      store,
      vault,
      { validate: async () => valid },
      () => 1000,
    ),
    staged: () => staged,
    discarded,
  };
}

test("rejected replacement preserves previous metadata without staging a secret", async () => {
  const store = new Store();
  const old = {
    uid: "owner",
    revision: 1,
    secretVersion: version,
    operationId: input.operationId,
    updatedAtMs: 0,
  };
  store.record = old;
  const f = fixture(store, false);
  await assert.rejects(f.service.execute({ ...input, expectedRevision: 1 }), {
    code: "invalid-argument",
  });
  assert.equal(store.record, old);
  assert.equal(f.staged(), 0);
});

test("valid credential returns only revision and stores no secret value", async () => {
  const store = new Store();
  const f = fixture(store);
  assert.deepEqual(await f.service.execute(input), { revision: 1 });
  assert.equal(JSON.stringify(store.record).includes(key), false);
  assert.equal(store.record?.secretVersion, version);
  assert.equal(f.staged(), 1);
});

test("stale revision is rejected before validation or staging", async () => {
  const f = fixture();
  await assert.rejects(f.service.execute({ ...input, expectedRevision: 2 }), {
    code: "failed-precondition",
  });
  assert.equal(f.staged(), 0);
});

test("an acknowledged-after-timeout commit is recovered without destroying the active version", async () => {
  const store = new Store();
  store.activate = async (record) => {
    store.record = record;
    throw new Error("synthetic timeout");
  };
  const f = fixture(store);
  assert.deepEqual(await f.service.execute(input), { revision: 1 });
  assert.deepEqual(f.discarded, []);
});

test("uncertain commit never destroys a version whose activation is unresolved", async () => {
  const store = new Store();
  store.activate = async () => {
    throw new Error("synthetic transport failure");
  };
  const f = fixture(store);
  await assert.rejects(f.service.execute(input), { code: "unavailable" });
  assert.deepEqual(f.discarded, []);
});

test("confirmed CAS conflict discards only its new candidate", async () => {
  const store = new Store();
  store.activate = async () => {
    throw new AccountError("failed-precondition");
  };
  const f = fixture(store);
  await assert.rejects(f.service.execute(input), { code: "unavailable" });
  assert.deepEqual(f.discarded, [version]);
});

test("validator uses fixed model metadata route, no inference, redirects or raw response error", async () => {
  for (const status of [200, 401, 403, 404, 429, 500]) {
    const validator = new OpenAiCredentialValidator(async (url, options) => {
      assert.equal(url, "https://api.openai.com/v1/models/gpt-6.1-sol");
      assert.equal(options?.redirect, "error");
      assert.equal(options?.method, undefined);
      return new Response("synthetic-private-error", { status });
    });
    if (status === 200) assert.equal(await validator.validate(key), true);
    else if ([401, 403, 404].includes(status))
      assert.equal(await validator.validate(key), false);
    else
      await assert.rejects(validator.validate(key), {
        message: "unavailable",
        code: "unavailable",
      });
  }
});

test("production requires complete project/app identity and refuses any emulator mixing", () => {
  const env = {
    KIOKU_ENVIRONMENT: "production",
    GCLOUD_PROJECT: "kioku-9454f",
    KIOKU_ALLOWED_EMAIL: "owner@example.test",
    KIOKU_ANDROID_APP_ID: "1:1008044927836:android:abcd",
    KIOKU_IOS_APP_ID: "1:1008044927836:ios:abcd",
  };
  assert.equal(backendRuntime(env).production, true);
  for (const patch of [
    { KIOKU_ALLOWED_EMAIL: "" },
    { KIOKU_ANDROID_APP_ID: "other" },
    { GCLOUD_PROJECT: "other" },
    { FIRESTORE_EMULATOR_HOST: "127.0.0.1:8087" },
    { FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9097" },
    { KIOKU_ENVIRONMENT: undefined },
  ]) {
    assert.throws(() => backendRuntime({ ...env, ...patch }), {
      code: "failed-precondition",
    });
  }
});
