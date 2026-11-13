package io.github.dejitarunoseireinoapuri.kioku

import io.github.dejitarunoseireinoapuri.kioku.feature.source.formatSourceDate
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull

class SourceDateTest {
    @Test
    fun receiptDateUsesTheZoneAtThatInstantIncludingMidnightAndSummerTime() {
        assertEquals("14/11/2026", formatSourceDate("2026-11-13T23:30:00.000Z", "Europe/Madrid"))
        assertEquals("13/11/2026", formatSourceDate("2026-11-13T23:30:00.000Z", "America/New_York"))
        assertEquals("14/07/2026", formatSourceDate("2026-07-13T22:30:00Z", "Europe/Madrid"))
    }

    @Test
    fun invalidReceiptOrZoneDoesNotInventADate() {
        assertNull(formatSourceDate("not-a-date", "UTC"))
        assertNull(formatSourceDate("2026-11-13T12:00:00Z", "Unknown/Zone"))
    }
}
