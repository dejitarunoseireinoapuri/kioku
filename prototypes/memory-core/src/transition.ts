import type { Command, Reference } from "./contracts.ts";
import { limits } from "./contracts.ts";
import type { Runtime, Snapshot, Receipt } from "./model.ts";
import { current, refreshMembership } from "./catalog.ts";
import { capture, sameContentMeaning } from "./capture.ts";
import { forget, removeSupport, resolveScope } from "./removal.ts";
import type { ScopeQuestion } from "./removal.ts";
import { requireThat } from "./errors.ts";
import {
  checkChangeLimits,
  checkManageability,
  validateSnapshot,
} from "./invariants.ts";

export interface Transition {
  next: Snapshot;
  receipt: Receipt;
}

export function prepareTransition(
  before: Snapshot,
  command: Command,
  runtime: Runtime,
  digest: string,
): Transition | ScopeQuestion {
  const next = structuredClone(before);
  let refs: Reference[];
  if (command.kind === "capture") {
    const ids = capture(next, command.draft, runtime);
    refs = ids.map((id) => ({ id, revision: next.units[id]!.revision }));
  } else {
    const targets =
      command.kind === "forget" ? command.targets : [command.target];
    const scope = resolveScope(
      next,
      targets,
      command.kind === "forget" ? command.excludeMatches : [],
    );
    if (!Array.isArray(scope)) return scope;
    if (command.kind === "forget") {
      forget(next, scope, command.requestId);
      refs = [];
    } else
      refs =
        command.kind === "correct"
          ? correct(next, command, runtime)
          : enrich(next, command, runtime);
  }
  refreshMembership(before, next);
  next.epoch++;
  const receipt: Receipt = {
    requestId: command.requestId,
    kind: command.kind,
    status: "committed",
    refs,
    epoch: next.epoch,
    expiresAt: runtime.now() + limits.receiptMilliseconds,
  };
  next.admissions[command.requestId] = {
    digest,
    epoch: next.epoch,
    planId: null,
  };
  next.receipts[command.requestId] = receipt;
  validateSnapshot(next);
  checkChangeLimits(before, next);
  if (command.kind !== "forget") checkManageability(next);
  return { next, receipt };
}

function correct(
  next: Snapshot,
  command: Extract<Command, { kind: "correct" }>,
  runtime: Runtime,
): Reference[] {
  requireThat(
    command.draft.units.length === 1 && !command.draft.units[0]!.existing,
    "invalid_input",
  );
  const previous = structuredClone(current(next, command.target));
  if (command.preserveTime) {
    requireThat(
      command.draft.units[0]!.time.precision === "unknown",
      "invalid_input",
    );
  }
  const retainedRelations = Object.values(next.relations).filter(
    (r) =>
      (r.from === previous.id || r.to === previous.id) &&
      !command.removeRelations.includes(r.id),
  );
  requireThat(
    new Set(command.removeRelations).size === command.removeRelations.length,
    "invalid_input",
  );
  requireThat(
    command.removeRelations.every(
      (id) => next.relations[id]?.from === previous.id,
    ),
    "invalid_input",
  );
  removeSupport(
    next,
    [previous.id],
    command.preserveTime ? previous.timeEvidenceId : null,
  );
  for (const relation of retainedRelations)
    next.relations[relation.id] = relation;
  capture(next, command.draft, runtime, {
    unit: previous,
    preserveTime: command.preserveTime,
    kind: "correction",
  });
  return [{ id: previous.id, revision: previous.revision + 1 }];
}

function enrich(
  next: Snapshot,
  command: Extract<Command, { kind: "enrich" }>,
  runtime: Runtime,
): Reference[] {
  requireThat(
    command.draft.units.length === 1 && !command.draft.units[0]!.existing,
    "invalid_input",
  );
  requireThat(
    command.draft.fragments.every((f) => f.role !== "replaced"),
    "invalid_input",
  );
  const previous = structuredClone(current(next, command.target)),
    incoming = command.draft.units[0]!;
  sameContentMeaning(previous, incoming);
  requireThat(incoming.time.precision !== "unknown", "scope_unresolved");
  if (previous.time.precision !== "unknown") {
    requireThat(
      previous.time.precision === "year" || previous.time.precision === "month",
      "scope_unresolved",
    );
    requireThat(
      incoming.time.value?.startsWith(`${previous.time.value}-`),
      "scope_unresolved",
    );
    requireThat(
      incoming.time.precision === "month" || incoming.time.precision === "day",
      "scope_unresolved",
    );
  }
  capture(next, command.draft, runtime, {
    unit: previous,
    preserveTime: false,
    kind: "enrichment",
  });
  return [{ id: previous.id, revision: previous.revision + 1 }];
}
