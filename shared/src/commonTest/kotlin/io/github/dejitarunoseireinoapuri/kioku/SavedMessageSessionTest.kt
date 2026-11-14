package io.github.dejitarunoseireinoapuri.kioku

import io.github.dejitarunoseireinoapuri.kioku.domain.AnswerStatus
import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureOutcome
import io.github.dejitarunoseireinoapuri.kioku.domain.MemorySource
import io.github.dejitarunoseireinoapuri.kioku.domain.QueryOutcome
import io.github.dejitarunoseireinoapuri.kioku.domain.QueryReference
import io.github.dejitarunoseireinoapuri.kioku.domain.TextIntent
import io.github.dejitarunoseireinoapuri.kioku.domain.TextOutcome
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.TextConversationSession
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.TextConversationState
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.TextMessage
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.savedMessageSources
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

@OptIn(ExperimentalCoroutinesApi::class)
class SavedMessageSessionTest {
    @Test
    fun onlyConfirmedSavesAttachToTheirOwnMessagesAndQuestionsStayUnmanaged() =
        sessionTest { repo, session, state ->
            val pending = CompletableDeferred<TextOutcome>()
            repo.reply = { pending.await() }
            session.submit("Relato uno.", TextIntent.Tell)
            runCurrent()
            assertTrue(state().savedMessageSources().isEmpty())
            val first = state().messages.single().id
            pending.complete(saved("source-one"))
            runCurrent()
            assertEquals(mapOf(first to "source-one"), state().savedMessageSources())
            repo.reply = {
                TextOutcome.Asked(
                    QueryOutcome.Reply(
                        AnswerStatus.Answered,
                        "Respuesta.",
                        listOf(QueryReference("source-one", "2026-11-14")),
                    ),
                )
            }
            session.submit("¿Qué conté?", TextIntent.Ask)
            runCurrent()
            assertEquals(mapOf(first to "source-one"), state().savedMessageSources())
            repo.reply = { saved("source-two") }
            session.submit("Relato dos.", TextIntent.Tell)
            runCurrent()
            val second =
                state()
                    .messages
                    .filterIsInstance<TextMessage.Owner>()
                    .last()
                    .id
            assertEquals(mapOf(first to "source-one", second to "source-two"), state().savedMessageSources())
            session.reset()
            assertTrue(state().savedMessageSources().isEmpty())
        }

    @Test
    fun acceptingAnOfferByTextManagesTheOriginalFactRatherThanTheYesReply() =
        sessionTest { repo, session, state ->
            session.submit("Me gusta el miso.", TextIntent.Ask)
            runCurrent()
            val original = state().messages.first().id
            repo.reply = { saved("accepted-source") }
            session.submit("sí", TextIntent.Ask)
            runCurrent()
            assertEquals(mapOf(original to "accepted-source"), state().savedMessageSources())
            assertEquals(2, state().messages.filterIsInstance<TextMessage.Owner>().size)
        }

    @Test
    fun aRecoveredClarificationKeepsTheOriginalMessageAcrossModeChangesAndLaterQuestions() =
        sessionTest { repo, session, state ->
            repo.reply = { TextOutcome.Captured(CaptureOutcome.Processing) }
            session.submit("Tengo un examen.", TextIntent.Tell)
            runCurrent()
            val original = state().messages.first().id
            val receipt = state().messages.last().id
            session.reset(preservePending = true)
            repo.reply = { TextOutcome.Asked(QueryOutcome.Reply(AnswerStatus.NotFound, "No consta.", emptyList())) }
            session.submit("¿Otra cosa?", TextIntent.Ask)
            runCurrent()
            repo.recovery = { CaptureOutcome.Clarification("parent", 1, "¿Cuándo?") }
            session.checkCapture(receipt)
            runCurrent()
            repo.reply = { saved("clarified-source") }
            session.submit("El martes.", TextIntent.Ask)
            runCurrent()
            assertEquals(mapOf(original to "clarified-source"), state().savedMessageSources())
            assertEquals(3, repo.commands.size)
            assertEquals(
                "parent",
                repo.commands
                    .last()
                    .capture
                    ?.clarificationId,
            )
        }

    private fun saved(id: String) =
        TextOutcome.Captured(
            CaptureOutcome.Saved(MemorySource(id, "Texto sintético.", "2026-11-14"), 1),
        )

    private fun sessionTest(
        block: suspend TestScope.(
            TextConversationFixture,
            TextConversationSession,
            () -> TextConversationState,
        ) -> Unit,
    ) = runTest {
        val repo = TextConversationFixture()
        var state = TextConversationState()
        val session = TextConversationSession(repo, this, { next, _ -> state = next }, { _, _ -> }, {})
        block(repo, session) { state }
    }
}
