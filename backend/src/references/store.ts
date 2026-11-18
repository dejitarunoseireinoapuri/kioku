import { createHash, randomUUID } from "node:crypto";
import type { Firestore, Transaction } from "firebase-admin/firestore";
import { z } from "zod";
import { authorizeV2 } from "../memory-v2/access.js";
import { documentSchema, limits, SourceError } from "./contracts.js";
import type { ExtractedDocument, SourceFormat } from "./contracts.js";

const stateSchema = z.strictObject({
  epoch: z.int().min(0),
  count: z.int().min(0).max(limits.sources),
  pending: z.int().min(0).max(limits.sources),
});
const operationSchema = z.strictObject({
  requestId: z.uuid(),
  fingerprint: z.string(),
  checksum: z.string(),
  title: z.string(),
  format: z.enum(["text", "markdown", "pdf", "docx", "html"]),
  stage: z.enum(["pending", "ready", "cancelled", "failed"]),
  lease: z.uuid(),
  epoch: z.int(),
  expiresAt: z.int(),
  sourceId: z.uuid().nullable(),
});
export const referenceSchema = z.strictObject({
  id: z.uuid(),
  revision: z.uuid(),
  title: z.string().min(1).max(200),
  importedAt: z.int(),
  generation: z.uuid(),
  checksum: z.string(),
  document: documentSchema,
  origin: z
    .strictObject({
      url: z.url().max(4096),
      requestedUrl: z.url().max(4096).optional(),
      readAt: z.int().nonnegative(),
    })
    .optional(),
});
export type ReferenceSource = z.infer<typeof referenceSchema>;
export type Admission =
  | { state: "ready"; source: ReferenceSource }
  | { state: "processing" }
  | { state: "started"; lease: string };
type Prepared = {
  requestId: string;
  checksum: string;
  title: string;
  format: SourceFormat;
};

export class ReferenceStore {
  private readonly db: Firestore;
  private readonly now: () => number;
  constructor(db: Firestore, now: () => number = Date.now) {
    this.db = db;
    this.now = now;
  }

  async epoch(uid: string, generation: string): Promise<number> {
    return this.db.runTransaction(
      async (tx) => (await this.state(tx, uid, generation)).state.epoch,
    );
  }

  private refs(uid: string, generation: string) {
    if (
      !/^[A-Za-z0-9_-]{1,128}$/u.test(uid) ||
      !z.uuid().safeParse(generation).success
    )
      throw new SourceError("denied");
    const root = this.db.doc(`accounts/${uid}/referenceCatalogs/${generation}`);
    return {
      root,
      sources: root.collection("sources"),
      operations: root.collection("operations"),
      content: root.collection("content"),
    };
  }

  private async state(tx: Transaction, uid: string, generation: string) {
    const runtime = await authorizeV2(tx, this.db, uid, generation);
    const refs = this.refs(uid, generation);
    const state = await tx.get(refs.root);
    return {
      refs,
      runtime,
      state: state.exists
        ? stateSchema.parse(state.data())
        : { epoch: 0, count: 0, pending: 0 },
    };
  }

  async begin(
    uid: string,
    generation: string,
    command: Prepared,
  ): Promise<Admission> {
    z.uuid().parse(command.requestId);
    if (
      !/^[a-f0-9]{64}$/u.test(command.checksum) ||
      !command.title.trim() ||
      command.title.length > 200
    )
      throw new SourceError("invalid");
    const fingerprint = createHash("sha256")
      .update(
        JSON.stringify([
          command.requestId,
          command.checksum,
          command.title,
          command.format,
        ]),
      )
      .digest("hex");
    await this.expire(uid, generation);
    return this.db.runTransaction(async (tx) => {
      const { refs, state } = await this.state(tx, uid, generation);
      const ref = refs.operations.doc(command.requestId);
      const previous = await tx.get(ref);
      if (previous.exists) {
        const op = operationSchema.parse(previous.data());
        if (op.fingerprint !== fingerprint) throw new SourceError("conflict");
        if (op.stage === "ready")
          return {
            state: "ready",
            source: await this.current(
              tx,
              refs.sources.doc(op.sourceId!),
              generation,
            ),
          };
        if (op.stage === "pending" && op.expiresAt > this.now())
          return { state: "processing" };
        throw new SourceError("retired");
      }
      const duplicate = await tx.get(refs.content.doc(command.checksum));
      let source: ReferenceSource | null = null;
      if (duplicate.exists)
        source = await this.current(
          tx,
          refs.sources.doc(duplicate.get("sourceId") as string),
          generation,
        );
      if (!source && state.count + state.pending >= limits.sources)
        throw new SourceError("too-large");
      const lease = randomUUID();
      tx.set(ref, {
        ...command,
        fingerprint,
        stage: source ? "ready" : "pending",
        lease,
        epoch: state.epoch,
        expiresAt: this.now() + 15 * 60_000,
        sourceId: source?.id ?? null,
        ...(source ? { title: "", checksum: "" } : {}),
      });
      if (source) return { state: "ready", source };
      tx.set(refs.root, { ...state, pending: state.pending + 1 });
      return { state: "started", lease };
    });
  }

  async complete(
    uid: string,
    generation: string,
    requestId: string,
    lease: string,
    document: ExtractedDocument,
    origin?: { url: string; requestedUrl?: string; readAt: number },
  ): Promise<ReferenceSource> {
    z.uuid().parse(requestId);
    z.uuid().parse(lease);
    documentSchema.parse(document);
    return this.db.runTransaction(async (tx) => {
      const { refs, state } = await this.state(tx, uid, generation);
      const ref = refs.operations.doc(requestId),
        snapshot = await tx.get(ref);
      const op = operationSchema.parse(snapshot.data());
      if (op.lease !== lease) throw new SourceError("denied");
      if (op.stage === "ready")
        return this.current(tx, refs.sources.doc(op.sourceId!), generation);
      if (op.stage !== "pending" || op.expiresAt <= this.now())
        throw new SourceError("retired");
      const duplicate = await tx.get(refs.content.doc(op.checksum));
      const existing = duplicate.exists
        ? await this.current(
            tx,
            refs.sources.doc(duplicate.get("sourceId") as string),
            generation,
          )
        : null;
      if (!existing && state.epoch !== op.epoch)
        throw new SourceError("conflict");
      if (document.format !== op.format) throw new SourceError("invalid");
      const source =
        existing ??
        referenceSchema.parse({
          id: randomUUID(),
          revision: randomUUID(),
          title: op.title,
          importedAt: this.now(),
          generation,
          checksum: op.checksum,
          document,
          ...(origin ? { origin } : {}),
        });
      if (!existing) {
        tx.create(refs.sources.doc(source.id), source);
        tx.set(refs.content.doc(op.checksum), { sourceId: source.id });
      }
      tx.set(ref, {
        ...op,
        title: "",
        checksum: "",
        stage: "ready",
        sourceId: source.id,
      });
      tx.set(refs.root, {
        epoch: state.epoch + (existing ? 0 : 1),
        count: state.count + (existing ? 0 : 1),
        pending: state.pending - 1,
      });
      return source;
    });
  }

  async cancel(uid: string, generation: string, requestId: string) {
    z.uuid().parse(requestId);
    return this.db.runTransaction(async (tx) => {
      const { refs, state } = await this.state(tx, uid, generation);
      const ref = refs.operations.doc(requestId),
        snapshot = await tx.get(ref);
      if (!snapshot.exists) throw new SourceError("invalid");
      const op = operationSchema.parse(snapshot.data());
      if (op.stage === "ready") {
        await this.current(tx, refs.sources.doc(op.sourceId!), generation);
        return { state: "ready" as const, sourceId: op.sourceId! };
      }
      if (op.stage === "pending") {
        tx.set(ref, { ...op, title: "", checksum: "", stage: "cancelled" });
        tx.set(refs.root, { ...state, pending: state.pending - 1 });
      }
      return { state: "cancelled" as const };
    });
  }

  async expire(uid: string, generation: string) {
    await this.db.runTransaction(async (tx) => {
      const { refs, state } = await this.state(tx, uid, generation);
      const pending = await tx.get(
        refs.operations.where("stage", "==", "pending").limit(limits.sources),
      );
      const expired = pending.docs.filter(
        (entry) => operationSchema.parse(entry.data()).expiresAt <= this.now(),
      );
      if (!expired.length) return;
      for (const entry of expired) {
        const op = operationSchema.parse(entry.data());
        tx.set(entry.ref, {
          ...op,
          title: "",
          checksum: "",
          stage: "cancelled",
        });
      }
      tx.set(refs.root, { ...state, pending: state.pending - expired.length });
    });
  }

  async read(uid: string, generation: string, id: string) {
    z.uuid().parse(id);
    return this.db.runTransaction(async (tx) => {
      const { refs } = await this.state(tx, uid, generation);
      return this.current(tx, refs.sources.doc(id), generation);
    });
  }

  async operation(uid: string, generation: string, requestId: string) {
    z.uuid().parse(requestId);
    return this.db.runTransaction(async (tx) => {
      const { refs } = await this.state(tx, uid, generation);
      const entry = await tx.get(refs.operations.doc(requestId));
      if (!entry.exists) throw new SourceError("invalid");
      const op = operationSchema.parse(entry.data());
      if (op.stage === "ready")
        return {
          state: "ready" as const,
          source: await this.current(
            tx,
            refs.sources.doc(op.sourceId!),
            generation,
          ),
        };
      if (op.stage !== "pending" || op.expiresAt <= this.now())
        throw new SourceError("retired");
      return { state: "processing" as const, lease: op.lease };
    });
  }

  async verifyUpload(
    uid: string,
    generation: string,
    command: Prepared,
    lease: string,
  ) {
    z.uuid().parse(command.requestId);
    z.uuid().parse(lease);
    await this.db.runTransaction(async (tx) => {
      const { refs } = await this.state(tx, uid, generation);
      const entry = await tx.get(refs.operations.doc(command.requestId));
      const parsed = operationSchema.safeParse(entry.data());
      if (!parsed.success) throw new SourceError("denied");
      const op = parsed.data;
      if (op.lease !== lease) throw new SourceError("denied");
      if (op.stage !== "pending" || op.expiresAt <= this.now())
        throw new SourceError("retired");
      if (
        op.title !== command.title ||
        op.format !== command.format ||
        op.checksum !== command.checksum
      )
        throw new SourceError("conflict");
    });
  }

  async catalog(uid: string, generation: string) {
    return this.db.runTransaction(async (tx) => {
      const { refs, state } = await this.state(tx, uid, generation);
      const entries = await tx.get(refs.sources.limit(limits.sources + 1));
      if (entries.size > limits.sources) throw new SourceError("too-large");
      return {
        epoch: state.epoch,
        sources: entries.docs.map((doc) => referenceSchema.parse(doc.data())),
      };
    });
  }

  async validate(
    tx: Transaction,
    uid: string,
    generation: string,
    epoch: number,
  ) {
    const current = await this.state(tx, uid, generation);
    if (current.state.epoch !== epoch) throw new SourceError("conflict");
  }

  async assertCurrent(uid: string, generation: string, epoch: number) {
    await this.db.runTransaction((tx) =>
      this.validate(tx, uid, generation, epoch),
    );
  }

  async forget(uid: string, generation: string, id: string, revision: string) {
    z.uuid().parse(id);
    z.uuid().parse(revision);
    await this.db.runTransaction(async (tx) => {
      const { refs, state, runtime } = await this.state(tx, uid, generation);
      const ref = refs.sources.doc(id),
        source = await this.current(tx, ref, generation);
      if (source.revision !== revision) throw new SourceError("conflict");
      // One authority stamp invalidates RAM query context when a documentary support is revoked.
      tx.update(this.db.doc(`accounts/${uid}/runtime/memory`), {
        revision: runtime.revision + 1,
      });
      tx.delete(ref);
      tx.delete(refs.content.doc(source.checksum));
      tx.create(refs.root.collection("revocations").doc(id), {
        revision,
        retiredAt: this.now(),
      });
      tx.set(refs.root, {
        ...state,
        count: state.count - 1,
        epoch: state.epoch + 1,
      });
    });
  }

  private async current(
    tx: Transaction,
    ref: FirebaseFirestore.DocumentReference,
    generation: string,
  ): Promise<ReferenceSource> {
    const entry = await tx.get(ref);
    if (!entry.exists) throw new SourceError("retired");
    const source = referenceSchema.parse(entry.data());
    if (source.generation !== generation) throw new SourceError("denied");
    return source;
  }
}
