import type {
  Firestore,
  Transaction,
  DocumentSnapshot,
} from "firebase-admin/firestore";
import { z } from "zod";
import { sourceSchema, snapshotVersion } from "#memory-core/domain";
import { AccountError } from "../account/contracts.js";
import { canonicalMemory } from "../query/search-projection.js";
import {
  forgetLimits,
  withoutVectors,
} from "../memory-control/forget-contracts.js";
import type { MemoryInventory } from "../memory-control/forget-contracts.js";

export const documentVersion = (entry: DocumentSnapshot) =>
  `${entry.updateTime?.seconds}:${entry.updateTime?.nanoseconds}`;

/** Complete bounded canonical inventory, including historical units and full source text. */
export async function readMemoryInventory(
  db: Firestore,
  tx: Transaction,
  uid: string,
): Promise<MemoryInventory> {
  const root = db.doc(`accounts/${uid}`);
  const sourceDocs = await tx.get(
    root.collection("sources").limit(forgetLimits.sources + 1),
  );
  const memoryDocs = await tx.get(
    root.collection("memories").limit(forgetLimits.memories + 1),
  );
  if (
    sourceDocs.size > forgetLimits.sources ||
    memoryDocs.size > forgetLimits.memories
  )
    throw new AccountError("resource-exhausted");
  const epoch = await tx.get(root.collection("runtime").doc("memory"));
  const memoryEpoch = Number(epoch.get("revision") ?? 0);
  if (!Number.isSafeInteger(memoryEpoch) || memoryEpoch < 0)
    throw new AccountError("failed-precondition");
  const memories = memoryDocs.docs.map((entry) => {
    const memory = canonicalMemory(entry.data());
    if (
      memory.id !== entry.id ||
      memory.vector.length !== 512 ||
      !Array.from(
        { length: 8 },
        (_, i) => `${memory.sourceId}-${i + 1}`,
      ).includes(memory.id)
    )
      throw new AccountError("failed-precondition");
    return memory;
  });
  const sources = sourceDocs.docs.map((entry) => {
    const source = sourceSchema.parse({
      id: entry.id,
      text: entry.get("text"),
      receivedAt: entry.get("receivedAt"),
      zone: entry.get("zone"),
      ...(entry.get("sourceKind") === undefined
        ? {}
        : { sourceKind: entry.get("sourceKind") }),
    });
    const items = memories.filter((memory) => memory.sourceId === source.id);
    if (
      !z.uuid().safeParse(source.id).success ||
      entry.get("id") !== source.id ||
      source.text.length > 10_020 ||
      !items.length ||
      items.length > 8 ||
      entry.get("memoryCount") !== items.length ||
      items.some(
        (memory) =>
          !source.text.includes(memory.quote) ||
          memory.zone !== source.zone ||
          memory.receivedAt !== source.receivedAt,
      )
    )
      throw new AccountError("failed-precondition");
    return source;
  });
  if (
    memories.some(
      (memory) => !sources.some((source) => source.id === memory.sourceId),
    )
  )
    throw new AccountError("failed-precondition");
  const retired = sources.length
    ? await tx.getAll(
        ...sources.map((source) =>
          root.collection("revocations").doc(source.id),
        ),
      )
    : [];
  if (retired.some((entry) => entry.exists))
    throw new AccountError("failed-precondition");
  if (
    JSON.stringify({ sources, memories: withoutVectors(memories) }).length >
    forgetLimits.characters
  )
    throw new AccountError("resource-exhausted");
  return {
    snapshot: { version: snapshotVersion, sources, memories },
    memoryEpoch,
    versions: [
      ...sourceDocs.docs.map((entry) => ({
        collection: "sources" as const,
        id: entry.id,
        version: documentVersion(entry),
      })),
      ...memoryDocs.docs.map((entry) => ({
        collection: "memories" as const,
        id: entry.id,
        version: documentVersion(entry),
      })),
    ],
  };
}

export function inventoryVersion(inventory: MemoryInventory): string {
  return JSON.stringify([
    inventory.memoryEpoch,
    [...inventory.versions].sort((a, b) =>
      `${a.collection}/${a.id}`.localeCompare(`${b.collection}/${b.id}`),
    ),
  ]);
}
