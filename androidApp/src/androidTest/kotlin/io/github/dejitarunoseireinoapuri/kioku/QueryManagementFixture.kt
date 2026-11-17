package io.github.dejitarunoseireinoapuri.kioku

import io.github.dejitarunoseireinoapuri.kioku.domain.ChangeAction
import io.github.dejitarunoseireinoapuri.kioku.domain.EditableSource
import io.github.dejitarunoseireinoapuri.kioku.domain.MemoryChange
import io.github.dejitarunoseireinoapuri.kioku.domain.MemoryChangeCommand
import io.github.dejitarunoseireinoapuri.kioku.domain.MemoryControlRepository
import io.github.dejitarunoseireinoapuri.kioku.domain.MemoryItem
import io.github.dejitarunoseireinoapuri.kioku.domain.MemorySource

internal class QueryManagementFixture : MemoryControlRepository {
    var reads = 0
    var read: suspend (String) -> EditableSource? = { source(it) }
    var revisionRead: suspend () -> Long? = { 0L }

    fun source(id: String = "fixture-query-source") =
        EditableSource(
            MemorySource(
                id,
                "Quiero ver la película ficticia Loto.",
                "2026-11-13",
                receivedAt = "2026-11-13T12:00:00Z",
            ),
            "a".repeat(64),
            listOf(MemoryItem("$id-1", "Quiero ver la película ficticia Loto.")),
            0,
        )

    override suspend fun details(id: String): EditableSource? {
        reads++
        return read(id)
    }

    override suspend fun revision() = revisionRead()

    override fun prepare(
        source: EditableSource,
        ids: List<String>,
        action: ChangeAction,
        correction: String?,
    ) = MemoryChangeCommand("synthetic", source.source.id, source.version, ids, action, correction, "Europe/Madrid")

    override suspend fun execute(command: MemoryChangeCommand): MemoryChange = error("Read-only synthetic fixture")
}
