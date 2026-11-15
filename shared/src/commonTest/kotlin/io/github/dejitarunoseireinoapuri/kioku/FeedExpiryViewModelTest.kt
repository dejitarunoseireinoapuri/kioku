package io.github.dejitarunoseireinoapuri.kioku

import androidx.lifecycle.ViewModelStore
import io.github.dejitarunoseireinoapuri.kioku.data.DemoSourceRepository
import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureOutcome
import io.github.dejitarunoseireinoapuri.kioku.domain.MemorySource
import io.github.dejitarunoseireinoapuri.kioku.domain.ReadReferencedSource
import io.github.dejitarunoseireinoapuri.kioku.domain.TextOutcome
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.ConversationEvent
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.ConversationViewModel
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.FEED_BACKGROUND_LIMIT_MS
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.MemoryIntent
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import kotlin.test.Test
import kotlin.test.assertTrue

@OptIn(ExperimentalCoroutinesApi::class)
class FeedExpiryViewModelTest {
    @Test
    fun expiryClearsBothModeFeedsBeforeTheyCanBeRestored() =
        scenario { model, setClock ->
            populate(model)
            model.checkMemory(visible = false)
            setClock(FEED_BACKGROUND_LIMIT_MS)
            model.checkMemory()
            runCurrent()
            assertTrue(
                model.state.value.conversation!!
                    .messages
                    .isEmpty(),
            )
            model.onEvent(ConversationEvent.SelectIntent(MemoryIntent.Tell))
            assertTrue(
                model.state.value.conversation!!
                    .messages
                    .isEmpty(),
            )
        }

    @Test
    fun aShortBackgroundKeepsBothModeFeedsAfterReauthorization() =
        scenario { model, setClock ->
            populate(model)
            model.checkMemory(visible = false)
            setClock(FEED_BACKGROUND_LIMIT_MS - 1)
            model.checkMemory()
            runCurrent()
            assertTrue(
                model.state.value.conversation!!
                    .messages
                    .isNotEmpty(),
            )
            model.onEvent(ConversationEvent.SelectIntent(MemoryIntent.Tell))
            assertTrue(
                model.state.value.conversation!!
                    .messages
                    .isNotEmpty(),
            )
        }

    private fun TestScope.populate(model: ConversationViewModel) {
        model.onEvent(ConversationEvent.EditDraft("Dato ficticio del modo Explicar."))
        model.onEvent(ConversationEvent.Submit)
        runCurrent()
        model.onEvent(ConversationEvent.SelectIntent(MemoryIntent.Ask))
        model.onEvent(ConversationEvent.EditDraft("Dato ficticio del modo Preguntar."))
        model.onEvent(ConversationEvent.Submit)
        runCurrent()
    }

    private fun scenario(block: suspend TestScope.(ConversationViewModel, (Long) -> Unit) -> Unit) =
        runTest {
            Dispatchers.setMain(StandardTestDispatcher(testScheduler))
            var clock = 0L
            val repository =
                TextConversationFixture().apply {
                    reply =
                        {
                            TextOutcome.Captured(
                                CaptureOutcome.Saved(MemorySource("fixture", "Dato ficticio.", "2026-11-15"), 1),
                            )
                        }
                }
            val model =
                ConversationViewModel(
                    ReadReferencedSource(DemoSourceRepository()),
                    controls = ControlFixture(),
                    conversation = repository,
                    sessionNow = { clock },
                )
            val store = ViewModelStore()
            store.put("expiry", model)
            try {
                model.checkMemory()
                runCurrent()
                block(model) { clock = it }
            } finally {
                store.clear()
                Dispatchers.resetMain()
            }
        }
}
