package io.github.dejitarunoseireinoapuri.kioku

import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.ViewModelStore
import androidx.lifecycle.ViewModelStoreOwner
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import androidx.test.platform.app.InstrumentationRegistry
import io.github.dejitarunoseireinoapuri.kioku.data.DemoSourceRepository
import io.github.dejitarunoseireinoapuri.kioku.data.MemoryEndpoint
import io.github.dejitarunoseireinoapuri.kioku.data.NativeTextConversationRepository
import io.github.dejitarunoseireinoapuri.kioku.domain.QueryOutcome
import io.github.dejitarunoseireinoapuri.kioku.domain.ReadReferencedSource
import io.github.dejitarunoseireinoapuri.kioku.domain.TextOutcome
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.ConversationEvent
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.ConversationViewModel
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.MemoryIntent
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.MessageAction
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/** Native main-loop validation independent of Espresso input injection; transport is synthetic. */
class QueryRecoveryDeviceTest {
    @Test
    fun explicitRetryRecoversBothLostStagesWithoutRetypingOnTheNativeMainLoop() {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        for (stage in listOf(MemoryEndpoint.RouteMessage, MemoryEndpoint.Query)) {
            val store = ViewModelStore()
            val port = ReconnectFixture(stage)
            lateinit var model: ConversationViewModel
            try {
                instrumentation.runOnMainSync {
                    model = createModel(store, port)
                    model.onEvent(ConversationEvent.SelectIntent(MemoryIntent.Ask))
                    model.onEvent(ConversationEvent.EditDraft("¿Qué plan ficticio tengo?"))
                    model.onEvent(ConversationEvent.Submit)
                }
                instrumentation.waitForIdleSync()
                instrumentation.runOnMainSync {
                    assertTrue(model.state.value.canEdit)
                    assertEquals("", model.state.value.draft)
                    assertTrue(
                        model.state.value.conversation!!
                            .messages
                            .isNotEmpty(),
                    )
                    model.onEvent(ConversationEvent.Message(MessageAction.Retry))
                }
                instrumentation.waitForIdleSync()
                instrumentation.runOnMainSync {
                    val result =
                        model.state.value.conversation!!
                            .outcome as TextOutcome.Asked
                    assertTrue(result.answer is QueryOutcome.Reply)
                    assertEquals("No consta otro plan ficticio.", (result.answer as QueryOutcome.Reply).text)
                    assertTrue(model.state.value.canEdit)
                    assertEquals(if (stage == MemoryEndpoint.Query) 3 else 1, port.queries.size)
                }
            } finally {
                instrumentation.runOnMainSync { store.clear() }
            }
        }
    }

    private fun createModel(
        store: ViewModelStore,
        port: ReconnectFixture,
    ): ConversationViewModel {
        val owner =
            object : ViewModelStoreOwner {
                override val viewModelStore = store
            }
        val factory =
            viewModelFactory {
                initializer {
                    ConversationViewModel(
                        ReadReferencedSource(DemoSourceRepository()),
                        conversation = NativeTextConversationRepository(port),
                    )
                }
            }
        return ViewModelProvider(owner, factory)[ConversationViewModel::class.java]
    }
}
