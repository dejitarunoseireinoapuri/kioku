import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, afterEach, beforeEach, test } from "node:test";
import { deleteApp } from "firebase-admin/app";
import { V2Capture } from "../../src/memory-v2/capture.js";
import { changeV2 } from "../../src/memory-v2/change.js";
import type { Change } from "../../src/memory-v2/contracts.js";
import { presentGroup } from "../../src/memory-v2/presentation.js";
import { queryV2 } from "../../src/memory-v2/query.js";
import { V2Reader } from "../../src/memory-v2/reader.js";
import { V2WorkStore } from "../../src/memory-v2/work-store.js";
import { V2MutationStore } from "../../src/memory-v2/mutation-store.js";
import { adminApp, db, projectId, region, signInGoogle } from "./helpers.js";

let uid: string;
let token: string;
let generation: string;
const reauthorize = async () => {};
const noModel = async () => {
  throw Error("Unexpected local model access");
};
const zone = "Europe/Madrid";
const firstLocation = "Mi brújula está en el cajón azul.";
const newLocation = "Mi brújula está en el armario.";
const otherLocation = "Mi paraguas verde está en el coche.";
const compassQuestion = "¿Dónde está mi brújula?";
const source = (reply: WireReply) => reply.sources?.[0]?.sourceId ?? "";
const reader = () => new V2Reader(db, uid, generation);

interface WireReply {
  status?: string;
  text?: string;
  memoryEpoch?: number;
  sourceId?: string;
  source?: { text: string };
  sources?: { sourceId: string }[];
  version?: string;
  items?: { id: string }[];
  plan?: { action: string; memoryEpoch: number };
}

beforeEach(async () => {
  const login = await signInGoogle(`location-prototype-${randomUUID()}`);
  uid = login.localId;
  token = login.idToken;
  generation = randomUUID();
  assert.match(uid, /^[A-Za-z0-9_-]{1,128}$/u);
  // Firebase links sign-ins with the same fixture email, so the UID may repeat.
  // helpers guards this deletion to the synthetic project and loopback emulator.
  await db.recursiveDelete(db.doc(`accounts/${uid}`));
  await db
    .doc("privateConfiguration/owner")
    .set({ uid, enabled: true, window: 0, count: 1 });
  // This file's emulator guards enforce the synthetic project and loopback ports.
  await db.doc("privateConfiguration/ai").delete();
  await db
    .doc(`accounts/${uid}/runtime/memory`)
    .set({ schemaVersion: 2, status: "active", generation, revision: 0 });
});

after(async () => {
  await db.terminate();
  await deleteApp(adminApp);
});

afterEach(async () => {
  assert.match(uid, /^[A-Za-z0-9_-]{1,128}$/u);
  await db.recursiveDelete(db.doc(`accounts/${uid}`));
});

async function call(
  operation: string,
  payload: unknown,
  identity = token,
  memoryGeneration = generation,
) {
  const response = await fetch(
    `http://127.0.0.1:5007/${projectId}/${region}/memoryV2`,
    {
      method: "POST",
      signal: AbortSignal.timeout(20_000),
      headers: {
        "Content-Type": "application/json",
        ...(identity ? { Authorization: `Bearer ${identity}` } : {}),
      },
      body: JSON.stringify({
        data: {
          apiVersion: 2,
          operation,
          generation: memoryGeneration,
          payload,
        },
      }),
    },
  );
  return {
    status: response.status,
    body: (await response.json()) as {
      result?: WireReply;
      error?: { status: string };
    },
  };
}

async function request(operation: string, payload: Record<string, unknown>) {
  const reply = await call(operation, { apiVersion: 2, ...payload });
  assert.equal(reply.status, 200);
  assert.ok(reply.body.result);
  return reply.body.result;
}

const submit = (
  text: string,
  requestId = randomUUID(),
  expectedEpoch?: number,
) => ({
  apiVersion: 2 as const,
  requestId,
  mode: "tell" as const,
  channel: "text" as const,
  text,
  zone,
  ...(expectedEpoch === undefined ? {} : { expectedEpoch }),
});
const ask = (text: string, requestId = randomUUID()) => ({
  apiVersion: 2 as const,
  requestId,
  text,
  zone,
});
const route = (mode: "tell" | "ask", text: string, memoryEpoch: number) =>
  request("route", {
    requestId: randomUUID(),
    mode,
    text,
    zone,
    memoryEpoch,
    context: { questions: [], sourceIds: [] },
  });

async function commandFor(
  sourceId: string,
  correction?: string,
): Promise<Change> {
  const details = await request("details", { sourceId });
  assert.ok(details.version && details.items?.length === 1);
  return {
    apiVersion: 2,
    requestId: randomUUID(),
    sourceId,
    expectedVersion: details.version,
    memoryIds: [details.items[0]!.id],
    action: correction ? "correct" : "forget",
    correction: correction ?? null,
    zone,
    ...(correction ? {} : { forgetScope: "allOccurrences" as const }),
  };
}

test("the callable saves, retrieves, corrects and forgets a location in a catalog without an AI credential", async () => {
  const routing = await route("tell", firstLocation, 0);
  assert.equal(routing.plan?.action, "tell");
  const capture = submit(
    firstLocation,
    randomUUID(),
    routing.plan?.memoryEpoch,
  );
  const saved = await request("submit", capture);
  assert.equal(saved.status, "saved");
  assert.equal(saved.source?.text, firstLocation);
  assert.equal(saved.memoryEpoch, 1);
  assert.deepEqual(await request("submit", capture), saved);
  assert.equal(
    (await request("submit", submit(otherLocation))).status,
    "saved",
  );
  assert.equal((await route("ask", compassQuestion, 2)).plan?.action, "ask");
  const question = ask(compassQuestion);
  const before = await request("query", question);
  assert.equal(before.status, "answered");
  assert.equal(before.text, "Está en el cajón azul.");
  assert.equal(before.sources?.length, 1);
  assert.deepEqual((await request("query", question)).sources, []);
  const detailsBefore = await request("details", { sourceId: source(before) });
  assert.equal(detailsBefore.text, firstLocation);

  const correction = await commandFor(source(before), newLocation);
  assert.equal((await request("change", correction)).status, "corrected");
  const oldSource = await call("source", {
    apiVersion: 2,
    sourceId: source(before),
  });
  assert.equal(oldSource.body.error?.status, "FAILED_PRECONDITION");
  const after = await request("query", ask(compassQuestion));
  assert.equal(after.text, "Está en el armario.");
  assert.notEqual(source(after), source(before));
  const detailsAfter = await request("details", { sourceId: source(after) });
  assert.deepEqual(
    detailsAfter.items?.map(({ id }) => id),
    detailsBefore.items?.map(({ id }) => id),
  );
  assert.equal(detailsAfter.text, newLocation);

  assert.equal(
    (await request("change", await commandFor(source(after)))).status,
    "forgotten",
  );
  const staleContext = JSON.stringify({
    pregunta_actual: compassQuestion,
    preguntas_anteriores_solo_contexto: [compassQuestion],
    memory_revision: 3,
  });
  const forgotten = await request("query", ask(staleContext));
  assert.equal(forgotten.status, "notFound");
  assert.deepEqual(forgotten.sources, []);
  assert.equal(
    (await request("query", ask("¿Dónde está mi paraguas verde?"))).text,
    "Está en el coche.",
  );
  const retired = await db
    .doc(`accounts/${uid}/memoryV2Revocations/${correction.memoryIds[0]!}`)
    .get();
  assert.equal(retired.exists, true);
  const current = (await reader().load()).state;
  assert.ok(
    Object.values(current.fragments).every(
      (fragment) => !fragment.text.includes("brújula"),
    ),
  );
  assert.equal(Object.keys(current.units).length, 1);
});

test("equivalent locations reuse one identity; conflicting places and objects ask for clarification", async () => {
  const violet = "Mi brújula violeta está en el cajón azul.";
  assert.equal((await request("submit", submit(violet))).status, "saved");
  assert.equal(
    (
      await request(
        "submit",
        submit("Mi brujula violeta se encuentra en el cajon azul"),
      )
    ).status,
    "saved",
  );
  assert.equal(Object.keys((await reader().load()).state.units).length, 1);
  assert.equal(
    (await request("submit", submit("Mi brújula verde está en la cocina.")))
      .status,
    "saved",
  );
  assert.equal(
    (await request("query", ask(compassQuestion))).status,
    "needsClarification",
  );
  assert.equal(
    (await request("query", ask("Dime dónde está mi brújula violeta"))).text,
    "Está en el cajón azul.",
  );
  assert.equal(
    (await request("submit", submit("Mi brújula violeta está en el coche.")))
      .status,
    "saved",
  );
  const conflict = await request(
    "query",
    ask("¿Dónde está mi brújula violeta?"),
  );
  assert.equal(conflict.status, "needsClarification");
  assert.deepEqual(conflict.sources, []);
  assert.equal(
    (await request("query", ask("¿Dónde está mi brújula roja?"))).status,
    "notFound",
  );
});

test("a concurrent forget prevents publishing a location already selected in the old revision", async () => {
  await request("submit", submit(firstLocation));
  const ref = source(await request("query", ask(compassQuestion)));
  const forget = await commandFor(ref);
  const command = ask(compassQuestion);
  await assert.rejects(
    queryV2(
      db,
      uid,
      generation,
      command,
      noModel,
      async () => {
        assert.equal(
          (await changeV2(db, uid, generation, forget, noModel, reauthorize))
            .status,
          "forgotten",
        );
      },
      true,
    ),
    { message: "failed-precondition" },
  );
  const receipt = await db
    .doc(`accounts/${uid}/memoryV2Operations/${command.requestId}`)
    .get();
  assert.equal(receipt.get("reply"), null);
  assert.equal(
    (await request("query", ask(compassQuestion))).status,
    "notFound",
  );
});

test("authorization applies to the prototype and the disabled path cannot resolve a location directly", async () => {
  await request("submit", submit(firstLocation));
  const query = ask(compassQuestion);
  assert.equal((await call("query", query, "")).status, 401);
  assert.equal(
    (await call("query", query, token, randomUUID())).body.error?.status,
    "FAILED_PRECONDITION",
  );
  const other = await signInGoogle(
    `foreign-location-${randomUUID()}`,
    "foreign@example.test",
  );
  assert.equal((await call("query", query, other.idToken)).status, 403);
  await assert.rejects(
    queryV2(db, uid, generation, query, noModel, reauthorize),
    { message: "Unexpected local model access" },
  );
});

test("an opaque canonical memory forces the normal search and capture paths", async () => {
  const saved = await request("submit", submit(firstLocation));
  assert.ok(saved.sourceId);
  const text = "La guardaré en otro sitio cuando vuelva.";
  const fakeCapture = submit(text);
  const pending = await new V2WorkStore(db).begin(
    uid,
    generation,
    fakeCapture.requestId,
    fakeCapture,
    { text, at: "2026-11-20T11:00:00Z", zone },
  );
  assert.ok("lease" in pending);
  await new V2MutationStore(db).commit(uid, pending.lease, {
    kind: "capture",
    requestId: fakeCapture.requestId,
    draft: {
      text,
      zone,
      units: [
        {
          key: "thought",
          content: {
            text,
            proposition: text,
            subject: "propietario",
            kind: "intention",
            polarity: "positive",
            attribution: null,
            condition: "cuando vuelva",
          },
          time: {
            precision: "unknown",
            value: null,
            end: null,
            fragment: null,
          },
          existing: null,
        },
      ],
      fragments: [
        { start: 0, end: text.length, role: "primary", owners: ["thought"] },
      ],
      relations: [],
    },
  });
  await assert.rejects(
    queryV2(
      db,
      uid,
      generation,
      ask(compassQuestion),
      noModel,
      reauthorize,
      true,
    ),
    { message: "Unexpected local model access" },
  );
  await assert.rejects(
    new V2Capture(db, undefined, true).execute(
      uid,
      generation,
      submit(newLocation),
      noModel,
      reauthorize,
    ),
    { message: "Unexpected local model access" },
  );
  assert.equal(Object.keys((await reader().load()).state.units).length, 2);
  assert.equal(
    presentGroup(await reader().load(), saved.sourceId).text,
    firstLocation,
  );
});
