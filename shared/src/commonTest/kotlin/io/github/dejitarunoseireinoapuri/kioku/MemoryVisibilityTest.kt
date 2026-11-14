package io.github.dejitarunoseireinoapuri.kioku

import androidx.lifecycle.ViewModelStore
import io.github.dejitarunoseireinoapuri.kioku.data.DemoSourceRepository
import io.github.dejitarunoseireinoapuri.kioku.domain.AnswerStatus
import io.github.dejitarunoseireinoapuri.kioku.domain.QueryCommand
import io.github.dejitarunoseireinoapuri.kioku.domain.QueryOutcome
import io.github.dejitarunoseireinoapuri.kioku.domain.QueryRepository
import io.github.dejitarunoseireinoapuri.kioku.domain.ReadReferencedSource
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.ConversationEvent
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.ConversationViewModel
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
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

@OptIn(ExperimentalCoroutinesApi::class)
class MemoryVisibilityTest {
    @Test
    fun anotherDeviceMutationClearsChatAndOldDraftBeforeItCanBeDisplayedAgain() =
        visibilityTest { controls, model, _ ->
            send(model, "Pregunta ficticia anterior")
            runCurrent()
            model.onEvent(ConversationEvent.EditDraft("Borrador anterior"))
            controls.revisionRead = { 1 }
            model.checkMemory()
            assertTrue(model.state.value.checkingMemory)
            runCurrent()
            assertTrue(
                model.state.value.query.messages
                    .isEmpty(),
            )
            assertEquals("", model.state.value.draft)
            assertFalse(model.state.value.checkingMemory)
        }

    @Test
    fun newQuestionSurvivesRevalidationButOldContextDoesNot() =
        visibilityTest { controls, model, queries ->
            send(model, "Pregunta ficticia anterior")
            runCurrent()
            controls.revisionRead = { 2 }
            send(model, "Pregunta nueva explícita")
            runCurrent()
            assertEquals("Pregunta nueva explícita", queries.commands.last().text)
            assertEquals(2, queries.commands.last().memoryRevision)
            assertTrue(
                queries.commands
                    .last()
                    .previousQuestions
                    .isEmpty(),
            )
        }

    @Test
    fun failedRevalidationClearsPrivateContentAndDoesNotSendAnotherQuestion() =
        visibilityTest { controls, model, queries ->
            send(model, "Pregunta anterior")
            runCurrent()
            controls.revisionRead = { null }
            send(model, "Pregunta que debe esperar")
            runCurrent()
            assertEquals(1, queries.commands.size)
            assertTrue(
                model.state.value.query.messages
                    .isEmpty(),
            )
        }

    private fun send(
        model: ConversationViewModel,
        text: String,
    ) {
        model.onEvent(ConversationEvent.EditDraft(text))
        model.onEvent(ConversationEvent.Submit)
    }

    private fun visibilityTest(
        block: suspend TestScope.(ControlFixture, ConversationViewModel, VisibilityQueries) -> Unit,
    ) = runTest {
        Dispatchers.setMain(StandardTestDispatcher(testScheduler))
        val store = ViewModelStore()
        val controls = ControlFixture()
        val queries = VisibilityQueries()
        val model =
            ConversationViewModel(ReadReferencedSource(DemoSourceRepository()), queries = queries, controls = controls)
        store.put("conversation", model)
        assertTrue(model.state.value.checkingMemory)
        assertFalse(model.state.value.canSwitchIntent)
        model.checkMemory()
        try {
            runCurrent()
            model.onEvent(ConversationEvent.SelectIntent(MemoryIntent.Ask))
            block(controls, model, queries)
        } finally {
            store.clear()
            Dispatchers.resetMain()
        }
    }
}

private class VisibilityQueries : QueryRepository {
    val commands = mutableListOf<QueryCommand>()

    override fun prepare(text: String) = QueryCommand("query-${commands.size}", text)

    override suspend fun execute(command: QueryCommand): QueryOutcome {
        commands.add(command)
        return QueryOutcome.Reply(AnswerStatus.NotFound, "No consta el dato ficticio.", emptyList())
    }

    override suspend fun source(id: String) = null
}
