import assert from "node:assert/strict";
import { randomUUID, createHash } from "node:crypto";
import { beforeEach, after, test } from "node:test";
import { deleteApp } from "firebase-admin/app";
import { adminApp, db, signInGoogle, projectId, region } from "./helpers.js";

let token: string, uid: string, generation: string;
beforeEach(async () => {
  const account = await signInGoogle("reference-callable-fictional-owner");
  token = account.idToken;
  uid = account.localId;
  generation = randomUUID();
  await db.recursiveDelete(db.doc(`accounts/${uid}`));
  await db
    .doc("privateConfiguration/owner")
    .set({ uid, enabled: true, window: 0, count: 1 });
  await db
    .doc(`accounts/${uid}/runtime/memory`)
    .set({ schemaVersion: 2, status: "active", generation, revision: 0 });
});
after(async () => {
  await deleteApp(adminApp);
});
async function call(
  operation: string,
  payload: unknown = {},
  authenticated = true,
  current = generation,
) {
  const response = await fetch(
    `http://127.0.0.1:5007/${projectId}/${region}/referenceSources`,
    {
      method: "POST",
      signal: AbortSignal.timeout(45_000),
      headers: {
        "Content-Type": "application/json",
        ...(authenticated ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        data: { apiVersion: 1, generation: current, operation, payload },
      }),
    },
  );
  const body = (await response.json()) as {
    result?: Record<string, unknown>;
    error?: { status: string; details?: unknown };
  };
  return { status: response.status, ...body };
}

test("reference callable authenticates and rejects foreign generation and injected identity", async () => {
  assert.equal(
    (await call("catalog", {}, false)).error?.status,
    "UNAUTHENTICATED",
  );
  assert.equal(
    (await call("catalog", {}, true, randomUUID())).error?.status,
    "FAILED_PRECONDITION",
  );
  assert.equal(
    (await call("catalog", { uid: "foreign-fictional-account" })).error?.status,
    "INVALID_ARGUMENT",
  );
  assert.deepEqual((await call("catalog")).result?.sources, []);
});

test("authenticated split upload, current read, confirmed forget and replay use real handlers without AI", async () => {
  const text = "Documento ficticio. Lira usa un cuaderno violeta.";
  const requestId = randomUUID();
  const metadata = {
    requestId,
    title: "Manual ficticio",
    format: "text",
    checksum: createHash("sha256").update("text\0").update(text).digest("hex"),
  };
  const admission = await call("admit", metadata);
  assert.equal(admission.result?.state, "started");
  const uploaded = await call("upload", {
    lease: admission.result?.lease,
    command: {
      apiVersion: 1,
      requestId,
      title: metadata.title,
      format: "text",
      bytes: Buffer.from(text).toString("base64"),
    },
  });
  assert.equal(uploaded.result?.state, "ready");
  const source = uploaded.result?.source as { id: string; revision: string };
  assert.equal(
    (await call("read", { id: source.id })).result?.title,
    metadata.title,
  );
  // Emulator refuses constructing the production provider, even with documents present.
  assert.equal(
    (
      await call("query", {
        requestId: randomUUID(),
        question: "¿Qué usa Lira?",
      })
    ).error?.status,
    "FAILED_PRECONDITION",
  );
  assert.equal(
    (await call("forget", { id: source.id, revision: source.revision })).result
      ?.forgotten,
    true,
  );
  assert.deepEqual((await call("catalog")).result?.sources, []);
  assert.ok((await call("read", { id: source.id })).error);
  assert.ok((await call("admit", metadata)).error);
});
