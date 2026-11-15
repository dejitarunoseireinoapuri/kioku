package io.github.dejitarunoseireinoapuri.kioku.data

import io.github.dejitarunoseireinoapuri.kioku.domain.MemoryChange

/** An operation may continue only the exact source selected by its immutable command. */
internal fun MemoryChange.Confirmed.forSource(sourceId: String): MemoryChange.Confirmed {
    if (replacements.isNotEmpty()) {
        val selected = replacements.singleOrNull { it.sourceId == sourceId }
        require(selected != null && selected.sourceIds == sourceIds)
    }
    return copy(previousSourceId = sourceId)
}
