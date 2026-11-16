import type { MemoryStore, Snapshot } from "./model.ts";
import { CoreError, requireThat } from "./errors.ts";

/** RAM only; failure injection models lost transport, not Firestore's implementation. */
export class InMemoryStore implements MemoryStore {
  private state: Snapshot;
  private failAt: "before" | "after" | null = null;

  constructor(initial: Snapshot) {
    this.state = structuredClone(initial);
  }
  read(): Snapshot {
    return structuredClone(this.state);
  }
  failNextCommit(at: "before" | "after"): void {
    this.failAt = at;
  }

  commit(expectedEpoch: number, next: Snapshot): void {
    requireThat(
      this.state.epoch === expectedEpoch && next.epoch === expectedEpoch + 1,
      "stale_version",
    );
    requireThat(this.state.ownerId === next.ownerId, "not_authorized");
    const failure = this.failAt;
    this.failAt = null;
    if (failure === "before") throw new CoreError("transport_unknown");
    this.state = structuredClone(next);
    if (failure === "after") throw new CoreError("transport_unknown");
  }

  expireReceipts(now: number): void {
    let changed = false;
    for (const [id, receipt] of Object.entries(this.state.receipts)) {
      if (receipt.expiresAt <= now) {
        delete this.state.receipts[id];
        changed = true;
      }
    }
    if (changed) this.state.epoch++;
  }
}
