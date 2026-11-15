package io.github.dejitarunoseireinoapuri.kioku

import android.content.pm.ActivityInfo
import android.content.res.Configuration
import android.view.KeyEvent
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.ComposeTimeoutException
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.assertTextContains
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.hasAnyDescendant
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.isDisplayed
import androidx.compose.ui.test.isEnabled
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onFirst
import androidx.compose.ui.test.onLast
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performImeAction
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performTextInput
import androidx.compose.ui.test.performTextReplacement
import androidx.lifecycle.Lifecycle
import androidx.test.platform.app.InstrumentationRegistry
import io.github.dejitarunoseireinoapuri.kioku.domain.AnswerStatus
import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureIssue
import io.github.dejitarunoseireinoapuri.kioku.domain.ChangeAction
import io.github.dejitarunoseireinoapuri.kioku.domain.EditableSource
import io.github.dejitarunoseireinoapuri.kioku.domain.MemoryChange
import io.github.dejitarunoseireinoapuri.kioku.domain.MemoryChangeCommand
import io.github.dejitarunoseireinoapuri.kioku.domain.MemoryControlRepository
import io.github.dejitarunoseireinoapuri.kioku.domain.MemoryItem
import io.github.dejitarunoseireinoapuri.kioku.domain.MemorySource
import io.github.dejitarunoseireinoapuri.kioku.domain.QueryCommand
import io.github.dejitarunoseireinoapuri.kioku.domain.QueryOutcome
import io.github.dejitarunoseireinoapuri.kioku.domain.QueryReference
import io.github.dejitarunoseireinoapuri.kioku.domain.QueryRepository
import kotlinx.coroutines.CompletableDeferred
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Rule
import org.junit.Test

class SourceControlNavigationTest {
    @get:Rule
    val compose = createAndroidComposeRule<LifecycleTestActivity>()
    private val account = FixtureAccount()
    private val controls = ControlNavigationFixture()
    private val queries = ControlNavigationQueries()

    @Before
    fun openSourceControls() {
        compose.runOnUiThread {
            LifecycleTestActivity.content =
                { KiokuApp(account, queryRepository = queries, controlRepository = controls) }
        }
        compose.activityRule.scenario.recreate()
        awaitReady()
        compose.onNodeWithTag("intent-Ask").performClick()
        compose.onNodeWithTag("intent-Ask").assert(SemanticsMatcher.expectValue(SemanticsProperties.Selected, true))
        compose.onNodeWithTag("text-composer").performTextInput(OLD_QUESTION)
        compose.onNodeWithTag("text-composer").assertTextContains(OLD_QUESTION)
        compose.onNodeWithTag("text-composer").performImeAction()
        val source = "Gestionar este recuerdo"
        try {
            compose.waitUntil(5000) { compose.onNodeWithContentDescription(source).isDisplayed() }
        } catch (failure: ComposeTimeoutException) {
            captureBrandScreen(compose.activity, "kioku-control-failure.png") { compose.onRoot().captureToImage() }
            throw AssertionError(
                "Source not displayed; query calls=${queries.calls}; revision reads=${controls.revisionReads}",
                failure,
            )
        }
        compose.onNodeWithContentDescription(source).performScrollTo().performClick()
        compose.waitUntil(5000) { compose.onNodeWithText("Gestionar").isDisplayed() }
        compose.onNodeWithText("Gestionar").performClick()
        compose.waitUntil(5000) {
            compose.onAllNodes(hasText("Corregir") and isEnabled()).fetchSemanticsNodes().size ==
                2
        }
    }

    @After
    fun clearHost() {
        compose.runOnUiThread { compose.activity.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_PORTRAIT }
        compose.waitUntil(5000) {
            compose.activity.resources.configuration.orientation == Configuration.ORIENTATION_PORTRAIT
        }
        compose.runOnUiThread { LifecycleTestActivity.content = null }
    }

    @Test
    fun leavingAnUnconfirmedWriteAfterRotationClearsEarlierHistory() {
        val pending = CompletableDeferred<MemoryChange>()
        controls.change = { pending.await() }
        editExam()
        compose.onNodeWithText("Aplicar corrección").performScrollTo().performClick()
        compose.waitUntil(5000) { compose.onNodeWithTag("content-loading").isDisplayed() }
        compose.runOnUiThread { compose.activity.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE }
        compose.waitUntil(5000) {
            compose.activity.resources.configuration.orientation == Configuration.ORIENTATION_LANDSCAPE &&
                compose.onNodeWithTag("content-loading").isDisplayed()
        }
        InstrumentationRegistry.getInstrumentation().sendKeyDownUpSync(KeyEvent.KEYCODE_BACK)
        compose.waitUntil(5000) { compose.onNodeWithTag("text-composer").isDisplayed() }
        compose.onNodeWithText(OLD_QUESTION).assertDoesNotExist()
        compose.onNodeWithText("Examen el martes.").assertDoesNotExist()
        pending.complete(MemoryChange.Confirmed(ChangeAction.Correct, 1))
        compose.waitForIdle()
        compose.onNodeWithText(OLD_QUESTION).assertDoesNotExist()
        assertEquals(1, controls.commands.size)
    }

    @Test
    fun correctionSurvivesRecreationAndStaysInManagementAfterConfirmation() {
        val pending = CompletableDeferred<MemoryChange>()
        controls.change = { pending.await() }
        editExam()
        compose.onNodeWithText("Aplicar corrección").performScrollTo().performClick()
        compose.onNodeWithText("Aplicar corrección").assertIsNotEnabled()
        compose.waitUntil(5000) { compose.onNodeWithTag("content-loading").isDisplayed() }
        compose.runOnUiThread { compose.activity.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE }
        compose.waitUntil(5000) {
            compose.activity.resources.configuration.orientation ==
                Configuration.ORIENTATION_LANDSCAPE
        }
        compose.waitUntil(5000) { compose.onNodeWithTag("content-loading").isDisplayed() }
        assertEquals(1, controls.commands.size)
        assertEquals(listOf("$CONTROL_ID-2"), controls.commands.single().memoryIds)
        captureBrandScreen(compose.activity, "kioku-correction-pending.png") { compose.onRoot().captureToImage() }
        pending.complete(MemoryChange.Confirmed(ChangeAction.Correct, 1))
        compose.waitUntil(5000) { compose.onNodeWithText("Recuerdo modificado").isDisplayed() }
        compose.onNodeWithText("Gestionar un recuerdo").assertIsDisplayed()
        compose.onNodeWithText(OLD_QUESTION).assertDoesNotExist()
        compose.onNodeWithText("Texto original").assertDoesNotExist()
    }

    @Test
    fun forgettingOneItemRequiresThePopupAndWaitsForConfirmedServerResult() {
        val pending = CompletableDeferred<MemoryChange>()
        controls.change = { pending.await() }
        compose
            .onAllNodesWithText("Olvidar")
            .onFirst()
            .performScrollTo()
            .performClick()
        compose.onNodeWithTag("forget-confirmation").assertIsDisplayed()
        assertEquals(0, controls.commands.size)
        captureBrandScreen(compose.activity, "kioku-forget-confirmation.png") {
            compose.onNodeWithTag("forget-confirmation").captureToImage()
        }
        compose.onNodeWithText("Sí, olvidar").performScrollTo().performClick()
        compose.waitUntil(5000) { controls.commands.size == 1 }
        compose.onNodeWithTag("forget-confirmation").assertDoesNotExist()
        compose.onNodeWithText("He olvidado «Película Loto.».").assertDoesNotExist()
        pending.complete(MemoryChange.Confirmed(ChangeAction.Forget, 1))
        compose.waitUntil(5000) { compose.onNodeWithText("Recuerdo borrado").isDisplayed() }
        compose.onNodeWithText("Gestionar un recuerdo").assertIsDisplayed()
        assertEquals(1, controls.commands.size)
        assertEquals(listOf("$CONTROL_ID-1"), controls.commands.single().memoryIds)
        assertEquals(ChangeAction.Forget, controls.commands.single().action)
        compose.onNodeWithText(OLD_QUESTION).assertDoesNotExist()
    }

    @Test
    fun eachMemoryHasItsOwnActionsAndOnlyTheSelectedMemoryReachesThePopup() {
        controls.change = { MemoryChange.Confirmed(ChangeAction.Forget, 1) }
        compose.onNodeWithText("Película Loto.").assertIsDisplayed()
        compose.onNodeWithText("Examen el martes.").assertIsDisplayed()
        compose.onNodeWithText("Leer el relato").assertDoesNotExist()
        compose.onNodeWithText("Olvidar este relato").assertDoesNotExist()
        assertEquals(2, compose.onAllNodesWithText("Corregir").fetchSemanticsNodes().size)
        assertEquals(2, compose.onAllNodesWithText("Olvidar").fetchSemanticsNodes().size)
        captureBrandScreen(compose.activity, "kioku-manage-items.png") { compose.onRoot().captureToImage() }
        compose
            .onNode(hasText("Olvidar") and memoryItemContaining("Examen el martes."))
            .performScrollTo()
            .performClick()
        compose.onNodeWithTag("forget-confirmation").assert(hasAnyDescendant(hasText("Examen el martes.")))
        compose
            .onNodeWithText(
                "Este recuerdo y sus copias en otros relatos dejarán de estar accesibles. " +
                    "Los demás datos se conservarán.",
            ).assertIsDisplayed()
        assertEquals(0, controls.commands.size)
        compose.onNodeWithText("Sí, olvidar").performScrollTo().performClick()
        compose.waitUntil(5000) { compose.onNodeWithText("Recuerdo borrado").isDisplayed() }
        assertEquals(1, controls.commands.size)
        assertEquals(listOf("$CONTROL_ID-2"), controls.commands.single().memoryIds)
    }

    @Test
    fun cancellingAfterRotationLeavesTheSourceAndSendsNoDeletion() {
        compose
            .onAllNodesWithText("Olvidar")
            .onFirst()
            .performScrollTo()
            .performClick()
        compose.onNodeWithTag("forget-confirmation").assertIsDisplayed()
        compose.runOnUiThread { compose.activity.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE }
        compose.waitUntil(5000) {
            compose.activity.resources.configuration.orientation == Configuration.ORIENTATION_LANDSCAPE &&
                compose.onNodeWithTag("forget-confirmation").isDisplayed()
        }
        compose.onNodeWithText("Cancelar").performScrollTo().performClick()
        compose.onNodeWithTag("forget-confirmation").assertDoesNotExist()
        compose.onNodeWithText("Película Loto.").performScrollTo().assertIsDisplayed()
        assertEquals(0, controls.commands.size)
    }

    @Test
    fun dismissingThePopupWithBackDoesNotDeleteOrLeaveTheSource() {
        compose
            .onAllNodesWithText("Olvidar")
            .onFirst()
            .performScrollTo()
            .performClick()
        compose.onNodeWithTag("forget-confirmation").assertIsDisplayed()
        InstrumentationRegistry.getInstrumentation().sendKeyDownUpSync(KeyEvent.KEYCODE_BACK)
        compose.onNodeWithTag("forget-confirmation").assertDoesNotExist()
        compose.onNodeWithText("Película Loto.").performScrollTo().assertIsDisplayed()
        assertEquals(0, controls.commands.size)
    }

    @Test
    fun failureKeepsTheDraftAndRecoveryUsesTheSameCommand() {
        controls.change = { MemoryChange.Failed(CaptureIssue.Unavailable) }
        editExam()
        compose.onNodeWithText("Aplicar corrección").performScrollTo().performClick()
        compose.onNodeWithText("Comprobar de nuevo").performScrollTo().assertIsDisplayed()
        compose.onNodeWithTag("correction-input").performScrollTo().assertIsDisplayed()
        controls.change = { MemoryChange.Confirmed(ChangeAction.Correct, 1) }
        compose.onNodeWithText("Comprobar de nuevo").performScrollTo().performClick()
        compose.waitUntil(5000) { compose.onNodeWithText("Recuerdo modificado").isDisplayed() }
        assertEquals(controls.commands[0], controls.commands[1])
    }

    @Test
    fun unclearCorrectionExplainsNoChangeAndKeepsTheEditorUsable() {
        val notice = "No he modificado el recuerdo. Reescribe la frase completa con las palabras separadas."
        controls.change = { MemoryChange.Clarification(notice) }
        editExam()
        compose.onNodeWithTag("correction-input").performTextReplacement("quiero jugary prender")
        compose.onNodeWithText("Aplicar corrección").performScrollTo().performClick()
        compose.onNodeWithText(notice).performScrollTo().assertIsDisplayed()
        compose.onNodeWithTag("correction-input").performScrollTo().assertTextContains("quiero jugary prender")
        compose.onNodeWithTag("correction-input").performTextReplacement("Mi examen es el sábado.")
        controls.change = { MemoryChange.Confirmed(ChangeAction.Correct, 1) }
        compose.onNodeWithText("Aplicar corrección").performScrollTo().performClick()
        compose.waitUntil(5000) { compose.onNodeWithText("Recuerdo modificado").isDisplayed() }
        assertEquals("Mi examen es el sábado.", controls.commands.last().correction)
        assertEquals(false, controls.commands[0].requestId == controls.commands[1].requestId)
    }

    @Test
    fun returningFromBackgroundCannotRedisplayARetiredSource() {
        editExam()
        compose.activityRule.scenario.moveToState(Lifecycle.State.CREATED)
        controls.revisionValue = 1
        controls.current = null
        compose.activityRule.scenario.moveToState(Lifecycle.State.RESUMED)
        compose.waitUntil(5000) { compose.onNodeWithText("Volver a cargar").isDisplayed() }
        compose.onNodeWithText("Examen el martes.").assertDoesNotExist()
        compose.onNodeWithTag("correction-input").assertDoesNotExist()
    }

    private fun editExam() {
        compose
            .onAllNodesWithText("Corregir")
            .onLast()
            .performScrollTo()
            .performClick()
        compose.onNodeWithTag("correction-input").performTextInput("Mi examen es el viernes.")
    }

    private fun awaitReady() {
        try {
            compose.waitUntil(5000) {
                compose.activity.hasWindowFocus() &&
                    compose.onAllNodes(hasTestTag("intent-Ask") and isEnabled()).fetchSemanticsNodes().isNotEmpty()
            }
        } catch (failure: ComposeTimeoutException) {
            throw AssertionError(
                "Host readiness: lifecycle=${compose.activity.lifecycle.currentState}; " +
                    "focus=${compose.activity.hasWindowFocus()}; revisionReads=${controls.revisionReads}",
                failure,
            )
        }
    }
}

private const val CONTROL_ID = "85091620-5b43-4a73-afb2-fb486322b07a"
private const val OLD_QUESTION = "¿Qué tengo pendiente?"

private class ControlNavigationFixture : MemoryControlRepository {
    var revisionReads = 0
    var revisionValue = 0L
    var current: EditableSource? =
        EditableSource(
            MemorySource(CONTROL_ID, "Película Loto. Examen el martes.", "2026-11-14"),
            "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            listOf(MemoryItem("$CONTROL_ID-1", "Película Loto."), MemoryItem("$CONTROL_ID-2", "Examen el martes.")),
            0,
        )
    val commands = mutableListOf<MemoryChangeCommand>()
    var change: suspend () -> MemoryChange = { MemoryChange.Confirmed(ChangeAction.Correct, 1) }

    override suspend fun details(id: String) = current

    override suspend fun revision(): Long {
        revisionReads++
        return revisionValue
    }

    override fun prepare(
        source: EditableSource,
        ids: List<String>,
        action: ChangeAction,
        correction: String?,
    ) = MemoryChangeCommand(
        "change-${commands.size}",
        source.source.id,
        source.version,
        ids,
        action,
        correction,
        "Europe/Madrid",
    )

    override suspend fun execute(command: MemoryChangeCommand): MemoryChange {
        commands.add(command)
        return change().also { if (it is MemoryChange.Confirmed) revisionValue = it.memoryRevision }
    }
}

private class ControlNavigationQueries : QueryRepository {
    var calls = 0

    override fun prepare(text: String) = QueryCommand("fixture-query", text)

    override suspend fun execute(command: QueryCommand): QueryOutcome {
        calls++
        return QueryOutcome.Reply(
            AnswerStatus.Answered,
            "Te apetecía ver Loto.",
            listOf(QueryReference(CONTROL_ID, "2026-11-14")),
        )
    }

    override suspend fun source(id: String) = MemorySource(CONTROL_ID, "Película Loto. Examen el martes.", "2026-11-14")
}
