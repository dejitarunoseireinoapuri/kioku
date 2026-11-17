package io.github.dejitarunoseireinoapuri.kioku.domain

data class MemoryItem(
    val id: String,
    val text: String,
)

data class EditableSource(
    val source: MemorySource,
    val version: String,
    val items: List<MemoryItem>,
    val memoryRevision: Long,
)

enum class ChangeAction { Correct, Forget }

const val MAX_MANAGEMENT_SOURCES = 32

/** Selected values for local feedback only; never serialized as evidence or a command. */
data class MemoryChangeDescription(
    val previousText: String,
    val replacementText: String? = null,
)

fun EditableSource.describeChange(
    ids: List<String>,
    replacement: String?,
): MemoryChangeDescription? {
    val selected = items.filter { it.id in ids }
    if (ids.isEmpty() || ids.size != ids.distinct().size || selected.size != ids.size) return null
    return MemoryChangeDescription(selected.joinToString("\n") { it.text }, replacement)
}

enum class ForgetScope { Source, AllOccurrences }

data class SourceReplacement(
    val sourceId: String,
    val sourceIds: List<String>,
)

data class MemoryChangeCommand(
    val requestId: String,
    val sourceId: String,
    val expectedVersion: String,
    val memoryIds: List<String>,
    val action: ChangeAction,
    val correction: String?,
    val zone: String,
    val forgetScope: ForgetScope = ForgetScope.Source,
)

sealed interface MemoryChange {
    data class Confirmed(
        val action: ChangeAction,
        val memoryRevision: Long,
        val sourceIds: List<String> = emptyList(),
        val previousSourceId: String? = null,
        val replacements: List<SourceReplacement> = emptyList(),
    ) : MemoryChange

    data class Clarification(
        val text: String,
    ) : MemoryChange

    data class Failed(
        val issue: CaptureIssue,
    ) : MemoryChange

    data object Processing : MemoryChange
}

interface MemoryControlRepository {
    suspend fun details(id: String): EditableSource?

    suspend fun revision(): Long?

    fun prepare(
        source: EditableSource,
        ids: List<String>,
        action: ChangeAction,
        correction: String?,
    ): MemoryChangeCommand

    suspend fun execute(command: MemoryChangeCommand): MemoryChange
}
