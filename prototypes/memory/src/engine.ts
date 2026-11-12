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
import { validateTime, canonicalTime } from "./temporal.ts";
import { selectEvidence } from "./evidence.ts";
import { literalQuote } from "./literal.ts";
import { requiredClarification } from "./clarification.ts";

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
    if (
      /sk-[A-Za-z0-9_-]{20,}/u.test(turn.text) ||
      (clarification && /sk-[A-Za-z0-9_-]{20,}/u.test(clarification))
    ) {
      throw new MemoryError("CREDENTIAL_NOT_MEMORY");
    }
    const snapshot = await this.repository.load();
    if (snapshot.sources.some((source) => source.id === turn.id))
      throw new MemoryError("TURN_ALREADY_EXISTS");
    const missing =
      clarification === null ? requiredClarification(turn.text) : null;
    if (missing)
      return {
        status: "needs_clarification",
        clarification: missing,
        items: [],
      };
    const parsed = extractionSchema.parse(
      await this.intelligence.extract(turn, clarification),
    );
    const sourceText = clarification
      ? `${turn.text}\nAclaración: ${clarification}`
      : turn.text;
    const extracted = {
      ...parsed,
      items: parsed.items.map((item) => {
        const quote = literalQuote(item.quote, sourceText);
        const time = canonicalTime(item.time, quote, sourceText, {
          receivedAt: turn.receivedAt,
          zone: turn.zone,
          clarification,
        });
        return {
          ...item,
          quote,
          time,
          text:
            time.precision !== item.time.precision ||
            time.value !== item.time.value ||
            time.end !== item.time.end
              ? quote
              : item.text,
        };
      }),
    };
    this.validateExtraction(extracted, sourceText, turn);
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
    if (/sk-[A-Za-z0-9_-]{20,}/u.test(question))
      throw new MemoryError("CREDENTIAL_NOT_MEMORY");
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
    const ranked = retrieve(
      snapshot.memories,
      question,
      vectors[0],
      this.candidateLimit,
    );
    const { candidates, sources } = selectEvidence(ranked, snapshot.sources);
    const answer = answerSchema.parse(
      await this.intelligence.answer(question, at, candidates, sources),
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
      version: 2,
      sources: snapshot.sources.filter((source) => source.id !== sourceId),
      memories: snapshot.memories.filter(
        (memory) => memory.sourceId !== sourceId,
      ),
    });
  }

  private validateExtraction(
    result: Extraction,
    source: string,
    turn: Turn,
  ): void {
    if (
      (result.status === "saved") !== result.items.length > 0 ||
      (result.status === "needs_clarification") !==
        Boolean(result.clarification)
    ) {
      throw new MemoryError("EXTRACTION_STATE_INVALID");
    }
    if (result.items.some((item) => !source.includes(item.quote)))
      throw new MemoryError("QUOTE_NOT_IN_SOURCE");
    result.items.forEach((item) => validateTime(item.time, source, turn));
  }
}
