package io.github.dejitarunoseireinoapuri.kioku

import io.github.dejitarunoseireinoapuri.kioku.domain.ChangeAction
import io.github.dejitarunoseireinoapuri.kioku.domain.EditableSource
import io.github.dejitarunoseireinoapuri.kioku.domain.MemoryChange
import io.github.dejitarunoseireinoapuri.kioku.domain.MemoryChangeCommand
import io.github.dejitarunoseireinoapuri.kioku.domain.MemoryControlRepository
import io.github.dejitarunoseireinoapuri.kioku.domain.MemoryItem
import io.github.dejitarunoseireinoapuri.kioku.domain.MemorySource

internal const val CONTROL_SOURCE = "85091620-5b43-4a73-afb2-fb486322b07a"

internal class ControlFixture : MemoryControlRepository {
    val source =
        EditableSource(
            MemorySource(CONTROL_SOURCE, "Película Loto. Examen el martes.", "2026-11-14"),
            "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            listOf(
                MemoryItem("$CONTROL_SOURCE-1", "Película Loto."),
                MemoryItem("$CONTROL_SOURCE-2", "Examen el martes."),
            ),
            0,
        )
    val commands = mutableListOf<MemoryChangeCommand>()
    var read: suspend () -> EditableSource? = { source }
    var readSource: suspend (String) -> EditableSource? = { read() }
    var revisionRead: suspend () -> Long? = { 0 }
    var change: suspend () -> MemoryChange = { MemoryChange.Confirmed(ChangeAction.Correct, 1) }
    private var ids = 0

    override suspend fun details(id: String) = readSource(id)

    override suspend fun revision() = revisionRead()

    override fun prepare(
        source: EditableSource,
        ids: List<String>,
        action: ChangeAction,
        correction: String?,
    ) = MemoryChangeCommand(
        "change-${this.ids++}",
        source.source.id,
        source.version,
        ids,
        action,
        correction,
        "Europe/Madrid",
    )

    override suspend fun execute(command: MemoryChangeCommand): MemoryChange {
        commands.add(command)
        return change()
    }
}
