package io.github.dejitarunoseireinoapuri.kioku

import androidx.lifecycle.ViewModelStore
import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureIssue
import io.github.dejitarunoseireinoapuri.kioku.domain.ChangeAction
import io.github.dejitarunoseireinoapuri.kioku.domain.EditableSource
import io.github.dejitarunoseireinoapuri.kioku.domain.MemoryChange
import io.github.dejitarunoseireinoapuri.kioku.feature.source.ControlFeedback
import io.github.dejitarunoseireinoapuri.kioku.feature.source.SourceControlEvent
import io.github.dejitarunoseireinoapuri.kioku.feature.source.SourceControlState
import io.github.dejitarunoseireinoapuri.kioku.feature.source.SourceControlViewModel
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
import kotlin.test.assertNotEquals

@OptIn(ExperimentalCoroutinesApi::class)
class SourceControlViewModelTest {
    @Test
    fun correctionWaitsForServerAndCannotDoubleSubmit() =
        controlTest { repository, model, _ ->
            val pending = CompletableDeferred<MemoryChange>()
            repository.change = { pending.await() }
            edit(model)
            model.onEvent(SourceControlEvent.Apply)
            runCurrent()
            assertIs<SourceControlState.Working>(model.state.value)
            model.onEvent(SourceControlEvent.Apply)
            assertEquals(1, repository.commands.size)
            assertEquals(listOf("$CONTROL_SOURCE-2"), repository.commands.single().memoryIds)
            pending.complete(MemoryChange.Confirmed(ChangeAction.Correct, 1))
            runCurrent()
            assertIs<SourceControlState.Done>(model.state.value)
        }

    @Test
    fun retryReusesCommandButEditedCorrectionGetsANewId() =
        controlTest { repository, model, _ ->
            repository.change = { MemoryChange.Failed(CaptureIssue.Unavailable) }
            edit(model)
            model.onEvent(SourceControlEvent.Apply)
            runCurrent()
            model.onEvent(SourceControlEvent.Retry)
            runCurrent()
            assertEquals(repository.commands[0], repository.commands[1])
            model.onEvent(SourceControlEvent.Draft("Mi examen es el sábado."))
            model.onEvent(SourceControlEvent.Apply)
            runCurrent()
            assertNotEquals(repository.commands[0].requestId, repository.commands[2].requestId)
        }

    @Test
    fun unresolvedChangePreservesEditorAndProcessingBlocksAnotherScope() =
        controlTest { repository, model, _ ->
            repository.change = { MemoryChange.Clarification("Necesito la frase completa.") }
            edit(model)
            model.onEvent(SourceControlEvent.Apply)
            runCurrent()
            val ready = assertIs<SourceControlState.Ready>(model.state.value)
            assertEquals("Mi examen es el viernes.", ready.draft)
            assertIs<ControlFeedback.Clarification>(ready.feedback)
            repository.change = { MemoryChange.Processing }
            model.onEvent(SourceControlEvent.Retry)
            runCurrent()
            model.onEvent(SourceControlEvent.Forget())
            assertEquals(2, repository.commands.size)
            assertEquals(ControlFeedback.Processing, assertIs<SourceControlState.Ready>(model.state.value).feedback)
        }

    @Test
    fun revalidationKeepsDraftOnSameRevisionButRemovesRetiredContent() =
        controlTest { repository, model, _ ->
            edit(model)
            model.check()
            assertIs<SourceControlState.Loading>(model.state.value)
            runCurrent()
            assertEquals("Mi examen es el viernes.", assertIs<SourceControlState.Ready>(model.state.value).draft)
            repository.revisionRead = { 1 }
            repository.read = { null }
            model.check()
            runCurrent()
            assertEquals(SourceControlState.Missing, model.state.value)
        }

    @Test
    fun pendingReadCannotRestorePrivateContentWhilePaused() =
        controlTest { repository, model, _ ->
            val pending = CompletableDeferred<EditableSource?>()
            repository.read = { pending.await() }
            model.onEvent(SourceControlEvent.Reload)
            runCurrent()
            model.conceal()
            pending.complete(repository.source)
            runCurrent()
            assertEquals(SourceControlState.Loading, model.state.value)
            model.check()
            runCurrent()
            assertIs<SourceControlState.Ready>(model.state.value)
        }

    @Test
    fun pendingChangeAndItsResultStayHiddenUntilResumeWithoutResubmission() =
        controlTest { repository, model, _ ->
            val pending = CompletableDeferred<MemoryChange>()
            repository.change = { pending.await() }
            edit(model)
            model.onEvent(SourceControlEvent.Apply)
            runCurrent()
            model.conceal()
            assertEquals(SourceControlState.Loading, model.state.value)
            model.check()
            assertIs<SourceControlState.Working>(model.state.value)
            model.conceal()
            pending.complete(MemoryChange.Failed(CaptureIssue.Unavailable))
            runCurrent()
            assertEquals(SourceControlState.Loading, model.state.value)
            model.check()
            runCurrent()
            assertEquals("Mi examen es el viernes.", assertIs<SourceControlState.Ready>(model.state.value).draft)
            assertEquals(1, repository.commands.size)
        }

    @Test
    fun disposalClearsPrivateStateAndIgnoresNonCooperativeLateResult() =
        controlTest { repository, model, store ->
            val pending = CompletableDeferred<MemoryChange>()
            repository.change = { withContext(NonCancellable) { pending.await() } }
            model.onEvent(SourceControlEvent.Forget("$CONTROL_SOURCE-1"))
            runCurrent()
            store.clear()
            pending.complete(MemoryChange.Confirmed(ChangeAction.Forget, 1))
            runCurrent()
            assertEquals(SourceControlState.Missing, model.state.value)
        }

    private fun edit(model: SourceControlViewModel) {
        model.onEvent(SourceControlEvent.Edit("$CONTROL_SOURCE-2"))
        model.onEvent(SourceControlEvent.Draft("Mi examen es el viernes."))
    }

    private fun controlTest(block: suspend TestScope.(ControlFixture, SourceControlViewModel, ViewModelStore) -> Unit) =
        runTest {
            Dispatchers.setMain(StandardTestDispatcher(testScheduler))
            val store = ViewModelStore()
            val repository = ControlFixture()
            val model = SourceControlViewModel(repository, CONTROL_SOURCE)
            store.put("control", model)
            try {
                runCurrent()
                block(repository, model, store)
            } finally {
                store.clear()
                Dispatchers.resetMain()
            }
        }
}
