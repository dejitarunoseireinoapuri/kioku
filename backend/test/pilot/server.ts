import { createServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { z } from "zod";
import { auth, db, generation, pilotSession, uid } from "./environment.js";
import { ReferenceStore } from "../../src/references/store.js";
import {
  importReference,
  uploadReference,
} from "../../src/references/service.js";
import { retrieveReferences } from "../../src/references/retrieve.js";
import { formatSchema, SourceError } from "../../src/references/contracts.js";
import { pilotFiles, pilotWeb } from "./fixtures.js";

const store = new ReferenceStore(db);
const id = z.strictObject({ id: z.uuid() });
const operation = z.strictObject({ requestId: z.uuid() });
const admission = z.strictObject({
  requestId: z.uuid(),
  title: z.string().trim().min(1).max(200),
  format: formatSchema,
  checksum: z.string().regex(/^[a-f0-9]{64}$/u),
});
let processing = false;

function send(response: ServerResponse, status: number, body: unknown) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  response.end(JSON.stringify(body));
}

async function body(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 14 * 1024 * 1024) throw new SourceError("too-large");
    chunks.push(Buffer.from(chunk));
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
}

async function dispatch(path: string, input: unknown) {
  switch (path) {
    case "/catalog": {
      const catalog = await store.catalog(uid, generation);
      return {
        epoch: catalog.epoch,
        sources: catalog.sources.map((source) => ({
          id: source.id,
          revision: source.revision,
          title: source.title,
          partial: source.document.coverage === "partial",
          fragments: source.document.chunks.length,
        })),
      };
    }
    case "/admit":
      return store.begin(uid, generation, admission.parse(input));
    case "/operation":
      return store.operation(uid, generation, operation.parse(input).requestId);
    case "/cancel":
      return store.cancel(uid, generation, operation.parse(input).requestId);
    case "/read":
      return store.read(uid, generation, id.parse(input).id);
    case "/forget": {
      const item = z
        .strictObject({ id: z.uuid(), revision: z.uuid() })
        .parse(input);
      await store.forget(uid, generation, item.id, item.revision);
      return { forgotten: true };
    }
    case "/query": {
      const query = z
        .strictObject({
          question: z.string().trim().min(1).max(2000),
          sourceId: z.uuid().optional(),
        })
        .parse(input);
      const snapshot = await store.catalog(uid, generation);
      const citations = retrieveReferences(
        snapshot.sources,
        query.question,
        query.sourceId,
      );
      if ((await store.catalog(uid, generation)).epoch !== snapshot.epoch)
        throw new SourceError("conflict");
      return { epoch: snapshot.epoch, citations };
    }
    case "/upload": {
      const upload = z
        .strictObject({ command: z.unknown(), lease: z.uuid() })
        .parse(input);
      return uploadReference(
        store,
        uid,
        generation,
        upload.command,
        upload.lease,
        { signal: AbortSignal.timeout(35_000) },
      );
    }
    case "/web": {
      const web = z
        .strictObject({ url: z.string().max(4096), requestId: z.uuid() })
        .parse(input);
      const fixture = pilotWeb(web.url);
      return importReference(store, uid, generation, {
        apiVersion: 1,
        requestId: web.requestId,
        title: fixture.title,
        format: fixture.format,
        bytes: Buffer.from(fixture.bytes).toString("base64"),
      });
    }
    case "/fixture": {
      const index = z
        .strictObject({ index: z.int().min(0).max(3) })
        .parse(input).index;
      const fixture = pilotFiles[index]!;
      return {
        title: fixture.title,
        format: fixture.format,
        bytes: Buffer.from(fixture.bytes).toString("base64"),
      };
    }
    default:
      throw new SourceError("invalid");
  }
}

export const server = createServer(async (request, response) => {
  try {
    if (
      request.headers.host !== "127.0.0.1:8787" ||
      request.headers.origin ||
      request.method !== "POST"
    )
      throw new SourceError("denied");
    if (request.url === "/session") {
      const session = await pilotSession();
      send(response, 200, { token: session.idToken, generation });
      return;
    }
    const token = request.headers.authorization?.match(/^Bearer (\S+)$/u)?.[1];
    if (!token) throw new SourceError("denied");
    const identity = await auth.verifyIdToken(token).catch(() => {
      throw new SourceError("denied");
    });
    if (identity.uid !== uid) throw new SourceError("denied");
    // A single lane bounds parser memory and prevents conflicting parallel imports in this pilot.
    if (processing) {
      send(response, 409, { issue: "busy" });
      return;
    }
    processing = true;
    try {
      send(
        response,
        200,
        await dispatch(request.url ?? "", await body(request)),
      );
    } finally {
      processing = false;
    }
  } catch (error) {
    const issue =
      error instanceof SourceError
        ? error.issue
        : error instanceof z.ZodError
          ? "invalid"
          : "unavailable";
    send(response, issue === "denied" ? 403 : 400, { issue });
  }
});
server.requestTimeout = 45_000;
server.headersTimeout = 10_000;
server.timeout = 45_000;
server.listen(8787, "127.0.0.1", () =>
  process.stdout.write(
    "Reference pilot ready on loopback; synthetic data only; AI absent.\n",
  ),
);
