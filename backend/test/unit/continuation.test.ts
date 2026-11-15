import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { managementChanges } from "../../src/memory-control/continuation.js";

test("management aliases cover every current reference once and include the selected retired source", () => {
  const sourceId = randomUUID(),
    other = randomUUID(),
    next = randomUUID();
  const changes = [
    { sourceId, sourceIds: [next] },
    { sourceId: other, sourceIds: [] },
  ];
  assert.deepEqual(managementChanges(changes, [next], sourceId), changes);
});

test("invented, duplicate, incomplete and unbounded aliases cannot become current management references", () => {
  const sourceId = randomUUID(),
    next = randomUUID();
  for (const invalid of [
    [],
    [{ sourceId, sourceIds: [randomUUID()] }],
    [{ sourceId, sourceIds: [next, next] }],
    [
      { sourceId, sourceIds: [next] },
      { sourceId, sourceIds: [] },
    ],
    [{ sourceId: randomUUID(), sourceIds: [next] }],
    [{ sourceId, sourceIds: [] }],
    [{ sourceId, sourceIds: [sourceId] }],
    [{ sourceId, sourceIds: [next], text: "Not a historical archive" }],
    Array.from({ length: 33 }, () => ({
      sourceId: randomUUID(),
      sourceIds: [],
    })),
  ])
    assert.throws(() => managementChanges(invalid, [next], sourceId));
});
