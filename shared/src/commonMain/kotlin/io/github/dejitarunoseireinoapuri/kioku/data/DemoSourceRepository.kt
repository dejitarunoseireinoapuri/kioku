package io.github.dejitarunoseireinoapuri.kioku.data

import io.github.dejitarunoseireinoapuri.kioku.domain.MemorySource
import io.github.dejitarunoseireinoapuri.kioku.domain.SourceCorrection
import io.github.dejitarunoseireinoapuri.kioku.domain.SourceRepository

/** Immutable synthetic fixtures for K0. No file, network, credentials or canonical writes. */
class DemoSourceRepository : SourceRepository {
    private val sources =
        listOf(
            MemorySource(
                id = "movie-original",
                originalText = "Cuando Gemma se vaya de viaje, me apetece ver Perfect Days.",
                recordedOn = "10 nov 2026",
            ),
            MemorySource(
                id = "movie-corrected",
                originalText = "Cuando Gemma se vaya de viaje, me apetece ver Perfect Days.",
                recordedOn = "10 nov 2026",
                correction =
                    SourceCorrection(
                        instruction = "Corrige ese recuerdo: quería ver Aftersun, no Perfect Days.",
                        currentSummary = "Querías ver Aftersun cuando Gemma se fuera de viaje.",
                    ),
            ),
        ).associateBy(MemorySource::id)

    override fun find(id: String): MemorySource? = sources[id]
}
