package io.github.dejitarunoseireinoapuri.kioku

import androidx.lifecycle.ViewModelStore
import io.github.dejitarunoseireinoapuri.kioku.data.DemoSourceRepository
import io.github.dejitarunoseireinoapuri.kioku.domain.ChangeAction
import io.github.dejitarunoseireinoapuri.kioku.domain.ForgetPreview
import io.github.dejitarunoseireinoapuri.kioku.domain.ForgetScope
import io.github.dejitarunoseireinoapuri.kioku.domain.MemoryChange
import io.github.dejitarunoseireinoapuri.kioku.domain.ReadReferencedSource
import io.github.dejitarunoseireinoapuri.kioku.domain.TextOutcome
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.ConversationEvent
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.ConversationViewModel
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.MessageAction
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.TextMessage
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertIs
import kotlin.test.assertNull
import kotlin.test.assertTrue

@OptIn(ExperimentalCoroutinesApi::class)
class ForgetConversationTest {
    private val preview = ForgetPreview("Quiero ver Loto.", ForgetScope.AllOccurrences)

    @Test
    fun cancelDoesNotApplyAndAnOldConfirmationCannotBeReused() =
        conversationTest { repository, model ->
            request(repository, model)
            assertFalse(model.state.value.canEdit)
            model.onEvent(ConversationEvent.Submit)
            assertEquals(1, repository.commands.size)
            model.onEvent(ConversationEvent.Message(MessageAction.CancelForget))
            model.onEvent(ConversationEvent.Message(MessageAction.ConfirmForget))
            runCurrent()
            assertEquals(1, repository.commands.size)
            assertEquals(
                TextOutcome.ForgetCancelled,
                model.state.value.conversation
                    ?.outcome,
            )
            assertTrue(model.state.value.canEdit)
            assertNull(model.state.value.forgottenText)
        }

    @Test
    fun oneApprovalWaitsForTheServerAndItsReceiptNeverEntersTheNextContext() =
        conversationTest { repository, model ->
            request(repository, model)
            val pending = CompletableDeferred<TextOutcome>()
            repository.reply = { pending.await() }
            model.onEvent(ConversationEvent.Message(MessageAction.ConfirmForget))
            model.onEvent(ConversationEvent.Message(MessageAction.ConfirmForget))
            runCurrent()
            assertEquals(2, repository.commands.size)
            assertEquals(repository.commands[0].ids, repository.commands[1].ids)
            assertEquals(preview, repository.commands.last().forgetApproval)
            assertNull(model.state.value.forgottenText)
            pending.complete(TextOutcome.Changed(MemoryChange.Confirmed(ChangeAction.Forget, 1)))
            runCurrent()
            assertEquals(preview.text, model.state.value.forgottenText)
            val notice =
                assertIs<TextMessage.Notice>(
                    model.state.value.conversation!!
                        .messages
                        .single(),
                )
            assertEquals(ChangeAction.Forget, notice.action)
            assertTrue(
                model.state.value.conversation!!
                    .messages
                    .filterIsInstance<TextMessage.Owner>()
                    .isEmpty(),
            )
            repository.reply = { TextOutcome.ForgetCancelled }
            model.onEvent(ConversationEvent.EditDraft("¿Qué examen tengo?"))
            assertNull(model.state.value.forgottenText)
            model.onEvent(ConversationEvent.Submit)
            runCurrent()
            assertTrue(
                repository.commands
                    .last()
                    .context.questions
                    .isEmpty(),
            )
            assertNull(repository.commands.last().forgetApproval)
        }

    @Test
    fun aMemoryInvalidationDiscardsPendingApproval() =
        conversationTest { repository, model ->
            request(repository, model)
            model.memoryChanged()
            model.onEvent(ConversationEvent.Message(MessageAction.ConfirmForget))
            runCurrent()
            assertEquals(1, repository.commands.size)
            assertNull(
                model.state.value.conversation
                    ?.outcome,
            )
        }

    private suspend fun TestScope.request(
        repository: TextConversationFixture,
        model: ConversationViewModel,
    ) {
        repository.reply = { TextOutcome.ConfirmForget(preview) }
        model.onEvent(ConversationEvent.EditDraft("Olvida esa película."))
        model.onEvent(ConversationEvent.Submit)
        runCurrent()
    }

    private fun conversationTest(block: suspend TestScope.(TextConversationFixture, ConversationViewModel) -> Unit) =
        runTest {
            Dispatchers.setMain(StandardTestDispatcher(testScheduler))
            val store = ViewModelStore()
            val repository = TextConversationFixture()
            val model = ConversationViewModel(ReadReferencedSource(DemoSourceRepository()), conversation = repository)
            store.put("conversation", model)
            try {
                block(repository, model)
            } finally {
                store.clear()
                Dispatchers.resetMain()
            }
        }
}
