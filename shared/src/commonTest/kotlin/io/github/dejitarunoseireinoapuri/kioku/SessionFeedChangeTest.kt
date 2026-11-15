package io.github.dejitarunoseireinoapuri.kioku

import io.github.dejitarunoseireinoapuri.kioku.domain.AnswerStatus
import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureOutcome
import io.github.dejitarunoseireinoapuri.kioku.domain.ChangeAction
import io.github.dejitarunoseireinoapuri.kioku.domain.MemoryChange
import io.github.dejitarunoseireinoapuri.kioku.domain.MemorySource
import io.github.dejitarunoseireinoapuri.kioku.domain.QueryOutcome
import io.github.dejitarunoseireinoapuri.kioku.domain.SourceReplacement
import io.github.dejitarunoseireinoapuri.kioku.domain.TextIntent
import io.github.dejitarunoseireinoapuri.kioku.domain.TextOutcome
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.TextConversationSession
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.TextConversationState
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.TextMessage
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.savedMessageSources
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

@OptIn(ExperimentalCoroutinesApi::class)
class SessionFeedChangeTest {
    @Test
    fun originalsRemainInBothModesButOldEvidenceAndCommandsNeverBecomeContext() =
        runTest {
            val repository = TextConversationFixture()
            var state = TextConversationState()
            val session = TextConversationSession(repository, this, { next, _ -> state = next }, { _, _ -> }, {})
            repository.reply = { saved("before") }
            session.submit("Mi examen es el martes.", TextIntent.Tell)
            runCurrent()
            session.selectIntent(TextIntent.Ask)
            repository.reply =
                { TextOutcome.Asked(QueryOutcome.Reply(AnswerStatus.NotFound, "Respuesta antigua.", emptyList())) }
            session.submit("¿Cuándo es mi examen?", TextIntent.Ask)
            runCurrent()
            session.reset(change = correction())
            val question = state.messages.filterIsInstance<TextMessage.Owner>().single()
            val answer = state.messages.filterIsInstance<TextMessage.PastReply>().single()
            assertEquals("¿Cuándo es mi examen?", question.text)
            assertEquals("Respuesta antigua.", answer.text)
            session.selectIntent(TextIntent.Tell)
            val owner = state.messages.filterIsInstance<TextMessage.Owner>().single()
            assertEquals("Mi examen es el martes.", owner.text)
            assertTrue(owner.historical)
            assertTrue(state.savedMessageSources().isEmpty())
            assertFalse(session.openSource("after"))
            assertTrue(state.messages.filterIsInstance<TextMessage.Result>().isEmpty())
            assertFalse(session.openSource("before"))
            session.selectIntent(TextIntent.Ask)
            session.submit("¿Y ahora?", TextIntent.Ask)
            runCurrent()
            val context = repository.commands.last().context
            assertTrue(context.questions.isEmpty())
            assertTrue(context.sourceIds.isEmpty())
        }

    @Test
    fun anUnrelatedSavedMessageKeepsItsOwnManagementAction() =
        runTest {
            val repository = TextConversationFixture()
            var state = TextConversationState()
            val session = TextConversationSession(repository, this, { next, _ -> state = next }, { _, _ -> }, {})
            repository.reply = { saved("changed") }
            session.submit("Primer recuerdo ficticio.", TextIntent.Tell)
            runCurrent()
            repository.reply = { saved("unrelated") }
            session.submit("Segundo recuerdo independiente.", TextIntent.Tell)
            runCurrent()
            session.reset(
                change =
                    MemoryChange.Confirmed(
                        ChangeAction.Forget,
                        1,
                        previousSourceId = "changed",
                        replacements = listOf(SourceReplacement("changed", emptyList())),
                    ),
            )
            val owners = state.messages.filterIsInstance<TextMessage.Owner>()
            assertTrue(owners.first().historical)
            assertFalse(owners.last().historical)
            assertEquals(mapOf(owners.last().id to "unrelated"), state.savedMessageSources())
        }

    @Test
    fun allForgottenCopiesLoseTheirActionsButKeepTheOwnersRequestedOriginalFeed() =
        runTest {
            val repository = TextConversationFixture()
            var state = TextConversationState()
            val session = TextConversationSession(repository, this, { next, _ -> state = next }, { _, _ -> }, {})
            repository.reply = { saved("first") }
            session.submit("Quiero ver la película Bruma.", TextIntent.Tell)
            runCurrent()
            repository.reply = { saved("second") }
            session.submit("Bruma sigue pendiente.", TextIntent.Tell)
            runCurrent()
            session.reset(
                change =
                    MemoryChange.Confirmed(
                        ChangeAction.Forget,
                        1,
                        previousSourceId = "first",
                        replacements =
                            listOf(
                                SourceReplacement("first", emptyList()),
                                SourceReplacement("second", emptyList()),
                            ),
                    ),
            )
            assertEquals(
                listOf(
                    "Quiero ver la película Bruma.",
                    "Bruma sigue pendiente.",
                ),
                state.messages.filterIsInstance<TextMessage.Owner>().map {
                    it.text
                },
            )
            assertTrue(state.savedMessageSources().isEmpty())
            assertTrue(state.messages.filterIsInstance<TextMessage.Owner>().all { it.historical })
            assertEquals(
                ChangeAction.Forget,
                state.messages
                    .filterIsInstance<TextMessage.Notice>()
                    .single()
                    .action,
            )
            assertFalse(session.openSource("first"))
            assertFalse(session.openSource("second"))
            session.reset()
            assertTrue(state.messages.isEmpty())
        }

    private fun saved(id: String) =
        TextOutcome.Captured(
            CaptureOutcome.Saved(MemorySource(id, "Fuente sintética.", "2026-11-15"), 1),
        )

    private fun correction() =
        MemoryChange.Confirmed(
            ChangeAction.Correct,
            1,
            listOf("after"),
            "before",
            listOf(SourceReplacement("before", listOf("after"))),
        )
}
