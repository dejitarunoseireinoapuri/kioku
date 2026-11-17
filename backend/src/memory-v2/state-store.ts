import { createHash } from "node:crypto";
import type { Firestore, Transaction } from "firebase-admin/firestore";
import type { Snapshot } from "#memory-v2/src/model";
import { emptySnapshot } from "#memory-v2/src/model";
import { validateSnapshot, checkChangeLimits } from "#memory-v2/src/invariants";
import { AccountError } from "../account/contracts.js";
import { authorizeV2 } from "./access.js";
import {
  canonicalTables,
  collectionNames,
  groupSchema,
  recordSchemas,
  tables,
} from "./records.js";
import type { MemoryGroup, V2Runtime, Table } from "./records.js";

export interface LoadedState {
  state: Snapshot;
  groups: MemoryGroup[];
  runtime: V2Runtime;
}
export const groupCollection = "memoryV2Groups";
export const operationsCollection = "memoryV2Operations";
export const plansCollection = "memoryV2Plans";
export const privateDigest = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");

/** Reads bounded canonical documents, never a persisted whole-account JSON snapshot. */
export async function loadV2State(
  tx: Transaction,
  db: Firestore,
  uid: string,
  generation: string,
  requestId?: string,
): Promise<LoadedState> {
  const runtime = await authorizeV2(tx, db, uid, generation);
  const state = emptySnapshot(uid);
  state.epoch = runtime.revision;
  const root = db.doc(`accounts/${uid}`);
  let remaining = 4096;
  for (const table of canonicalTables) {
    const records = await tx.get(
      root
        .collection(collectionNames[table])
        .limit(Math.min(remaining + 1, table === "units" ? 257 : 4097)),
    );
    if (records.size > remaining || (table === "units" && records.size > 256))
      throw new AccountError("resource-exhausted");
    remaining -= records.size;
    for (const document of records.docs) {
      const value = recordSchemas[table].parse(document.data());
      if (("id" in value ? value.id : value.unitId) !== document.id)
        throw new AccountError("failed-precondition");
      Object.assign(state[table], { [document.id]: value });
    }
  }
  const unitIds = Object.keys(state.units);
  if (unitIds.length) {
    const revoked = await tx.getAll(
      ...unitIds.map((id) =>
        root.collection(collectionNames.revocations).doc(id),
      ),
    );
    if (revoked.some((d) => d.exists))
      throw new AccountError("failed-precondition");
  }
  if (requestId) {
    for (const table of ["admissions", "receipts"] as const) {
      const document = await tx.get(
        root.collection(collectionNames[table]).doc(requestId),
      );
      if (document.exists)
        Object.assign(state[table], {
          [requestId]: recordSchemas[table].parse(document.data()),
        });
    }
  }
  const groups = await tx.get(root.collection(groupCollection).limit(4097));
  if (groups.size > 4096) throw new AccountError("resource-exhausted");
  const parsed = groups.docs.map((document) => {
    const group = groupSchema.parse(document.data());
    if (
      group.id !== document.id ||
      new Set(group.unitIds).size !== group.unitIds.length ||
      group.unitIds.some((id) => !state.units[id])
    )
      throw new AccountError("failed-precondition");
    return group;
  });
  validateSnapshot(state);
  return { state, groups: parsed, runtime };
}

/** Computes differences before writing; no deletes inferred from absence in metadata not loaded. */
export function persistV2State(
  tx: Transaction,
  db: Firestore,
  before: LoadedState,
  next: Snapshot,
  groups: MemoryGroup[],
  extraWrites: number,
): void {
  checkChangeLimits(before.state, next);
  const root = db.doc(`accounts/${next.ownerId}`);
  const changes: { table: Table; id: string; value: unknown | null }[] = [];
  for (const table of tables)
    for (const id of new Set([
      ...Object.keys(before.state[table]),
      ...Object.keys(next[table]),
    ])) {
      const previous = before.state[table][id],
        value = next[table][id];
      if (JSON.stringify(previous) !== JSON.stringify(value))
        changes.push({ table, id, value: value ?? null });
    }
  const oldGroups = new Map(before.groups.map((g) => [g.id, g])),
    newGroups = new Map(groups.map((g) => [g.id, g]));
  const groupChanges = [
    ...new Set([...oldGroups.keys(), ...newGroups.keys()]),
  ].filter(
    (id) =>
      JSON.stringify(oldGroups.get(id)) !== JSON.stringify(newGroups.get(id)),
  );
  if (changes.length + groupChanges.length + extraWrites + 1 > 400)
    throw new AccountError("resource-exhausted");
  for (const change of changes) {
    const ref = root.collection(collectionNames[change.table]).doc(change.id);
    if (change.value === null) tx.delete(ref);
    else tx.set(ref, change.value as Record<string, unknown>);
  }
  for (const id of groupChanges) {
    const ref = root.collection(groupCollection).doc(id),
      group = newGroups.get(id);
    if (group) tx.set(ref, group);
    else tx.delete(ref);
  }
  tx.update(root.collection("runtime").doc("memory"), { revision: next.epoch });
}

export function refreshGroups(
  before: LoadedState,
  next: Snapshot,
  created?: MemoryGroup,
): MemoryGroup[] {
  const groups = before.groups.flatMap((group) => {
    const unitIds = group.unitIds.filter((id) => next.units[id]);
    return unitIds.length
      ? [
          {
            ...group,
            unitIds,
            changed:
              group.changed ||
              unitIds.length !== group.unitIds.length ||
              unitIds.some(
                (id) =>
                  before.state.units[id]?.revision !== next.units[id]?.revision,
              ),
          },
        ]
      : [];
  });
  if (created) groups.push(created);
  return groups;
}
