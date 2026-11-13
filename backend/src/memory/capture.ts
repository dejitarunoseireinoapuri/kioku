import { MemoryEngine } from "#memory-core/engine";
import { snapshotVersion } from "#memory-core/domain";
import type {
  MemoryIntelligence,
  MemoryRepository,
  Snapshot,
} from "#memory-core/domain";
import type {
  CaptureInput,
  CaptureResult,
  CaptureStore,
  ClarificationInput,
} from "./contracts.js";

/** Stages only the current turn. The store commits its source/items and receipt atomically. */
class StagedCapture implements MemoryRepository {
  snapshot: Snapshot = { version: snapshotVersion, sources: [], memories: [] };
  async load(): Promise<Snapshot> {
    return this.snapshot;
  }
  async save(snapshot: Snapshot): Promise<void> {
    this.snapshot = snapshot;
  }
}

export class CaptureMemory {
  private readonly store: CaptureStore;
  constructor(store: CaptureStore) {
    this.store = store;
  }

  async execute(
    uid: string,
    input: CaptureInput | ClarificationInput,
    intelligence: () => Promise<MemoryIntelligence>,
    reauthorize: () => Promise<void>,
  ): Promise<CaptureResult> {
    const work = await this.store.begin(uid, input);
    if ("result" in work) return work.result;
    try {
      const repository = new StagedCapture();
      const engine = new MemoryEngine(repository, await intelligence());
      const extracted = await engine.tell(
        work.lease.pending.turn,
        work.lease.pending.clarification,
      );
      await reauthorize();
      return await this.store.finish(
        uid,
        work.lease,
        extracted,
        repository.snapshot,
      );
    } catch (error) {
      // Uncertain commits remain inspectable; failure never overwrites a completed receipt.
      await this.store.fail(uid, work.lease).catch(() => undefined);
      throw error;
    }
  }
}
