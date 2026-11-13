package io.github.dejitarunoseireinoapuri.kioku

import androidx.lifecycle.ViewModelStore
import io.github.dejitarunoseireinoapuri.kioku.data.DemoSourceRepository
import io.github.dejitarunoseireinoapuri.kioku.domain.AnswerStatus
import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureIssue
import io.github.dejitarunoseireinoapuri.kioku.domain.MemorySource
import io.github.dejitarunoseireinoapuri.kioku.domain.QueryCommand
import io.github.dejitarunoseireinoapuri.kioku.domain.QueryOutcome
import io.github.dejitarunoseireinoapuri.kioku.domain.QueryReference
import io.github.dejitarunoseireinoapuri.kioku.domain.QueryRepository
import io.github.dejitarunoseireinoapuri.kioku.domain.ReadReferencedSource
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.ConversationEvent
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.ConversationViewModel
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.MemoryIntent
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.QueryAction
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
class QueryViewModelTest {
    @Test
    fun queryWaitsForEvidenceAndCannotDoubleSubmitOrSaveTheQuestion() =
        queryTest { repo, model ->
            val pending = CompletableDeferred<QueryOutcome>()
            repo.answer = { pending.await() }
            send(model, "¿Qué película tengo pendiente?")
            runCurrent()
            model.onEvent(ConversationEvent.Submit)
            assertTrue(model.state.value.query.busy)
            assertNull(model.state.value.capture)
            assertEquals(1, repo.commands.size)
            pending.complete(repo.reply())
            runCurrent()
            assertIs<QueryOutcome.Reply>(model.state.value.query.outcome)
            assertEquals("", model.state.value.draft)
        }

    @Test
    fun clarificationKeepsItsOriginalQuestionAndIntent() =
        queryTest { repo, model ->
            repo.answer = { QueryOutcome.Reply(AnswerStatus.Clarification, "¿A qué Pablo te refieres?", emptyList()) }
            send(model, "¿Qué película dijo Pablo?")
            runCurrent()
            model.onEvent(ConversationEvent.SelectIntent(MemoryIntent.Tell))
            assertEquals(MemoryIntent.Ask, model.state.value.intent)
            repo.answer = { repo.reply() }
            send(model, "Mi compañero de japonés.")
            runCurrent()
            assertEquals("¿Qué película dijo Pablo?\nAclaración: Mi compañero de japonés.", repo.commands.last().text)
            assertNull(model.state.value.capture)
        }

    @Test
    fun clearingTheSessionRejectsEvenALateUncooperativeAnswer() =
        queryTest { repo, model ->
            val pending = CompletableDeferred<QueryOutcome>()
            repo.answer = { withContext(NonCancellable) { pending.await() } }
            send(model, "¿Qué recuerdo tengo?")
            runCurrent()
            model.onEvent(ConversationEvent.Query(QueryAction.Reset))
            pending.complete(repo.reply())
            runCurrent()
            assertNull(model.state.value.query.outcome)
            assertEquals("", model.state.value.query.question)
        }

    @Test
    fun onlyReferencedSourcesCanOpenAndEachOpeningReadsCurrentData() =
        queryTest { repo, model ->
            send(model, "¿Qué película tengo pendiente?")
            runCurrent()
            assertFalse(model.openSource("foreign"))
            assertTrue(model.openSource("fixture-source"))
            assertTrue(model.state.value.query.sourceLoading)
            runCurrent()
            assertEquals(
                "Fuente ficticia vigente",
                model.state.value.source
                    ?.originalText,
            )
            repo.source = null
            model.openSource("fixture-source")
            assertNull(model.state.value.source)
            runCurrent()
            assertNull(model.state.value.source)
            assertEquals(2, repo.sourceCalls)
        }

    @Test
    fun retryKeepsItsIdAndRestartNeedsAnExplicitAction() =
        queryTest { repo, model ->
            repo.answer = { QueryOutcome.Failed(CaptureIssue.Unavailable) }
            send(model, "¿Qué película tengo pendiente?")
            runCurrent()
            repo.answer = { QueryOutcome.RepeatRequired }
            model.onEvent(ConversationEvent.Query(QueryAction.Retry))
            runCurrent()
            assertEquals(repo.commands.first().requestId, repo.commands.last().requestId)
            repo.answer = { repo.reply() }
            model.onEvent(ConversationEvent.Query(QueryAction.Restart))
            runCurrent()
            assertEquals("query-2", repo.commands.last().requestId)
        }

    private fun send(
        model: ConversationViewModel,
        text: String,
    ) {
        model.onEvent(ConversationEvent.EditDraft(text))
        model.onEvent(ConversationEvent.Submit)
    }

    private fun queryTest(block: suspend TestScope.(QueryFixture, ConversationViewModel) -> Unit) =
        runTest {
            Dispatchers.setMain(StandardTestDispatcher(testScheduler))
            val store = ViewModelStore()
            val repository = QueryFixture()
            val model = ConversationViewModel(ReadReferencedSource(DemoSourceRepository()), queries = repository)
            store.put("query", model)
            model.onEvent(ConversationEvent.SelectIntent(MemoryIntent.Ask))
            try {
                block(repository, model)
            } finally {
                store.clear()
                Dispatchers.resetMain()
            }
        }
}

private class QueryFixture : QueryRepository {
    val commands = mutableListOf<QueryCommand>()
    var source: MemorySource? = MemorySource("fixture-source", "Fuente ficticia vigente", "2026-11-13")
    var sourceCalls = 0
    var answer: suspend () -> QueryOutcome = { reply() }

    override fun prepare(text: String) = QueryCommand("query-${commands.size}", text)

    override suspend fun execute(command: QueryCommand): QueryOutcome {
        commands.add(command)
        return answer()
    }

    override suspend fun source(id: String): MemorySource? {
        sourceCalls++
        return source
    }

    fun reply() =
        QueryOutcome.Reply(
            AnswerStatus.Answered,
            "Respuesta ficticia",
            listOf(QueryReference("fixture-source", "2026-11-13")),
        )
}
