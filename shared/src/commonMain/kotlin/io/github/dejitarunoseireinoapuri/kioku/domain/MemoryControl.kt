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

enum class ForgetScope { Source, AllOccurrences }

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
