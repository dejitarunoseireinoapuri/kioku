import type { Firestore } from "firebase-admin/firestore";
import { SearchIndex, searchEntry } from "#memory-v2/src/search-index";
import { retrieve } from "#memory-v2/ai/search";
import type { StructuredModel } from "#memory-v2/ai/contracts";
import { AccountError } from "../account/contracts.js";
import { authorizeV2 } from "./access.js";
import { loadV2State } from "./state-store.js";
import type { LoadedState } from "./state-store.js";

export class V2Reader {
  readonly db: Firestore;
  readonly uid: string;
  readonly generation: string;
  constructor(db: Firestore, uid: string, generation: string) {
    this.db = db;
    this.uid = uid;
    this.generation = generation;
  }
  async load() {
    return this.db.runTransaction(
      (tx) => loadV2State(tx, this.db, this.uid, this.generation),
      { maxAttempts: 3 },
    );
  }
  async assertCurrent(epoch: number) {
    await this.db.runTransaction(
      async (tx) => {
        const runtime = await authorizeV2(
          tx,
          this.db,
          this.uid,
          this.generation,
        );
        if (runtime.revision !== epoch)
          throw new AccountError("failed-precondition");
      },
      { maxAttempts: 3 },
    );
  }
  async candidates(
    loaded: LoadedState,
    model: StructuredModel,
    text: string,
    at: string,
    zone: string,
    previous?: string,
  ) {
    const units = Object.values(loaded.state.units);
    if (units.length <= 32)
      return {
        units,
        ranked: false,
        truncated: false,
        exhaustiveRequested: false,
      };
    const entries = units.map((unit) =>
      searchEntry(unit, Object.values(loaded.state.fragments)),
    );
    const reader = {
      page: async (actor: string, cursor: number, limit: number) => {
        if (actor !== this.uid) throw new AccountError("permission-denied");
        return {
          owner: actor,
          epoch: loaded.state.epoch,
          total: entries.length,
          entries: entries.slice(cursor, cursor + limit),
          next: cursor + limit < entries.length ? cursor + limit : null,
        };
      },
      assertCurrent: async (actor: string, epoch: number) => {
        if (actor !== this.uid) throw new AccountError("permission-denied");
        await this.assertCurrent(epoch);
      },
    };
    const index = await SearchIndex.load(reader, this.uid);
    const found = await retrieve(model, reader, index, {
      actor: this.uid,
      text,
      at,
      zone,
      ...(previous ? { previous } : {}),
    });
    return {
      ...found,
      ranked: true,
      units: found.refs.map((ref) => loaded.state.units[ref.id]!),
    };
  }
}
