package io.github.dejitarunoseireinoapuri.kioku

import io.github.dejitarunoseireinoapuri.kioku.data.DemoSourceRepository
import io.github.dejitarunoseireinoapuri.kioku.domain.ReadReferencedSource
import io.github.dejitarunoseireinoapuri.kioku.domain.SourceResult
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertIs
import kotlin.test.assertNull

class SourceReferenceTest {
    private val readSource = ReadReferencedSource(DemoSourceRepository())

    @Test
    fun unrelatedSourceCannotBeOpenedEvenIfItExists() {
        assertEquals(SourceResult.Unavailable, readSource("movie-corrected", setOf("movie-original")))
    }

    @Test
    fun missingReferencedSourceIsUnavailable() {
        assertEquals(SourceResult.Unavailable, readSource("missing", setOf("missing")))
    }

    @Test
    fun originalAndCorrectionAreSeparateExampleBranches() {
        val original = assertIs<SourceResult.Found>(readSource("movie-original", setOf("movie-original"))).source
        val corrected = assertIs<SourceResult.Found>(readSource("movie-corrected", setOf("movie-corrected"))).source
        assertNull(original.correction)
        assertEquals(original.originalText, corrected.originalText)
        assertEquals("Querías ver Aftersun cuando Gemma se fuera de viaje.", corrected.correction?.currentSummary)
    }
}
