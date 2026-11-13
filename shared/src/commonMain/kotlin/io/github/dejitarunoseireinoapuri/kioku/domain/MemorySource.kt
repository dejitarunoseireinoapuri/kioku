package io.github.dejitarunoseireinoapuri.kioku.domain

data class SourceCorrection(
    val instruction: String,
    val currentSummary: String,
)

data class MemorySource(
    val id: String,
    val originalText: String,
    val recordedOn: String,
    val correction: SourceCorrection? = null,
)

interface SourceRepository {
    fun find(id: String): MemorySource?
}

sealed interface SourceResult {
    data class Found(
        val source: MemorySource,
    ) : SourceResult

    data object Unavailable : SourceResult
}

/** Resolves only references belonging to the current conversation, without granting server authorization. */
class ReadReferencedSource(
    private val repository: SourceRepository,
) {
    operator fun invoke(
        id: String,
        references: Set<String>,
    ): SourceResult {
        if (id !in references) return SourceResult.Unavailable
        return repository.find(id)?.let(SourceResult::Found) ?: SourceResult.Unavailable
    }
}
