package io.github.dejitarunoseireinoapuri.kioku

import androidx.lifecycle.ViewModelStore
import io.github.dejitarunoseireinoapuri.kioku.data.DemoSourceRepository
import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureOutcome
import io.github.dejitarunoseireinoapuri.kioku.domain.MemorySource
import io.github.dejitarunoseireinoapuri.kioku.domain.ReadReferencedSource
import io.github.dejitarunoseireinoapuri.kioku.domain.TextOutcome
import io.github.dejitarunoseireinoapuri.kioku.domain.TextPlan
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.ConversationEvent
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.ConversationViewModel
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.TextMessage
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
class SavedMemoryVisibilityTest {
    @Test
    fun savingThenManagingKeepsBothSavedMessagesAndAdvancesTheNextRequest() =
        sessionTest { repo, controls, model ->
            save(repo, controls, model, 1)
            checkManagement(model, "source-1")
            save(repo, controls, model, 2)
            checkManagement(model, "source-1")
            checkManagement(model, "source-2")
            assertEquals(
                1,
                repo.commands
                    .last()
                    .context.revision,
            )
            assertEquals(
                4,
                model.state.value.conversation!!
                    .messages.size,
            )
        }

    @Test
    fun recoveredSaveAdvancesTheVersionWithoutLosingItsManagementReference() =
        sessionTest { repo, controls, model ->
            repo.reply = { TextOutcome.Captured(CaptureOutcome.Unconfirmed) }
            send(model)
            runCurrent()
            val pending =
                model.state.value.conversation!!
                    .messages
                    .filterIsInstance<TextMessage.Result>()
                    .single()
            repo.recovery = { saved(1) }
            controls.revisionRead = { 1 }
            model.onEvent(ConversationEvent.CheckCapture(pending.id))
            runCurrent()
            checkManagement(model, "source-1")
            assertEquals(
                2,
                model.state.value.conversation!!
                    .messages.size,
            )
        }

    @Test
    fun anExternalChangeAfterSavingStillRevokesOldManagementReferences() =
        sessionTest { repo, controls, model ->
            save(repo, controls, model, 1)
            controls.revisionRead = { 2 }
            var allowed = true
            model.checkMemory { allowed = model.state.value.canManage(listOf("source-1")) }
            runCurrent()
            assertFalse(allowed)
            assertTrue(
                model.state.value.conversation!!
                    .messages
                    .isEmpty(),
            )
        }

    @Test
    fun aCaptureWithAnInterveningChangeCannotPreserveStaleHistory() =
        sessionTest { repo, controls, model ->
            save(repo, controls, model, 1)
            repo.reply = { TextOutcome.Captured(saved(3)) }
            controls.revisionRead = { 3 }
            send(model)
            runCurrent()
            assertFalse(model.state.value.canManage(listOf("source-1")))
            checkManagement(model, "source-3")
            assertEquals(
                2,
                model.state.value.conversation!!
                    .messages.size,
            )
        }

    private suspend fun TestScope.save(
        repo: TextConversationFixture,
        controls: ControlFixture,
        model: ConversationViewModel,
        revision: Long,
    ) {
        repo.reply = { TextOutcome.Captured(saved(revision)) }
        controls.revisionRead = { revision }
        send(model)
        runCurrent()
    }

    private fun TestScope.checkManagement(
        model: ConversationViewModel,
        id: String,
    ) {
        var allowed = false
        model.checkMemory { allowed = model.state.value.canManage(listOf(id)) }
        runCurrent()
        assertTrue(allowed)
    }

    private fun send(model: ConversationViewModel) {
        model.onEvent(ConversationEvent.EditDraft("El robot ficticio Loto es verde."))
        model.onEvent(ConversationEvent.Submit)
    }

    private fun saved(revision: Long) =
        CaptureOutcome.Saved(MemorySource("source-$revision", "Robot ficticio.", "2026-11-17"), 1, revision)

    private fun sessionTest(
        block: suspend TestScope.(TextConversationFixture, ControlFixture, ConversationViewModel) -> Unit,
    ) = runTest {
        Dispatchers.setMain(StandardTestDispatcher(testScheduler))
        val store = ViewModelStore()
        val repo = TextConversationFixture()
        val controls = ControlFixture()
        repo.plan = { TextPlan.Tell(repo.stamp.copy(revision = it.context.revision)) }
        val model =
            ConversationViewModel(
                ReadReferencedSource(DemoSourceRepository()),
                controls = controls,
                conversation = repo,
            )
        store.put("conversation", model)
        try {
            model.checkMemory()
            runCurrent()
            block(repo, controls, model)
        } finally {
            store.clear()
            Dispatchers.resetMain()
        }
    }
}
