package io.github.dejitarunoseireinoapuri.kioku

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.isDisplayed
import androidx.compose.ui.test.isEnabled
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performImeAction
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performTextInput
import io.github.dejitarunoseireinoapuri.kioku.domain.ChangeAction
import io.github.dejitarunoseireinoapuri.kioku.domain.EditableSource
import io.github.dejitarunoseireinoapuri.kioku.domain.MemoryChange
import io.github.dejitarunoseireinoapuri.kioku.domain.MemoryChangeCommand
import io.github.dejitarunoseireinoapuri.kioku.domain.MemoryControlRepository
import io.github.dejitarunoseireinoapuri.kioku.domain.MemoryItem
import io.github.dejitarunoseireinoapuri.kioku.domain.MemorySource
import io.github.dejitarunoseireinoapuri.kioku.domain.TextOutcome
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

/** Entirely synthetic: neither account nor memory repositories access Firebase or OpenAI. */
class SavedMemoryManagementTest {
    @get:Rule
    val compose = createAndroidComposeRule<LifecycleTestActivity>()

    @After
    fun clearHost() {
        compose.runOnUiThread { LifecycleTestActivity.content = null }
    }

    @Test
    fun aNewSaveOpensManagementAndForgetsOnlyAfterLocalConfirmation() {
        val repository = ConversationFlowFixture()
        val controls = SavedMutationFixture(repository.saved().source)
        repository.answer = {
            controls.epoch = 1
            TextOutcome.Captured(repository.saved().copy(memoryRevision = 1))
        }
        compose.runOnUiThread {
            LifecycleTestActivity.content = {
                KiokuApp(FixtureAccount(), conversationRepository = repository, controlRepository = controls)
            }
        }
        compose.activityRule.scenario.recreate()
        compose.waitUntil(5000) {
            compose.activity.hasWindowFocus() &&
                compose.onAllNodes(hasTestTag("text-composer") and isEnabled()).fetchSemanticsNodes().isNotEmpty()
        }
        compose.onNodeWithTag("text-composer").performTextInput("Dato de prueba: me gusta el miso.")
        compose.onNodeWithTag("text-composer").performImeAction()
        compose.waitUntil(5000) { compose.onNodeWithContentDescription("Gestionar este recuerdo").isDisplayed() }
        compose.onNodeWithContentDescription("Gestionar este recuerdo").performScrollTo().performClick()
        click("Gestionar")
        click("Olvidar")
        compose.onNodeWithTag("forget-confirmation").assertIsDisplayed()
        assertEquals(0, controls.commands.size)
        click("Cancelar")
        assertEquals(0, controls.commands.size)
        click("Olvidar")
        click("Sí, olvidar")
        compose.waitUntil(5000) { compose.onNodeWithText("Recuerdo borrado").isDisplayed() }
        assertEquals(1, controls.commands.size)
        assertEquals(ChangeAction.Forget, controls.commands.single().action)
        assertEquals(listOf("synthetic-unit"), controls.commands.single().memoryIds)
        assertEquals(2L, controls.epoch)
    }

    private fun click(text: String) {
        compose.waitUntil(5000) { compose.onNodeWithText(text).isDisplayed() }
        compose.onNodeWithText(text).performScrollTo().performClick()
    }
}

private class SavedMutationFixture(
    private val source: MemorySource,
) : MemoryControlRepository {
    var epoch = 0L
    val commands = mutableListOf<MemoryChangeCommand>()

    override suspend fun revision() = epoch

    override suspend fun details(id: String) =
        source.takeIf { id == it.id && epoch == 1L }?.let {
            EditableSource(it, "fixture-version", listOf(MemoryItem("synthetic-unit", it.originalText)), epoch)
        }

    override fun prepare(
        source: EditableSource,
        ids: List<String>,
        action: ChangeAction,
        correction: String?,
    ) = MemoryChangeCommand("synthetic-forget", source.source.id, source.version, ids, action, correction, "UTC")

    override suspend fun execute(command: MemoryChangeCommand): MemoryChange {
        commands.add(command)
        epoch++
        return MemoryChange.Confirmed(command.action, epoch, previousSourceId = command.sourceId)
    }
}
