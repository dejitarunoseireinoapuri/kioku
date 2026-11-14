package io.github.dejitarunoseireinoapuri.kioku

import android.content.pm.ActivityInfo
import android.content.res.Configuration
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.ComposeTimeoutException
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.assertTextContains
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.isDisplayed
import androidx.compose.ui.test.isEnabled
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onFirst
import androidx.compose.ui.test.onLast
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performImeAction
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performTextInput
import androidx.lifecycle.Lifecycle
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
        val source = "Ver texto original 1 · 2026-11-14"
        try {
            compose.waitUntil(5000) { compose.onAllNodesWithText(source).fetchSemanticsNodes().isNotEmpty() }
        } catch (failure: ComposeTimeoutException) {
            captureBrandScreen(compose.activity, "kioku-control-failure.png") { compose.onRoot().captureToImage() }
            throw AssertionError(
                "Source not displayed; query calls=${queries.calls}; revision reads=${controls.revisionReads}",
                failure,
            )
        }
        compose.onNodeWithText(source).performScrollTo().performClick()
        compose.waitUntil(5000) { compose.onNodeWithText("Gestionar").isDisplayed() }
        compose.onNodeWithText("Gestionar").performClick()
        compose.waitUntil(5000) {
            compose.onAllNodes(hasText("Corregir este dato") and isEnabled()).fetchSemanticsNodes().size ==
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
    fun correctionSurvivesRecreationAndClearsOldConversationOnlyAfterConfirmation() {
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
        compose.waitUntil(5000) { compose.onNodeWithText("Dato corregido.").isDisplayed() }
        compose.onNodeWithText(OLD_QUESTION).assertDoesNotExist()
        compose.onNodeWithText("Texto original").assertDoesNotExist()
    }

    @Test
    fun forgettingOneItemIsImmediateInIntentButWaitsForConfirmedServerResult() {
        controls.change = { MemoryChange.Confirmed(ChangeAction.Forget, 1) }
        compose
            .onAllNodesWithText("Olvidar este dato")
            .onFirst()
            .performScrollTo()
            .performClick()
        compose.waitUntil(5000) { compose.onNodeWithText("He olvidado lo que has seleccionado.").isDisplayed() }
        assertEquals(1, controls.commands.size)
        assertEquals(listOf("$CONTROL_ID-1"), controls.commands.single().memoryIds)
        assertEquals(ChangeAction.Forget, controls.commands.single().action)
        compose.onNodeWithText(OLD_QUESTION).assertDoesNotExist()
    }

    @Test
    fun fullTextWithdrawalHasExplicitScopeAndUsesOneCommand() {
        controls.change = { MemoryChange.Confirmed(ChangeAction.Forget, 1) }
        captureBrandScreen(compose.activity, "kioku-source-controls.png") { compose.onRoot().captureToImage() }
        compose.onNodeWithText("Olvidar todo este texto y sus recuerdos").performScrollTo().performClick()
        compose.waitUntil(5000) { compose.onNodeWithText("He olvidado lo que has seleccionado.").isDisplayed() }
        assertEquals(1, controls.commands.size)
        assertEquals(
            2,
            controls.commands
                .single()
                .memoryIds.size,
        )
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
        compose.waitUntil(5000) { compose.onNodeWithText("Dato corregido.").isDisplayed() }
        assertEquals(controls.commands[0], controls.commands[1])
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
            .onAllNodesWithText("Corregir este dato")
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
