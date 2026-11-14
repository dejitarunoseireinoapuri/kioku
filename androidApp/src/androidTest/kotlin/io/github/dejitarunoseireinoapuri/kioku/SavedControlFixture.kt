package io.github.dejitarunoseireinoapuri.kioku

import io.github.dejitarunoseireinoapuri.kioku.domain.ChangeAction
import io.github.dejitarunoseireinoapuri.kioku.domain.EditableSource
import io.github.dejitarunoseireinoapuri.kioku.domain.MemoryChangeCommand
import io.github.dejitarunoseireinoapuri.kioku.domain.MemoryControlRepository
import io.github.dejitarunoseireinoapuri.kioku.domain.MemoryItem
import io.github.dejitarunoseireinoapuri.kioku.domain.MemorySource

internal class SavedControlFixture(
    private val source: MemorySource,
) : MemoryControlRepository {
    override suspend fun details(id: String) =
        source.takeIf { it.id == id }?.let {
            EditableSource(it, "fixture-version", listOf(MemoryItem("${it.id}-1", it.originalText)), 0)
        }

    override suspend fun revision() = 0L

    override fun prepare(
        source: EditableSource,
        ids: List<String>,
        action: ChangeAction,
        correction: String?,
    ): MemoryChangeCommand = error("Read-only navigation fixture")

    override suspend fun execute(command: MemoryChangeCommand) = error("Read-only navigation fixture")
}
