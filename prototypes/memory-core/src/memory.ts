import { limits, parseCommand, parseId, parseReferences } from "./contracts.ts";
import type { Reference } from "./contracts.ts";
import type { MemoryStore, Runtime, Receipt, Snapshot } from "./model.ts";
import { CoreError, requireThat } from "./errors.ts";
import { prepareTransition } from "./transition.ts";
import type { ScopeQuestion } from "./removal.ts";
import { current } from "./catalog.ts";

export interface Plan {
  status: "ready";
  id: string;
  kind: Receipt["kind"];
  requestId: string;
  epoch: number;
  expiresAt: number;
  issuedAt: number;
  targets: Reference[];
}
export interface Result {
  status: "committed";
  requestId: string;
  epoch: number;
  refs: Reference[];
  current: boolean;
}
interface Pending {
  plan: Plan;
  next: Snapshot;
  digest: string;
}

/** Isolated R1 application service. Authentication is injected, never inferred from data. */
export class MemoryPrototype {
  private readonly store: MemoryStore;
  private readonly runtime: Runtime;
  private readonly authorized: (actor: string) => boolean;
  private readonly plans = new Map<string, Pending>();
  private readonly evidenceScopes = new Map<
    string,
    {
      epoch: number;
      refs: Reference[];
      issuedAt: number;
    }
  >();

  constructor(
    store: MemoryStore,
    runtime: Runtime,
    authorized: (actor: string) => boolean,
  ) {
    this.store = store;
    this.runtime = runtime;
    this.authorized = authorized;
  }

  prepare(actor: string, input: unknown): Plan | Result | ScopeQuestion {
    const state = this.read(actor);
    const command = parseCommand(input);
    const digest = this.runtime.digest(
      JSON.stringify([state.ownerId, command]),
    );
    const admitted = state.admissions[command.requestId];
    if (admitted) {
      requireThat(admitted.digest === digest, "operation_conflict");
      return this.completed(state, command.requestId);
    }
    const pending = [...this.plans.values()].find(
      (p) => p.plan.requestId === command.requestId,
    );
    if (pending) {
      requireThat(pending.digest === digest, "operation_conflict");
      return structuredClone(pending.plan);
    }
    requireThat(this.plans.size < 8, "scope_too_large");
    const transition = prepareTransition(state, command, this.runtime, digest);
    if ("status" in transition) return transition;
    const plan: Plan = {
      status: "ready",
      id: this.runtime.id(),
      kind: command.kind,
      requestId: command.requestId,
      epoch: state.epoch,
      expiresAt: this.runtime.now() + limits.planMilliseconds,
      issuedAt: this.runtime.now(),
      targets:
        command.kind === "forget"
          ? command.targets
          : command.kind !== "capture"
            ? [command.target]
            : [],
    };
    requireThat(!this.plans.has(plan.id), "operation_conflict");
    transition.next.admissions[command.requestId]!.planId = plan.id;
    this.plans.set(plan.id, {
      plan: structuredClone(plan),
      next: transition.next,
      digest,
    });
    return structuredClone(plan);
  }

  /** Confirmation uses only an opaque, server-held plan. No model or caller-supplied delta. */
  commit(actor: string, planId: string): Result {
    const state = this.read(actor);
    parseId(planId);
    const completed = Object.entries(state.admissions).find(
      ([, admission]) => admission.planId === planId,
    );
    if (completed) return this.completed(state, completed[0]);
    const pending = this.plans.get(planId);
    requireThat(pending, "expired_plan");
    requireThat(pending.plan.epoch === state.epoch, "stale_version");
    try {
      this.store.commit(state.epoch, pending.next);
    } finally {
      // Includes old drafts: never retain them after a possibly committed mutation.
      this.plans.clear();
      this.evidenceScopes.clear();
    }
    return this.operation(actor, pending.plan.requestId);
  }

  cancel(actor: string, planId: string): void {
    this.read(actor);
    this.plans.delete(parseId(planId));
  }

  operation(actor: string, requestId: string): Result {
    return this.completed(this.read(actor), parseId(requestId));
  }

  details(actor: string, refs: Reference[]) {
    const state = this.read(actor);
    return parseReferences(refs).map((ref) => {
      const unit = current(state, ref);
      const fragments = Object.values(state.fragments).filter((f) =>
        f.owners.includes(unit.id),
      );
      const sourceIds = new Set(fragments.map((f) => f.sourceId));
      return {
        unit,
        fragments,
        mentionCount: Object.values(state.occurrences).filter(
          (occurrence) =>
            occurrence.unitId === unit.id &&
            occurrence.fragmentIds.some(
              (id) => state.fragments[id]?.role === "primary",
            ),
        ).length,
        sources: Object.values(state.sources).filter((s) =>
          sourceIds.has(s.id),
        ),
      };
    });
  }

  evidence(actor: string, ids: string[]) {
    const state = this.read(actor);
    requireThat(
      Array.isArray(ids) &&
        ids.length > 0 &&
        ids.length <= limits.affectedUnits,
      "invalid_input",
    );
    requireThat(new Set(ids).size === ids.length, "invalid_input");
    const refs = ids.map((id) => {
      const unit = state.units[parseId(id)];
      requireThat(unit, "not_found");
      return { id, revision: unit.revision };
    });
    requireThat(this.evidenceScopes.size < 8, "scope_too_large");
    const token = this.runtime.id();
    this.evidenceScopes.set(token, {
      epoch: state.epoch,
      refs: structuredClone(refs),
      issuedAt: this.runtime.now(),
    });
    return {
      token,
      epoch: state.epoch,
      refs,
      items: this.details(actor, refs),
    };
  }

  revalidate(actor: string, packet: { token: string }): void {
    const state = this.read(actor);
    const token = parseId(packet.token),
      scope = this.evidenceScopes.get(token);
    this.evidenceScopes.delete(token);
    requireThat(scope && scope.epoch === state.epoch, "stale_version");
    for (const ref of scope.refs) current(state, ref);
  }

  releaseEvidence(actor: string, token: string): void {
    this.read(actor);
    this.evidenceScopes.delete(parseId(token));
  }

  private read(actor: string): Snapshot {
    requireThat(this.authorized(actor), "not_authorized");
    const state = this.store.read();
    requireThat(state.ownerId === actor, "not_authorized");
    for (const [id, scope] of this.evidenceScopes) {
      if (
        scope.epoch !== state.epoch ||
        scope.issuedAt > this.runtime.now() ||
        scope.issuedAt + limits.planMilliseconds <= this.runtime.now()
      )
        this.evidenceScopes.delete(id);
    }
    for (const [id, pending] of this.plans) {
      if (
        pending.plan.expiresAt <= this.runtime.now() ||
        pending.plan.issuedAt > this.runtime.now() ||
        pending.plan.epoch !== state.epoch
      )
        this.plans.delete(id);
    }
    return state;
  }

  private completed(state: Snapshot, requestId: string): Result {
    const admitted = state.admissions[requestId];
    if (!admitted) throw new CoreError("not_found");
    const receipt = state.receipts[requestId];
    const refs =
      receipt && receipt.expiresAt > this.runtime.now()
        ? receipt.refs.filter(
            (ref) =>
              state.units[ref.id]?.revision === ref.revision &&
              !state.revocations[ref.id],
          )
        : [];
    return {
      status: "committed",
      requestId,
      epoch: admitted.epoch,
      refs,
      current: Boolean(
        receipt &&
          receipt.expiresAt > this.runtime.now() &&
          refs.length === receipt.refs.length,
      ),
    };
  }
}
