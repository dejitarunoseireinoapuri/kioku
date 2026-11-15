package io.github.dejitarunoseireinoapuri.kioku

import androidx.lifecycle.ViewModelStore
import io.github.dejitarunoseireinoapuri.kioku.data.DemoSourceRepository
import io.github.dejitarunoseireinoapuri.kioku.domain.AnswerStatus
import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureOutcome
import io.github.dejitarunoseireinoapuri.kioku.domain.ChangeAction
import io.github.dejitarunoseireinoapuri.kioku.domain.MemoryChange
import io.github.dejitarunoseireinoapuri.kioku.domain.MemorySource
import io.github.dejitarunoseireinoapuri.kioku.domain.OfferDecision
import io.github.dejitarunoseireinoapuri.kioku.domain.QueryOutcome
import io.github.dejitarunoseireinoapuri.kioku.domain.QueryReference
import io.github.dejitarunoseireinoapuri.kioku.domain.ReadReferencedSource
import io.github.dejitarunoseireinoapuri.kioku.domain.TextOutcome
import io.github.dejitarunoseireinoapuri.kioku.domain.TextPlan
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.ConversationEvent
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.ConversationViewModel
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.MemoryIntent
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.MessageAction
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.PreviewFeedback
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
import kotlin.test.assertFalse
import kotlin.test.assertIs
import kotlin.test.assertNull
import kotlin.test.assertTrue

@OptIn(ExperimentalCoroutinesApi::class)
class TextConversationViewModelTest {
    @Test
    fun aTypedAffirmativeAcceptsOnlyTheCurrentOffer() =
        conversationTest { repository, model, _ ->
            send(model, "Me gusta el miso.")
            runCurrent()
            repository.reply = { TextOutcome.Captured(saved()) }
            send(model, "Sí, recuérdalo!")
            runCurrent()
            assertEquals(OfferDecision.Accept, repository.commands.last().decision)
            assertEquals(repository.commands.first().ids, repository.commands.last().ids)
            assertEquals("Me gusta el miso.", repository.commands.last().text)
        }

    @Test
    fun aNewServerEpochClearsEarlierMessagesBeforeTheChildFinishes() =
        conversationTest { repository, model, _ ->
            repository.plan = { TextPlan.Ask(repository.stamp) }
            repository.reply = { TextOutcome.Asked(answer()) }
            send(model, "¿Qué película?")
            runCurrent()
            val pending = CompletableDeferred<TextOutcome>()
            repository.plan = { TextPlan.Ask(repository.stamp.copy(revision = 1)) }
            repository.reply = { pending.await() }
            send(model, "¿Y hoy?")
            runCurrent()
            val messages =
                model.state.value.conversation!!
                    .messages
            assertEquals(1, messages.size)
            assertEquals("¿Y hoy?", assertIs<TextMessage.Owner>(messages.single()).text)
            pending.complete(TextOutcome.Asked(answer()))
            runCurrent()
            repository.reply = { TextOutcome.Asked(answer()) }
            send(model, "¿Y mañana?")
            runCurrent()
            assertEquals(
                1,
                repository.commands
                    .last()
                    .context.revision,
            )
            assertEquals(
                listOf("¿Y hoy?"),
                repository.commands
                    .last()
                    .context.questions,
            )
        }

    @Test
    fun proposalWaitsForExplicitAcceptanceAndKeepsAskMode() =
        conversationTest { repository, model, _ ->
            send(model, "Me gusta el miso.")
            assertEquals("", model.state.value.draft)
            runCurrent()
            assertIs<TextOutcome.Offered>(
                model.state.value.conversation
                    ?.outcome,
            )
            assertEquals(1, repository.commands.size)
            assertNull(repository.commands.single().decision)
            repository.reply = { TextOutcome.Captured(saved()) }
            model.onEvent(ConversationEvent.Message(MessageAction.Accept))
            runCurrent()
            assertEquals(MemoryIntent.Ask, model.state.value.intent)
            assertEquals(OfferDecision.Accept, repository.commands.last().decision)
            assertEquals(repository.commands.first().ids, repository.commands.last().ids)
            assertIs<TextOutcome.Captured>(
                model.state.value.conversation
                    ?.outcome,
            )
        }

    @Test
    fun typedNoRejectsTheCurrentOfferAndCannotLaterBeAccepted() =
        conversationTest { repository, model, _ ->
            send(model, "No me gusta el apio.")
            runCurrent()
            repository.reply = { TextOutcome.Declined }
            send(model, "no")
            runCurrent()
            assertEquals("", model.state.value.draft)
            assertEquals(OfferDecision.Reject, repository.commands.last().decision)
            assertEquals("No me gusta el apio.", repository.commands.last().text)
            model.onEvent(ConversationEvent.Message(MessageAction.Accept))
            runCurrent()
            assertEquals(2, repository.commands.size)
            assertEquals(
                TextOutcome.Declined,
                model.state.value.conversation
                    ?.outcome,
            )
        }

    @Test
    fun uncertainAcceptanceLocksNewInputAndRecoveryUsesTheSameDecisionAndIds() =
        conversationTest { repository, model, _ ->
            send(model, "Me gusta el té.")
            runCurrent()
            repository.reply = { TextOutcome.Processing }
            model.onEvent(ConversationEvent.Message(MessageAction.Accept))
            runCurrent()
            assertFalse(model.state.value.canEdit)
            repository.reply = { TextOutcome.Captured(saved()) }
            model.onEvent(ConversationEvent.Message(MessageAction.Retry))
            runCurrent()
            assertEquals(repository.commands[1], repository.commands[2])
            assertTrue(model.state.value.canEdit)
        }

    @Test
    fun confirmedMutationClearsEveryEarlierMessageDraftAndSource() =
        conversationTest { repository, model, _ ->
            repository.plan = { TextPlan.Ask(repository.stamp) }
            repository.reply = { TextOutcome.Asked(answer()) }
            send(model, "¿Qué película?")
            runCurrent()
            repository.reply = { TextOutcome.Changed(MemoryChange.Confirmed(ChangeAction.Correct, 1)) }
            send(model, "Corrige ese dato.")
            runCurrent()
            val notice =
                assertIs<TextMessage.Notice>(
                    model.state.value.conversation!!
                        .messages
                        .single(),
                )
            assertEquals(ChangeAction.Correct, notice.action)
            assertNull(model.state.value.source)
            assertEquals("", model.state.value.draft)
            assertNull(model.state.value.feedback)
        }

    @Test
    fun lateNonCooperativeResultsCannotRestoreContentAfterResetOrSessionDisposal() =
        conversationTest { repository, model, store ->
            val pending = CompletableDeferred<TextOutcome>()
            repository.reply = { withContext(NonCancellable) { pending.await() } }
            send(model, "Dato ficticio privado.")
            runCurrent()
            store.clear()
            pending.complete(TextOutcome.Captured(saved()))
            runCurrent()
            assertEquals("", model.state.value.draft)
            assertTrue(
                model.state.value.conversation
                    ?.messages
                    .orEmpty()
                    .isEmpty(),
            )
            assertNull(model.state.value.source)
        }

    @Test
    fun followUpsUseOnlyFourQuestionsAndNeverGeneratedAnswerText() =
        conversationTest { repository, model, _ ->
            repository.plan = { TextPlan.Ask(repository.stamp) }
            repository.reply = { TextOutcome.Asked(answer()) }
            repeat(25) { index ->
                send(model, "¿Pregunta $index?")
                runCurrent()
            }
            val context = repository.commands.last().context
            assertEquals(listOf("¿Pregunta 20?", "¿Pregunta 21?", "¿Pregunta 22?", "¿Pregunta 23?"), context.questions)
            assertFalse(context.questions.any { it.contains("respuesta sintética") })
            assertTrue(
                model.state.value.conversation!!
                    .messages.size <= 40,
            )
            assertIs<TextMessage.Owner>(
                model.state.value.conversation!!
                    .messages
                    .first(),
            )
        }

    @Test
    fun routingClarificationAndAcceptedCaptureClarificationKeepTheirOwnOperations() =
        conversationTest { repository, model, _ ->
            repository.reply = { TextOutcome.Clarification("¿Qué Pablo?") }
            send(model, "Olvida lo del examen de Pablo.")
            runCurrent()
            repository.reply =
                { TextOutcome.Captured(CaptureOutcome.Clarification("accepted-parent", 1, "¿Qué examen?")) }
            send(model, "Mi primo.")
            runCurrent()
            assertTrue(
                repository.commands
                    .last()
                    .text
                    .contains("Aclaración: Mi primo."),
            )
            repository.reply = { TextOutcome.Captured(saved()) }
            send(model, "El de japonés.")
            runCurrent()
            assertEquals(
                "accepted-parent",
                repository.commands
                    .last()
                    .capture
                    ?.clarificationId,
            )
            assertEquals(
                1,
                repository.commands
                    .last()
                    .capture
                    ?.revision,
            )
            assertEquals(MemoryIntent.Ask, model.state.value.intent)
        }

    @Test
    fun oldOrForeignSourceReferencesCannotLoadAfterAMemoryChange() =
        conversationTest { repository, model, _ ->
            val pending = CompletableDeferred<MemorySource?>()
            repository.reply = { TextOutcome.Asked(answer()) }
            repository.readSource = { withContext(NonCancellable) { pending.await() } }
            send(model, "¿Qué película?")
            runCurrent()
            assertFalse(model.openSource("foreign"))
            assertTrue(model.openSource("source-current"))
            runCurrent()
            model.memoryChanged(MemoryChange.Confirmed(ChangeAction.Forget, 1))
            pending.complete(saved().source)
            runCurrent()
            assertNull(model.state.value.source)
            assertFalse(model.openSource("source-current"))
            assertEquals(listOf("source-current"), repository.sourceRequests)
        }

    private fun send(
        model: ConversationViewModel,
        text: String,
    ) {
        model.onEvent(ConversationEvent.EditDraft(text))
        model.onEvent(ConversationEvent.Submit)
    }

    private fun saved() = CaptureOutcome.Saved(MemorySource("source-current", "Dato sintético.", "2026-11-14"), 1)

    private fun answer() =
        QueryOutcome.Reply(
            AnswerStatus.Answered,
            "Una respuesta sintética.",
            listOf(QueryReference("source-current", "2026-11-14")),
        )

    private fun conversationTest(
        block: suspend TestScope.(TextConversationFixture, ConversationViewModel, ViewModelStore) -> Unit,
    ) = runTest {
        Dispatchers.setMain(StandardTestDispatcher(testScheduler))
        val store = ViewModelStore()
        val repository = TextConversationFixture()
        val model = ConversationViewModel(ReadReferencedSource(DemoSourceRepository()), conversation = repository)
        store.put("conversation", model)
        try {
            model.onEvent(ConversationEvent.SelectIntent(MemoryIntent.Ask))
            block(repository, model, store)
        } finally {
            store.clear()
            Dispatchers.resetMain()
        }
    }
}
