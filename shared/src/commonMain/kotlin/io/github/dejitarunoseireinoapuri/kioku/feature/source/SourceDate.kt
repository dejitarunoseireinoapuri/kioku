package io.github.dejitarunoseireinoapuri.kioku.feature.source

/** Formats the server receipt in the device's current time zone; never substitutes an event date. */
internal expect fun formatSourceDate(
    receivedAt: String,
    timeZoneId: String? = null,
): String?
