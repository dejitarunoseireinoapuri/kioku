package io.github.dejitarunoseireinoapuri.kioku

import io.github.dejitarunoseireinoapuri.kioku.domain.ChangeAction
import io.github.dejitarunoseireinoapuri.kioku.domain.EditableSource
import io.github.dejitarunoseireinoapuri.kioku.domain.MemoryChange
import io.github.dejitarunoseireinoapuri.kioku.domain.MemoryChangeCommand
import io.github.dejitarunoseireinoapuri.kioku.domain.MemoryControlRepository
import io.github.dejitarunoseireinoapuri.kioku.domain.MemoryItem
import io.github.dejitarunoseireinoapuri.kioku.domain.MemorySource
import io.github.dejitarunoseireinoapuri.kioku.domain.SourceReplacement

internal class ManagementFlowFixture : MemoryControlRepository {
    val original =
        EditableSource(
            MemorySource("saved-source", "Película Loto. Examen el martes.", "2026-11-15"),
            "a".repeat(64),
            listOf(MemoryItem("saved-source-1", "Película Loto."), MemoryItem("saved-source-2", "Examen el martes.")),
            0,
        )
    val commands = mutableListOf<MemoryChangeCommand>()
    private val sources = mutableMapOf(original.source.id to original)
    private var epoch = 0L

    override suspend fun details(id: String) = sources[id]?.copy(memoryRevision = epoch)

    override suspend fun revision() = epoch

    override fun prepare(
        source: EditableSource,
        ids: List<String>,
        action: ChangeAction,
        correction: String?,
    ) = MemoryChangeCommand(
        "command-${commands.size}",
        source.source.id,
        source.version,
        ids,
        action,
        correction,
        "Europe/Madrid",
    )

    override suspend fun execute(command: MemoryChangeCommand): MemoryChange {
        commands.add(command)
        val old = sources.remove(command.sourceId) ?: error("Unknown synthetic source")
        val kept = old.items.filter { it.id !in command.memoryIds }.map { it.text }
        val groups =
            listOfNotNull(
                kept.takeIf { it.isNotEmpty() },
                command.correction?.let { listOf(it) }.takeIf { command.action == ChangeAction.Correct },
            )
        epoch++
        val ids = groups.indices.map { "updated-$epoch-$it" }
        ids.forEachIndexed { group, id ->
            val texts = groups[group]
            sources[id] =
                old.copy(
                    source = old.source.copy(id = id, originalText = texts.joinToString(" ")),
                    version = "b".repeat(64),
                    items =
                        texts.mapIndexed {
                            index,
                            text,
                            ->
                            MemoryItem("$id-${index + 1}", text)
                        },
                    memoryRevision = epoch,
                )
        }
        return MemoryChange.Confirmed(
            command.action,
            epoch,
            ids,
            command.sourceId,
            listOf(SourceReplacement(command.sourceId, ids)),
        )
    }
}
