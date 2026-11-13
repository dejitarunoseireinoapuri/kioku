package io.github.dejitarunoseireinoapuri.kioku

import androidx.lifecycle.ViewModelStore
import io.github.dejitarunoseireinoapuri.kioku.data.DemoSourceRepository
import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureCommand
import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureIssue
import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureOutcome
import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureRepository
import io.github.dejitarunoseireinoapuri.kioku.domain.MemorySource
import io.github.dejitarunoseireinoapuri.kioku.domain.ReadReferencedSource
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.ConversationEvent
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.ConversationViewModel
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.MemoryIntent
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.PreviewFeedback
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.PreviewScenario
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
class CaptureViewModelTest {
    @Test
    fun captureWaitsForTheServerAndDuplicateSubmissionDoesNotCreateAnotherCommand() =
        captureTest { repo, model ->
            val response = CompletableDeferred<CaptureOutcome>()
            repo.onExecute = { response.await() }
            send(model, "Un recuerdo ficticio")
            runCurrent()
            assertTrue(model.state.value.capturing)
            assertNull(model.state.value.capture)
            model.onEvent(ConversationEvent.Submit)
            runCurrent()
            assertEquals(1, repo.commands.size)
            response.complete(saved())
            runCurrent()
            assertIs<CaptureOutcome.Saved>(model.state.value.capture)
            assertEquals("", model.state.value.draft)
            assertTrue(model.openSource("synthetic-source"))
        }

    @Test
    fun clarificationKeepsTheOriginalIntentAndIsNotAnIndependentCapture() =
        captureTest { repo, model ->
            repo.onExecute = { CaptureOutcome.Clarification("pending", 1, "¿De qué mes?") }
            send(model, "El examen es el día 24.")
            runCurrent()
            assertEquals("", model.state.value.draft)
            model.onEvent(ConversationEvent.SelectIntent(MemoryIntent.Ask))
            assertEquals(MemoryIntent.Tell, model.state.value.intent)
            repo.onExecute = { saved() }
            send(model, "De noviembre de 2026")
            runCurrent()
            val answer = assertIs<CaptureCommand.Clarify>(repo.commands.last())
            assertEquals("pending", answer.clarificationId)
            assertEquals(1, answer.revision)
            assertIs<CaptureOutcome.Saved>(model.state.value.capture)
        }

    @Test
    fun explicitRetryReusesIdentityAndUncertainResultsRecoverWithoutResendingText() =
        captureTest { repo, model ->
            repo.onExecute = { CaptureOutcome.Failed(CaptureIssue.Unavailable) }
            send(model, "Un recuerdo ficticio")
            runCurrent()
            val first = repo.commands.single()
            repo.onExecute = { CaptureOutcome.Processing }
            model.onEvent(ConversationEvent.Submit)
            runCurrent()
            assertEquals(first, repo.commands.last())
            assertFalse(model.state.value.canEdit)
            repo.recovered = saved()
            model.onEvent(ConversationEvent.RecoverCapture)
            runCurrent()
            assertEquals(2, repo.commands.size)
            assertEquals(listOf(first.requestId), repo.recoveries)
            assertIs<CaptureOutcome.Saved>(model.state.value.capture)
        }

    @Test
    fun askingNeverCallsTheCaptureRepository() =
        captureTest { repo, model ->
            model.onEvent(ConversationEvent.SelectIntent(MemoryIntent.Ask))
            send(model, "¿Qué película quiero ver?")
            runCurrent()
            assertTrue(repo.commands.isEmpty())
            assertEquals(PreviewFeedback.QueryUnavailable, model.state.value.feedback)
        }

    @Test
    fun leavingTheLiveOperationCancelsItAndCannotContaminateAnExample() =
        captureTest { repo, model ->
            val response = CompletableDeferred<CaptureOutcome>()
            repo.onExecute = { response.await() }
            send(model, "Un recuerdo ficticio")
            runCurrent()
            model.onEvent(ConversationEvent.ShowExample(PreviewScenario.Answer))
            response.complete(saved())
            runCurrent()
            assertNull(model.state.value.capture)
            assertEquals(PreviewScenario.Answer, model.state.value.scenario)
        }

    private fun send(
        model: ConversationViewModel,
        text: String,
    ) {
        model.onEvent(ConversationEvent.EditDraft(text))
        model.onEvent(ConversationEvent.Submit)
    }

    private fun saved() =
        CaptureOutcome.Saved(MemorySource("synthetic-source", "Un recuerdo ficticio", "2026-11-13"), 1)

    private fun captureTest(block: suspend TestScope.(CaptureFixture, ConversationViewModel) -> Unit) =
        runTest {
            Dispatchers.setMain(StandardTestDispatcher(testScheduler))
            val store = ViewModelStore()
            val repository = CaptureFixture()
            val model = ConversationViewModel(ReadReferencedSource(DemoSourceRepository()), repository)
            store.put("memory", model)
            try {
                block(repository, model)
            } finally {
                store.clear()
                Dispatchers.resetMain()
            }
        }
}

private class CaptureFixture : CaptureRepository {
    val commands = mutableListOf<CaptureCommand>()
    val recoveries = mutableListOf<String>()
    var onExecute: suspend (CaptureCommand) -> CaptureOutcome = { CaptureOutcome.Ignored }
    var recovered: CaptureOutcome = CaptureOutcome.Processing

    override fun tell(text: String) = CaptureCommand.Tell("fixture-${commands.size}", text, "Europe/Madrid")

    override fun clarify(
        text: String,
        id: String,
        revision: Int,
    ) = CaptureCommand.Clarify("fixture-${commands.size}", text, id, revision)

    override suspend fun execute(command: CaptureCommand): CaptureOutcome {
        commands.add(command)
        return onExecute(command)
    }

    override suspend fun recover(requestId: String): CaptureOutcome {
        recoveries.add(requestId)
        return recovered
    }
}
