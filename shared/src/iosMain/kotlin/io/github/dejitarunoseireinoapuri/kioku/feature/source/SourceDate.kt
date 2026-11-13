package io.github.dejitarunoseireinoapuri.kioku.feature.source

import platform.Foundation.NSDate
import platform.Foundation.NSDateFormatter
import platform.Foundation.NSLocale
import platform.Foundation.NSTimeZone
import kotlin.time.Instant

internal actual fun formatSourceDate(
    receivedAt: String,
    timeZoneId: String?,
): String? {
    val instant =
        try {
            Instant.parse(receivedAt)
        } catch (_: IllegalArgumentException) {
            null
        }
    val zone = if (timeZoneId == null) NSTimeZone.localTimeZone else NSTimeZone.timeZoneWithName(timeZoneId)
    return if (instant == null || zone == null) {
        null
    } else {
        val date = NSDate(timeIntervalSince1970 = instant.toEpochMilliseconds() / 1000.0)
        NSDateFormatter()
            .apply {
                locale = NSLocale(localeIdentifier = "es_ES")
                timeZone = zone
                dateFormat = "dd/MM/yyyy"
            }.stringFromDate(date)
    }
}
