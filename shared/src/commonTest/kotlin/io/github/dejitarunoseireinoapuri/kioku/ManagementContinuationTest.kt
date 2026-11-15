package io.github.dejitarunoseireinoapuri.kioku

import androidx.lifecycle.ViewModelStore
import io.github.dejitarunoseireinoapuri.kioku.domain.ChangeAction
import io.github.dejitarunoseireinoapuri.kioku.domain.EditableSource
import io.github.dejitarunoseireinoapuri.kioku.domain.MemoryChange
import io.github.dejitarunoseireinoapuri.kioku.domain.MemoryItem
import io.github.dejitarunoseireinoapuri.kioku.feature.source.SourceControlEvent
import io.github.dejitarunoseireinoapuri.kioku.feature.source.SourceControlState
import io.github.dejitarunoseireinoapuri.kioku.feature.source.SourceControlViewModel
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
import kotlin.test.assertIs
import kotlin.test.assertNull

@OptIn(ExperimentalCoroutinesApi::class)
class ManagementContinuationTest {
    @Test
    fun forgettingOneItemLoadsTheSurvivorAndTheNextEditUsesItsNewVersion() =
        scenario { repository, model ->
            val survivor = replacement(repository.source, "survivor", "Examen el martes.")
            repository.readSource = { survivor }
            repository.change = { MemoryChange.Confirmed(ChangeAction.Forget, 1, listOf("survivor")) }
            model.onEvent(SourceControlEvent.Forget("$CONTROL_SOURCE-1"))
            model.onEvent(SourceControlEvent.ConfirmForget)
            runCurrent()
            val ready = assertIs<SourceControlState.Ready>(model.state.value)
            assertEquals(listOf("Examen el martes."), ready.source.items.map { it.text })
            assertEquals(ChangeAction.Forget, ready.notice)
            assertEquals("Película Loto.", ready.description?.previousText)
            assertEquals(listOf("survivor"), model.consumeChange()!!.sourceIds)
            assertNull(model.consumeChange())
            model.onEvent(SourceControlEvent.Edit("survivor-1"))
            model.onEvent(SourceControlEvent.Draft("El examen es el viernes."))
            model.onEvent(SourceControlEvent.Apply)
            runCurrent()
            assertEquals("survivor", repository.commands.last().sourceId)
            assertEquals(survivor.version, repository.commands.last().expectedVersion)
        }

    @Test
    fun correctionLoadsBothCurrentSourcesAndTheOtherMemoryCanStillBeForgotten() =
        scenario { repository, model ->
            val retained = replacement(repository.source, "retained", "Película Loto.")
            val corrected = replacement(repository.source, "corrected", "Examen el viernes.")
            repository.readSource = { if (it == "retained") retained else corrected }
            repository.change = { MemoryChange.Confirmed(ChangeAction.Correct, 1, listOf("retained", "corrected")) }
            model.onEvent(SourceControlEvent.Edit("$CONTROL_SOURCE-2"))
            model.onEvent(SourceControlEvent.Draft("Examen el viernes."))
            model.onEvent(SourceControlEvent.Apply)
            runCurrent()
            val ready = assertIs<SourceControlState.Ready>(model.state.value)
            assertEquals(
                listOf("Película Loto.", "Examen el viernes."),
                ready.sources.flatMap { it.items }.map { it.text },
            )
            assertEquals(ChangeAction.Correct, ready.notice)
            assertEquals("Examen el martes.", ready.description?.previousText)
            assertEquals("Examen el viernes.", ready.description?.replacementText)
            model.onEvent(SourceControlEvent.Forget("corrected-1"))
            assertEquals(
                "Examen el viernes.",
                assertIs<SourceControlState.Ready>(model.state.value).forget!!.preview.text,
            )
            assertEquals(1, repository.commands.size)
        }

    @Test
    fun aSecondWriteCannotDisplayThePreviousSuccessBeforeItsOwnConfirmation() =
        scenario { repository, model ->
            val survivor = replacement(repository.source, "survivor", "Examen el martes.")
            repository.readSource = { survivor }
            repository.change = { MemoryChange.Confirmed(ChangeAction.Forget, 1, listOf("survivor")) }
            model.onEvent(SourceControlEvent.Forget("$CONTROL_SOURCE-1"))
            model.onEvent(SourceControlEvent.ConfirmForget)
            runCurrent()
            model.consumeChange()
            val pending = CompletableDeferred<MemoryChange>()
            repository.change = { pending.await() }
            model.onEvent(SourceControlEvent.Forget("survivor-1"))
            model.onEvent(SourceControlEvent.ConfirmForget)
            runCurrent()
            assertNull(assertIs<SourceControlState.Working>(model.state.value).previous.notice)
            assertNull(model.consumeChange())
            pending.complete(MemoryChange.Confirmed(ChangeAction.Forget, 2))
            runCurrent()
            assertIs<SourceControlState.Done>(model.state.value)
        }

    @Test
    fun failedRefreshKeepsTheConfirmedNoticeButReloadNeverRepeatsTheWrite() =
        scenario { repository, model ->
            repository.readSource = { null }
            repository.change = { MemoryChange.Confirmed(ChangeAction.Forget, 1, listOf("survivor")) }
            model.onEvent(SourceControlEvent.Forget("$CONTROL_SOURCE-1"))
            model.onEvent(SourceControlEvent.ConfirmForget)
            runCurrent()
            assertIs<SourceControlState.RefreshFailed>(model.state.value)
            assertEquals(ChangeAction.Forget, model.consumeChange()!!.action)
            val survivor = replacement(repository.source, "survivor", "Examen el martes.")
            repository.readSource = { survivor }
            model.onEvent(SourceControlEvent.Reload)
            runCurrent()
            assertEquals(survivor, assertIs<SourceControlState.Ready>(model.state.value).source)
            assertEquals(1, repository.commands.size)
        }

    private fun replacement(
        original: EditableSource,
        id: String,
        text: String,
    ) = original.copy(
        source = original.source.copy(id = id, originalText = text),
        version = "b".repeat(64),
        items = listOf(MemoryItem("$id-1", text)),
        memoryRevision = 1,
    )

    private fun scenario(block: suspend TestScope.(ControlFixture, SourceControlViewModel) -> Unit) =
        runTest {
            Dispatchers.setMain(StandardTestDispatcher(testScheduler))
            val store = ViewModelStore()
            val repository = ControlFixture()
            val model = SourceControlViewModel(repository, CONTROL_SOURCE)
            store.put("management", model)
            try {
                runCurrent()
                block(repository, model)
            } finally {
                store.clear()
                Dispatchers.resetMain()
            }
        }
}
