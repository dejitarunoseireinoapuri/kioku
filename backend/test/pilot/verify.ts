import assert from "node:assert/strict";
import { once } from "node:events";
import { randomUUID, createHash } from "node:crypto";
import { after, test } from "node:test";
import { server } from "./server.js";
import { closePilotEnvironment } from "./environment.js";

if (!server.listening) await once(server, "listening");
const endpoint = "http://127.0.0.1:8787";
const session = await fetch(endpoint + "/session", { method: "POST" });
const { token } = (await session.json()) as { token: string };

async function post(
  path: string,
  payload: unknown = {},
  bearer: string | null = token,
) {
  const response = await fetch(endpoint + path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(45_000),
  });
  return {
    status: response.status,
    body: (await response.json()) as Record<string, unknown>,
  };
}

async function fixture(index: number) {
  const { body } = await post("/fixture", { index });
  return {
    apiVersion: 1,
    requestId: randomUUID(),
    title: body.title as string,
    format: body.format as string,
    bytes: body.bytes as string,
  };
}

function prepared(command: Awaited<ReturnType<typeof fixture>>) {
  return {
    requestId: command.requestId,
    title: command.title,
    format: command.format,
    checksum: createHash("sha256")
      .update(command.format)
      .update("\0")
      .update(Buffer.from(command.bytes, "base64"))
      .digest("hex"),
  };
}

async function upload(command: Awaited<ReturnType<typeof fixture>>) {
  const admission = await post("/admit", prepared(command));
  assert.equal(admission.status, 200);
  if (admission.body.state === "ready") return admission;
  const op = await post("/operation", { requestId: command.requestId });
  return post("/upload", { command, lease: op.body.lease });
}

after(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await closePilotEnvironment();
});

test("HTTP requires the isolated demo token before reading document payloads", async () => {
  assert.equal((await post("/catalog", {}, null)).status, 403);
  assert.equal(
    (await post("/catalog", {}, "invalid-synthetic-token")).status,
    403,
  );
  const response = await fetch(endpoint + "/session", {
    method: "POST",
    headers: { Origin: "https://example.test" },
  });
  assert.equal(response.status, 403);
});

test("upload cannot bypass prior admission or change admitted bytes", async () => {
  const command = await fixture(0);
  assert.equal(
    (await post("/upload", { command, lease: randomUUID() })).body.issue,
    "denied",
  );
  const admission = await post("/admit", prepared(command));
  const altered = {
    ...command,
    bytes: Buffer.from("Otro texto ficticio").toString("base64"),
  };
  assert.equal(
    (await post("/upload", { command: altered, lease: admission.body.lease }))
      .body.issue,
    "conflict",
  );
  await post("/cancel", { requestId: command.requestId });
});

test("TXT Markdown PDF and DOCX travel through HTTP and store extracted text only", async () => {
  for (const index of [0, 1, 2, 3]) {
    const result = await upload(await fixture(index));
    assert.equal(result.status, 200);
    assert.equal(result.body.state, "ready");
    const source = result.body.source as Record<string, unknown>;
    assert.equal(source.bytes, undefined);
    assert.ok(source.document);
  }
});

test("lost confirmation can be recovered through operation and identical replay without duplication", async () => {
  const command = await fixture(0);
  const first = await upload(command);
  const replay = await upload(command);
  assert.deepEqual(replay.body, first.body);
  const operation = await post("/operation", { requestId: command.requestId });
  assert.deepEqual(operation.body, first.body);
});

test("cancelled requests cannot publish or revive through replay", async () => {
  const command = await fixture(1);
  command.bytes = Buffer.from("Cancelación ficticia independiente.").toString(
    "base64",
  );
  const admission = await post("/admit", prepared(command));
  await post("/cancel", { requestId: command.requestId });
  assert.equal(
    (await post("/upload", { command, lease: admission.body.lease })).body
      .issue,
    "retired",
  );
  assert.equal((await post("/admit", prepared(command))).body.issue, "retired");
});

test("web fixture is text extraction without an internet request; arbitrary links fail closed", async () => {
  const result = await post("/web", {
    url: "https://kioku.example.test/guia",
    requestId: randomUUID(),
  });
  assert.equal(result.body.state, "ready");
  assert.equal(
    (
      await post("/web", {
        url: "https://www.example.com",
        requestId: randomUUID(),
      })
    ).body.issue,
    "unsupported",
  );
  const answer = await post("/query", { question: "fichas azules" });
  assert.ok((answer.body.citations as unknown[]).length);
});

test("forget confirms exact revision and removes the source from reading queries and old receipts", async () => {
  const command = await fixture(0);
  const result = await upload(command);
  const source = result.body.source as { id: string; revision: string };
  assert.equal(
    (await post("/forget", { id: source.id, revision: randomUUID() })).body
      .issue,
    "conflict",
  );
  assert.equal(
    (await post("/forget", { id: source.id, revision: source.revision })).body
      .forgotten,
    true,
  );
  assert.equal((await post("/read", { id: source.id })).body.issue, "retired");
  assert.equal(
    (await post("/operation", { requestId: command.requestId })).body.issue,
    "retired",
  );
  const query = await post("/query", {
    question: "planetario",
    sourceId: source.id,
  });
  assert.equal((query.body.citations as unknown[]).length, 0);
});
