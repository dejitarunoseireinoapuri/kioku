package io.github.dejitarunoseireinoapuri.kioku.feature.source

import java.time.DateTimeException
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

internal actual fun formatSourceDate(
    receivedAt: String,
    timeZoneId: String?,
): String? =
    try {
        val zone = timeZoneId?.let(ZoneId::of) ?: ZoneId.systemDefault()
        DateTimeFormatter.ofPattern("dd/MM/yyyy", Locale.ROOT).withZone(zone).format(Instant.parse(receivedAt))
    } catch (_: DateTimeException) {
        null
    }
