package io.github.dejitarunoseireinoapuri.kioku.feature.conversation

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlin.time.Clock

/** RAM-only presentation expires even when the OS suspends timers; rollback clears conservatively. */
internal class FeedSessionLifetime(
    private val scope: CoroutineScope,
    private val onExpired: () -> Unit,
    private val now: () -> Long = { Clock.System.now().toEpochMilliseconds() },
) {
    private var backgroundAt: Long? = null
    private var job: Job? = null

    fun background() {
        if (backgroundAt != null) return
        backgroundAt = now()
        job =
            scope.launch {
                delay(FEED_BACKGROUND_LIMIT_MS)
                backgroundAt = null
                onExpired()
            }
    }

    fun foreground() {
        val previous = backgroundAt
        close()
        if (previous != null && (now() < previous || now() - previous >= FEED_BACKGROUND_LIMIT_MS)) onExpired()
    }

    fun close() {
        job?.cancel()
        job = null
        backgroundAt = null
    }
}

internal const val FEED_BACKGROUND_LIMIT_MS = 30 * 60 * 1000L
