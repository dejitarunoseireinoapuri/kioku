package io.github.dejitarunoseireinoapuri.kioku

import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.FEED_BACKGROUND_LIMIT_MS
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.FeedSessionLifetime
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import kotlin.test.Test
import kotlin.test.assertEquals

@OptIn(ExperimentalCoroutinesApi::class)
class FeedSessionLifetimeTest {
    @Test
    fun returningBeforeThirtyMinutesKeepsTheFeedAndCancelsTheOldDeadline() =
        runTest {
            var expired = 0
            val lifetime = FeedSessionLifetime(this, { expired++ }, { testScheduler.currentTime })
            lifetime.background()
            runCurrent()
            advanceTimeBy(FEED_BACKGROUND_LIMIT_MS - 1)
            lifetime.foreground()
            advanceTimeBy(FEED_BACKGROUND_LIMIT_MS)
            assertEquals(0, expired)
            lifetime.close()
        }

    @Test
    fun thirtyMinutesExpiresOnceEvenWithoutReturningToTheApp() =
        runTest {
            var expired = 0
            val lifetime = FeedSessionLifetime(this, { expired++ }, { testScheduler.currentTime })
            lifetime.background()
            runCurrent()
            advanceTimeBy(FEED_BACKGROUND_LIMIT_MS)
            runCurrent()
            assertEquals(1, expired)
            lifetime.foreground()
            assertEquals(1, expired)
        }

    @Test
    fun returningAfterASuspendedTimerExpiresBeforeShowingTheFeed() =
        runTest {
            var clock = 0L
            var expired = 0
            val lifetime = FeedSessionLifetime(this, { expired++ }, { clock })
            lifetime.background()
            clock = FEED_BACKGROUND_LIMIT_MS
            lifetime.foreground()
            assertEquals(1, expired)
            advanceTimeBy(FEED_BACKGROUND_LIMIT_MS)
            assertEquals(1, expired)
        }

    @Test
    fun closingDiscardsItsTimerAndClockRollbackExpiresConservatively() =
        runTest {
            var clock = FEED_BACKGROUND_LIMIT_MS
            var expired = 0
            val lifetime = FeedSessionLifetime(this, { expired++ }, { clock })
            lifetime.background()
            clock = 0
            lifetime.foreground()
            assertEquals(1, expired)
            lifetime.background()
            lifetime.close()
            advanceTimeBy(FEED_BACKGROUND_LIMIT_MS)
            assertEquals(1, expired)
        }
}
