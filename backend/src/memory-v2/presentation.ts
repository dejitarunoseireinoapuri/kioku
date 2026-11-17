import type { Firestore } from "firebase-admin/firestore";
import type { Reference } from "#memory-v2/src/contracts";
import type { MemoryPrototype } from "#memory-v2/src/memory";
import { AccountError } from "../account/contracts.js";
import { loadV2State, privateDigest } from "./state-store.js";
import type { LoadedState } from "./state-store.js";
import type { V2Reply } from "./contracts.js";
import { managementGroup, unitGroup } from "./management.js";

export function presentGroup(loaded: LoadedState, id: string) {
  const group = managementGroup(loaded, id);
  if (!group) throw new AccountError("failed-precondition");
  const units = group.unitIds.map((id) => loaded.state.units[id]!);
  return {
    apiVersion: 2,
    sourceId: id,
    version: privateDigest([
      loaded.runtime.generation,
      loaded.state.epoch,
      id,
      units.map((u) => [u.id, u.revision, u.membershipRevision]),
    ]),
    text: units.map((u) => u.content.text).join("\n"),
    receivedAt: new Date(group.recordedAt).toISOString(),
    memoryEpoch: loaded.state.epoch,
    sourceKind: "retained",
    items: units.map((u) => ({ id: u.id, text: u.content.text })),
  };
}

export function presentEvidence(
  loaded: LoadedState,
  refs: Reference[],
): ReturnType<MemoryPrototype["evidence"]>["items"] {
  return refs.map((ref) => {
    const unit = loaded.state.units[ref.id];
    if (!unit || unit.revision !== ref.revision)
      throw new AccountError("failed-precondition");
    const fragments = Object.values(loaded.state.fragments).filter((f) =>
      f.owners.includes(unit.id),
    );
    const sourceIds = new Set(fragments.map((f) => f.sourceId));
    return {
      unit,
      fragments,
      sources: Object.values(loaded.state.sources).filter((s) =>
        sourceIds.has(s.id),
      ),
      mentionCount: Object.values(loaded.state.occurrences).filter(
        (o) =>
          o.unitId === unit.id &&
          o.fragmentIds.some(
            (id) => loaded.state.fragments[id]?.role === "primary",
          ),
      ).length,
    };
  });
}

export async function presentSaved(
  db: Firestore,
  uid: string,
  generation: string,
  reply: V2Reply,
): Promise<V2Reply> {
  if (reply.status !== "saved") return reply;
  return db.runTransaction(
    async (tx) => {
      const requestId = String(reply.operationId);
      const loaded = await loadV2State(tx, db, uid, generation, requestId);
      const receipt = loaded.state.receipts[requestId];
      if (
        !receipt ||
        receipt.kind !== "capture" ||
        typeof reply.sourceId !== "string" ||
        !loaded.groups.some((g) => g.id === reply.sourceId)
      )
        return {
          apiVersion: 2,
          operationId: reply.operationId,
          status: "expired",
        };
      const group = presentGroup(loaded, reply.sourceId);
      return {
        ...reply,
        memoryEpoch: receipt.epoch,
        source: {
          sourceId: group.sourceId,
          text: group.text,
          receivedAt: group.receivedAt,
        },
      };
    },
    { maxAttempts: 3 },
  );
}

export function groupsForUnits(loaded: LoadedState, ids: string[]) {
  const selected = new Map<string, { sourceId: string; receivedAt: string }>();
  for (const id of ids) {
    const group = unitGroup(loaded, id);
    selected.set(group.id, {
      sourceId: group.id,
      receivedAt: new Date(group.recordedAt).toISOString(),
    });
  }
  return [...selected.values()];
}
