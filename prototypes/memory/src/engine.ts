import {
  answerSchema,
  extractionSchema,
  sourceSchema,
  MemoryError,
} from "./domain.ts";
import type {
  Answer,
  Candidate,
  Extraction,
  MemoryIntelligence,
  MemoryRepository,
  Turn,
} from "./domain.ts";
import { retrieve } from "./search.ts";

export class MemoryEngine {
  readonly repository: MemoryRepository;
  readonly intelligence: MemoryIntelligence;
  readonly candidateLimit: number;

  constructor(
    repository: MemoryRepository,
    intelligence: MemoryIntelligence,
    candidateLimit = 6,
  ) {
    if (
      !Number.isInteger(candidateLimit) ||
      candidateLimit < 1 ||
      candidateLimit > 8
    ) {
      throw new MemoryError("CANDIDATE_LIMIT");
    }
    this.repository = repository;
    this.intelligence = intelligence;
    this.candidateLimit = candidateLimit;
  }

  async tell(
    turn: Turn,
    clarification: string | null = null,
  ): Promise<Extraction> {
    sourceSchema.parse(turn);
    try {
      new Intl.DateTimeFormat("es", { timeZone: turn.zone });
    } catch {
      throw new MemoryError("TIME_ZONE_INVALID");
    }
    if (
      !/^[a-zA-Z0-9-]{1,80}$/.test(turn.id) ||
      !turn.text.trim() ||
      turn.text.length > 8000
    ) {
      throw new MemoryError("TURN_INVALID");
    }
    if (
      clarification !== null &&
      (!clarification.trim() || clarification.length > 2000)
    ) {
      throw new MemoryError("CLARIFICATION_INVALID");
    }
    const snapshot = await this.repository.load();
    if (snapshot.sources.some((source) => source.id === turn.id))
      throw new MemoryError("TURN_ALREADY_EXISTS");
    const extracted = extractionSchema.parse(
      await this.intelligence.extract(turn, clarification),
    );
    const sourceText = clarification
      ? `${turn.text}\nAclaración: ${clarification}`
      : turn.text;
    this.validateExtraction(extracted, sourceText);
    if (extracted.status !== "saved") return extracted;
    const vectors = await this.intelligence.embed(
      extracted.items.map((item) => item.text),
    );
    if (vectors.length !== extracted.items.length)
      throw new MemoryError("EMBEDDING_COUNT");
    snapshot.sources.push({ ...turn, text: sourceText });
    extracted.items.forEach((item, index) =>
      snapshot.memories.push({
        ...item,
        id: `${turn.id}-${index + 1}`,
        sourceId: turn.id,
        revision: 1,
        receivedAt: turn.receivedAt,
        zone: turn.zone,
        vector: vectors[index]!,
      }),
    );
    await this.repository.save(snapshot);
    return extracted;
  }

  async ask(
    question: string,
    at: string,
  ): Promise<{ answer: Answer; candidates: Candidate[] }> {
    if (
      !question.trim() ||
      question.length > 2000 ||
      !Number.isFinite(Date.parse(at))
    ) {
      throw new MemoryError("QUESTION_INVALID");
    }
    const snapshot = await this.repository.load();
    const vectors = await this.intelligence.embed([question]);
    if (!vectors[0]) throw new MemoryError("EMBEDDING_COUNT");
    const candidates = retrieve(
      snapshot.memories,
      question,
      vectors[0],
      this.candidateLimit,
    );
    const answer = answerSchema.parse(
      await this.intelligence.answer(question, at, candidates),
    );
    const allowed = new Set(candidates.map(({ memory }) => memory.sourceId));
    if (
      answer.sourceIds.some((id) => !allowed.has(id)) ||
      (answer.status === "answered" && answer.sourceIds.length === 0)
    ) {
      throw new MemoryError("ANSWER_EVIDENCE_INVALID");
    }
    return { answer, candidates };
  }

  async forget(sourceId: string): Promise<void> {
    const snapshot = await this.repository.load();
    if (!snapshot.sources.some((source) => source.id === sourceId))
      throw new MemoryError("SOURCE_NOT_FOUND");
    await this.repository.save({
      version: 1,
      sources: snapshot.sources.filter((source) => source.id !== sourceId),
      memories: snapshot.memories.filter(
        (memory) => memory.sourceId !== sourceId,
      ),
    });
  }

  private validateExtraction(result: Extraction, source: string): void {
    if (
      (result.status === "saved") !== result.items.length > 0 ||
      (result.status === "needs_clarification") !==
        Boolean(result.clarification)
    ) {
      throw new MemoryError("EXTRACTION_STATE_INVALID");
    }
    if (result.items.some((item) => !source.includes(item.quote)))
      throw new MemoryError("QUOTE_NOT_IN_SOURCE");
  }
}
