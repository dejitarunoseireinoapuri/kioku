package io.github.dejitarunoseireinoapuri.kioku

import androidx.lifecycle.ViewModelStore
import io.github.dejitarunoseireinoapuri.kioku.data.DemoSourceRepository
import io.github.dejitarunoseireinoapuri.kioku.domain.AnswerStatus
import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureIssue
import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureOutcome
import io.github.dejitarunoseireinoapuri.kioku.domain.MemorySource
import io.github.dejitarunoseireinoapuri.kioku.domain.QueryOutcome
import io.github.dejitarunoseireinoapuri.kioku.domain.ReadReferencedSource
import io.github.dejitarunoseireinoapuri.kioku.domain.TextOutcome
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.ConversationEvent
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.ConversationViewModel
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.MemoryIntent
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.MessageAction
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.TextMessage
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.NonCancellable
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import kotlinx.coroutines.withContext
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertIs
import kotlin.test.assertTrue

@OptIn(ExperimentalCoroutinesApi::class)
class CaptureRecoverySessionTest {
    @Test
    fun failedCaptureAllowsInputAndExplicitRetryKeepsTheOriginalOperation() =
        sessionTest { repo, model ->
            repo.reply = { TextOutcome.Captured(CaptureOutcome.Failed(CaptureIssue.Unavailable)) }
            send(model, "Un plan ficticio.")
            runCurrent()
            assertTrue(model.state.value.canEdit)
            repo.reply = { TextOutcome.Captured(saved()) }
            model.onEvent(ConversationEvent.Message(MessageAction.Retry))
            runCurrent()
            assertEquals(repo.commands[0].ids, repo.commands[1].ids)
            assertIs<CaptureOutcome.Saved>(
                (
                    model.state.value.conversation
                        ?.outcome as TextOutcome.Captured
                ).capture,
            )
        }

    @Test
    fun aPendingCaptureSurvivesModeChangeAndCanBeCheckedAfterAnotherQuestion() =
        sessionTest { repo, model ->
            repo.reply = { TextOutcome.Captured(CaptureOutcome.Processing) }
            send(model, "Un plan ficticio.")
            runCurrent()
            val pending =
                model.state.value.conversation!!
                    .messages
                    .filterIsInstance<TextMessage.Result>()
                    .single()
            assertTrue(model.state.value.canSwitchIntent)
            model.onEvent(ConversationEvent.SelectIntent(MemoryIntent.Ask))
            repo.reply = { TextOutcome.Asked(QueryOutcome.Reply(AnswerStatus.NotFound, "No consta.", emptyList())) }
            send(model, "¿Qué otra cosa?")
            runCurrent()
            model.onEvent(ConversationEvent.SelectIntent(MemoryIntent.Tell))
            repo.recovery = { saved() }
            model.onEvent(ConversationEvent.CheckCapture(pending.id))
            runCurrent()
            assertEquals(2, repo.commands.size)
            assertEquals(repo.commands.first().ids, repo.recoveries.single().ids)
            assertEquals(
                2,
                model.state.value.conversation!!
                    .messages.size,
            )
            val outcome =
                model.state.value.conversation!!
                    .messages
                    .filterIsInstance<TextMessage.Result>()
                    .first()
                    .outcome
            assertIs<CaptureOutcome.Saved>(assertIs<TextOutcome.Captured>(outcome).capture)
            assertTrue(model.state.value.canEdit)
        }

    @Test
    fun unknownIsNotProcessingAndAnOldCheckCannotRestoreForgottenContent() =
        sessionTest { repo, model ->
            repo.reply = { TextOutcome.Captured(CaptureOutcome.Unconfirmed) }
            send(model, "Un plan ficticio.")
            runCurrent()
            val pending =
                model.state.value.conversation!!
                    .messages
                    .filterIsInstance<TextMessage.Result>()
                    .single()
            assertTrue(model.state.value.canEdit)
            val result = CompletableDeferred<CaptureOutcome>()
            repo.recovery = { withContext(NonCancellable) { result.await() } }
            model.onEvent(ConversationEvent.CheckCapture(pending.id))
            model.onEvent(ConversationEvent.CheckCapture(pending.id))
            runCurrent()
            assertEquals(1, repo.recoveries.size)
            model.memoryChanged()
            result.complete(saved())
            runCurrent()
            assertTrue(
                model.state.value.conversation!!
                    .messages
                    .isEmpty(),
            )
            assertTrue(model.state.value.canEdit)
        }

    @Test
    fun aRecoveredClarificationContinuesTheOriginalCaptureAfterAnotherQuestion() =
        sessionTest { repo, model ->
            repo.reply = { TextOutcome.Captured(CaptureOutcome.Processing) }
            send(model, "Un plan ficticio.")
            runCurrent()
            val pending =
                model.state.value.conversation!!
                    .messages
                    .filterIsInstance<TextMessage.Result>()
                    .single()
            repo.reply = { TextOutcome.Asked(QueryOutcome.Reply(AnswerStatus.NotFound, "No consta.", emptyList())) }
            send(model, "¿Otra cosa?")
            runCurrent()
            repo.recovery = { CaptureOutcome.Clarification("capture-parent", 1, "¿Qué color?") }
            model.onEvent(ConversationEvent.CheckCapture(pending.id))
            runCurrent()
            assertEquals(
                pending.id,
                model.state.value.conversation!!
                    .messages
                    .last()
                    .id,
            )
            repo.reply = { TextOutcome.Captured(saved()) }
            send(model, "De color verde.")
            runCurrent()
            assertEquals(
                "capture-parent",
                repo.commands
                    .last()
                    .capture
                    ?.clarificationId,
            )
            assertEquals(1, repo.recoveries.size)
        }

    private fun send(
        model: ConversationViewModel,
        text: String,
    ) {
        model.onEvent(ConversationEvent.EditDraft(text))
        model.onEvent(ConversationEvent.Submit)
    }

    private fun saved() = CaptureOutcome.Saved(MemorySource("synthetic-source", "Prueba.", "2026-11-14"), 1)

    private fun sessionTest(block: suspend TestScope.(TextConversationFixture, ConversationViewModel) -> Unit) =
        runTest {
            Dispatchers.setMain(StandardTestDispatcher(testScheduler))
            val store = ViewModelStore()
            val repo = TextConversationFixture()
            val model = ConversationViewModel(ReadReferencedSource(DemoSourceRepository()), conversation = repo)
            store.put("conversation", model)
            try {
                block(repo, model)
            } finally {
                store.clear()
                Dispatchers.resetMain()
            }
        }
}
