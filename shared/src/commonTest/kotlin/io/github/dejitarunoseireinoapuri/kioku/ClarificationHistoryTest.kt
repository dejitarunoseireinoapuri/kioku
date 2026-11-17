package io.github.dejitarunoseireinoapuri.kioku

import androidx.lifecycle.ViewModelStore
import io.github.dejitarunoseireinoapuri.kioku.data.DemoSourceRepository
import io.github.dejitarunoseireinoapuri.kioku.domain.AnswerStatus
import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureIssue
import io.github.dejitarunoseireinoapuri.kioku.domain.ChangeAction
import io.github.dejitarunoseireinoapuri.kioku.domain.MemoryChange
import io.github.dejitarunoseireinoapuri.kioku.domain.QueryOutcome
import io.github.dejitarunoseireinoapuri.kioku.domain.QueryReference
import io.github.dejitarunoseireinoapuri.kioku.domain.ReadReferencedSource
import io.github.dejitarunoseireinoapuri.kioku.domain.TextOutcome
import io.github.dejitarunoseireinoapuri.kioku.domain.TextPlan
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.ConversationEvent
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.ConversationViewModel
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.MemoryIntent
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.MessageAction
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.canManage
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
import kotlin.test.assertTrue

@OptIn(ExperimentalCoroutinesApi::class)
class ClarificationHistoryTest {
    @Test
    fun clarificationAfterForgetKeepsReadOnlyHistoryButNeverReusesRevokedEvidence() =
        sessionTest { repo, model ->
            repo.reply = { answerBeforeForget() }
            send(model, "¿Qué quiero hacer?")
            runCurrent()
            model.memoryChanged(MemoryChange.Confirmed(ChangeAction.Forget, 1, previousSourceId = "source-old"))
            val history =
                model.state.value.conversation!!
                    .messages
            repo.reply = { TextOutcome.Clarification("¿Sobre qué quieres preguntar ahora?") }
            send(model, "¿Y ahora?")
            runCurrent()
            assertTrue(model.state.value.canEdit)
            assertTrue(
                repo.commands
                    .last()
                    .context.questions
                    .isEmpty(),
            )
            assertTrue(
                repo.commands
                    .last()
                    .context.sourceIds
                    .isEmpty(),
            )
            assertEquals(
                1L,
                repo.commands
                    .last()
                    .context.revision,
            )
            repo.reply =
                { TextOutcome.Asked(QueryOutcome.Reply(AnswerStatus.NotFound, "No consta otro plan.", emptyList())) }
            send(model, "Qué planes tengo pendientes.")
            runCurrent()
            assertEquals("¿Y ahora?\nAclaración: Qué planes tengo pendientes.", repo.commands.last().text)
            assertEquals(
                history,
                model.state.value.conversation!!
                    .messages
                    .take(history.size),
            )
            assertFalse(model.state.value.canManage(listOf("source-old")))
            assertTrue(
                repo.commands
                    .last()
                    .context.questions
                    .isEmpty(),
            )
        }

    @Test
    fun reformulatingAfterALimitRetainsHistoryAndUsesANewEmptyContext() =
        sessionTest { repo, model ->
            repo.reply = { TextOutcome.Failed(CaptureIssue.MoreContext) }
            send(model, "Una pregunta ficticia demasiado compleja.")
            runCurrent()
            val history =
                model.state.value.conversation!!
                    .messages
            model.onEvent(ConversationEvent.Message(MessageAction.Reset))
            assertEquals(
                history,
                model.state.value.conversation!!
                    .messages,
            )
            repo.reply = { TextOutcome.Clarification("¿Qué dato necesitas?") }
            send(model, "Mi nueva pregunta.")
            runCurrent()
            assertEquals("Mi nueva pregunta.", repo.commands.last().text)
            assertTrue(
                repo.commands
                    .last()
                    .context.questions
                    .isEmpty(),
            )
            assertEquals(
                history,
                model.state.value.conversation!!
                    .messages
                    .take(history.size),
            )
            assertEquals(
                model.state.value.conversation!!
                    .messages.size,
                model.state.value.conversation!!
                    .messages
                    .map { it.id }
                    .distinct()
                    .size,
            )
        }

    private fun answerBeforeForget() =
        TextOutcome.Asked(
            QueryOutcome.Reply(
                AnswerStatus.Answered,
                "Visitar el planetario ficticio.",
                listOf(QueryReference("source-old", "2026-11-17")),
            ),
        )

    private fun send(
        model: ConversationViewModel,
        text: String,
    ) {
        model.onEvent(ConversationEvent.EditDraft(text))
        model.onEvent(ConversationEvent.Submit)
    }

    private fun sessionTest(block: suspend TestScope.(TextConversationFixture, ConversationViewModel) -> Unit) =
        runTest {
            Dispatchers.setMain(StandardTestDispatcher(testScheduler))
            val store = ViewModelStore()
            val repo = TextConversationFixture()
            repo.plan = { TextPlan.Ask(repo.stamp.copy(revision = it.context.revision)) }
            val model = ConversationViewModel(ReadReferencedSource(DemoSourceRepository()), conversation = repo)
            store.put("conversation", model)
            try {
                model.onEvent(ConversationEvent.SelectIntent(MemoryIntent.Ask))
                block(repo, model)
            } finally {
                store.clear()
                Dispatchers.resetMain()
            }
        }
}
