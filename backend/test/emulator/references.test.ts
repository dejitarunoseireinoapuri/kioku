import assert from "node:assert/strict";
import { randomUUID, createHash } from "node:crypto";
import { beforeEach, after, test } from "node:test";
import { deleteApp } from "firebase-admin/app";
import { adminApp, db } from "./helpers.js";
import { ReferenceStore } from "../../src/references/store.js";
import {
  importReference,
  uploadReference,
} from "../../src/references/service.js";
import { extractIsolated } from "../../src/references/isolated-extractor.js";
import { retrieveReferences } from "../../src/references/retrieve.js";
import { SourceError } from "../../src/references/contracts.js";
import { AccountError } from "../../src/account/contracts.js";

const uid = "references-fictional-owner";
let generation = randomUUID(),
  now = 100_000;
const store = new ReferenceStore(db, () => now);
const command = (text = "Nara visita el planetario ficticio.") => ({
  apiVersion: 1,
  requestId: randomUUID(),
  title: "Itinerario ficticio",
  format: "text",
  bytes: Buffer.from(text).toString("base64"),
});
const prepared = () => ({
  requestId: randomUUID(),
  title: "Archivo ficticio pendiente",
  format: "text" as const,
  checksum: createHash("sha256").update(randomUUID()).digest("hex"),
});
const issue = (name: string) => (error: unknown) =>
  error instanceof SourceError && error.issue === name;

beforeEach(async () => {
  generation = randomUUID();
  now = 100_000;
  await db.recursiveDelete(db.doc(`accounts/${uid}`));
  await db.doc("privateConfiguration/owner").set({ uid, enabled: true });
  await db
    .doc(`accounts/${uid}/runtime/memory`)
    .set({ schemaVersion: 2, status: "active", generation, revision: 0 });
});
after(async () => {
  await deleteApp(adminApp);
});

test("file bytes are never persisted; only extracted text and versioned citations are stored", async () => {
  const input = command();
  const result = await importReference(store, uid, generation, input);
  assert.equal(result.state, "ready");
  if (result.state !== "ready") throw new Error("Fixture import failed");
  const source = await store.read(uid, generation, result.source.id);
  assert.equal(source.document.chunks.length, 1);
  const root = db.doc(`accounts/${uid}/referenceCatalogs/${generation}`);
  const operation = await root
    .collection("operations")
    .doc(input.requestId)
    .get();
  assert.equal(operation.get("title"), "");
  assert.equal(operation.get("checksum"), "");
  assert.equal(operation.get("bytes"), undefined);
  assert.equal(JSON.stringify(source).includes(input.bytes), false);
  assert.equal(
    (await db.collection(`accounts/${uid}/memoryV2Units`).get()).size,
    0,
  );
});

test("network-style replay and an identical new share return the same source without duplication", async () => {
  const input = command();
  const first = await importReference(store, uid, generation, input);
  const replay = await importReference(store, uid, generation, input);
  const duplicate = await importReference(store, uid, generation, {
    ...input,
    requestId: randomUUID(),
  });
  assert.deepEqual(replay, first);
  assert.deepEqual(duplicate, first);
  assert.equal((await store.catalog(uid, generation)).sources.length, 1);
  await assert.rejects(
    importReference(store, uid, generation, {
      ...input,
      title: "Another fictional title",
    }),
    issue("conflict"),
  );
});

test("another account, generation or disabled owner cannot read, admit or delete", async () => {
  const result = await importReference(store, uid, generation, command());
  if (result.state !== "ready") throw new Error("Fixture import failed");
  await assert.rejects(
    store.read("other-fictional-account", generation, result.source.id),
    (error) => error instanceof AccountError,
  );
  await assert.rejects(
    store.read(uid, randomUUID(), result.source.id),
    (error) => error instanceof AccountError,
  );
  await db.doc("privateConfiguration/owner").update({ enabled: false });
  await assert.rejects(
    store.forget(uid, generation, result.source.id, result.source.revision),
    (error) => error instanceof AccountError,
  );
  await assert.rejects(
    importReference(store, uid, generation, command()),
    (error) => error instanceof AccountError,
  );
});

test("explicit cancellation rejects a late worker and removes pending source metadata", async () => {
  const input = prepared();
  const admission = await store.begin(uid, generation, input);
  if (admission.state !== "started")
    throw new Error("Fixture admission failed");
  await store.cancel(uid, generation, input.requestId);
  const document = await extractIsolated(
    "text",
    Buffer.from("Texto ficticio tardío."),
  );
  await assert.rejects(
    store.complete(uid, generation, input.requestId, admission.lease, document),
    issue("retired"),
  );
  const op = await db
    .doc(
      `accounts/${uid}/referenceCatalogs/${generation}/operations/${input.requestId}`,
    )
    .get();
  assert.equal(op.get("title"), "");
  assert.equal((await store.catalog(uid, generation)).sources.length, 0);
});

test("expiry retires the request and releases admission capacity without reviving its ID", async () => {
  const input = prepared();
  await store.begin(uid, generation, input);
  now += 16 * 60_000;
  await store.expire(uid, generation);
  const state = await db
    .doc(`accounts/${uid}/referenceCatalogs/${generation}`)
    .get();
  assert.equal(state.get("pending"), 0);
  await assert.rejects(store.begin(uid, generation, input), issue("retired"));
});

test("forgetting revokes citations and replays while preserving another independent source", async () => {
  const input = command();
  const first = await importReference(store, uid, generation, input);
  const second = await importReference(
    store,
    uid,
    generation,
    command("Lira usa un cuaderno violeta ficticio."),
  );
  if (first.state !== "ready" || second.state !== "ready")
    throw new Error("Fixture import failed");
  await assert.rejects(
    store.forget(uid, generation, first.source.id, randomUUID()),
    issue("conflict"),
  );
  await store.forget(uid, generation, first.source.id, first.source.revision);
  await assert.rejects(
    store.read(uid, generation, first.source.id),
    issue("retired"),
  );
  await assert.rejects(
    importReference(store, uid, generation, input),
    issue("retired"),
  );
  assert.deepEqual(
    await store.read(uid, generation, second.source.id),
    second.source,
  );
  const catalog = await store.catalog(uid, generation);
  assert.equal(retrieveReferences(catalog.sources, "planetario").length, 0);
  assert.equal(retrieveReferences(catalog.sources, "cuaderno").length, 1);
});

test("a worker admitted before forgetting cannot publish the forgotten content again", async () => {
  const original = await importReference(store, uid, generation, command());
  if (original.state !== "ready") throw new Error("Fixture import failed");
  const input = prepared();
  const pending = await store.begin(uid, generation, input);
  if (pending.state !== "started") throw new Error("Fixture admission failed");
  await store.forget(
    uid,
    generation,
    original.source.id,
    original.source.revision,
  );
  const document = original.source.document;
  await assert.rejects(
    store.complete(uid, generation, input.requestId, pending.lease, document),
    issue("conflict"),
  );
  await store.cancel(uid, generation, input.requestId);
  assert.equal((await store.catalog(uid, generation)).sources.length, 0);
});

test("a fresh explicit share after deletion receives new identities instead of unretiring old evidence", async () => {
  const input = command();
  const first = await importReference(store, uid, generation, input);
  if (first.state !== "ready") throw new Error("Fixture import failed");
  await store.forget(uid, generation, first.source.id, first.source.revision);
  const next = await importReference(store, uid, generation, {
    ...input,
    requestId: randomUUID(),
  });
  if (next.state !== "ready") throw new Error("Fixture reimport failed");
  assert.notEqual(next.source.id, first.source.id);
  await assert.rejects(
    store.read(uid, generation, first.source.id),
    issue("retired"),
  );
});

test("split admission binds bytes and lease before extraction and recovers an uncertain confirmation", async () => {
  const input = command();
  const checksum = createHash("sha256")
    .update(input.format)
    .update("\0")
    .update(Buffer.from(input.bytes, "base64"))
    .digest("hex");
  const prepared = {
    requestId: input.requestId,
    title: input.title,
    format: "text" as const,
    checksum,
  };
  await assert.rejects(
    uploadReference(store, uid, generation, input, randomUUID()),
    issue("denied"),
  );
  const admission = await store.begin(uid, generation, prepared);
  if (admission.state !== "started")
    throw new Error("Fixture admission failed");
  await assert.rejects(
    store.verifyUpload(uid, generation, prepared, randomUUID()),
    issue("denied"),
  );
  await assert.rejects(
    uploadReference(
      store,
      uid,
      generation,
      {
        ...input,
        bytes: Buffer.from("Otro texto ficticio").toString("base64"),
      },
      admission.lease,
    ),
    issue("conflict"),
  );
  assert.deepEqual(await store.operation(uid, generation, input.requestId), {
    state: "processing",
    lease: admission.lease,
  });
  const saved = await uploadReference(
    store,
    uid,
    generation,
    input,
    admission.lease,
  );
  assert.deepEqual(
    await store.operation(uid, generation, input.requestId),
    saved,
  );
  assert.deepEqual(await store.begin(uid, generation, prepared), saved);
});

test("operation recovery and upload verification remain scoped to owner generation and expiry", async () => {
  const preparedInput = prepared();
  const admission = await store.begin(uid, generation, preparedInput);
  if (admission.state !== "started")
    throw new Error("Fixture admission failed");
  await assert.rejects(
    store.operation(
      "other-fictional-account",
      generation,
      preparedInput.requestId,
    ),
    (error) => error instanceof AccountError,
  );
  await assert.rejects(
    store.verifyUpload(uid, randomUUID(), preparedInput, admission.lease),
    (error) => error instanceof AccountError,
  );
  now += 16 * 60_000;
  await assert.rejects(
    store.operation(uid, generation, preparedInput.requestId),
    issue("retired"),
  );
  await assert.rejects(
    store.verifyUpload(uid, generation, preparedInput, admission.lease),
    issue("retired"),
  );
});
