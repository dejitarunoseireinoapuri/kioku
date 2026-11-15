package io.github.dejitarunoseireinoapuri.kioku

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.isDisplayed
import androidx.compose.ui.test.isEnabled
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onAllNodesWithContentDescription
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performImeAction
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performScrollToNode
import androidx.compose.ui.test.performTextInput
import androidx.test.platform.app.InstrumentationRegistry
import com.google.firebase.FirebaseApp
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.functions.FirebaseFunctions
import io.github.dejitarunoseireinoapuri.kioku.data.NativeQueryRepository
import io.github.dejitarunoseireinoapuri.kioku.domain.AnswerStatus
import io.github.dejitarunoseireinoapuri.kioku.domain.QueryOutcome
import io.github.dejitarunoseireinoapuri.kioku.platform.AndroidMemoryPort
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Assume.assumeTrue
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TestRule
import org.junit.runners.model.Statement

/** Separately authorized real-project smoke; ordinary suites skip before opening the account. */
class LiveManagementSessionTest {
    @get:Rule(order = 0)
    val approval =
        TestRule { test, _ ->
            object : Statement() {
                override fun evaluate() {
                    assumeTrue(
                        InstrumentationRegistry.getArguments().getString("liveManagementProject") == "kioku-9454f",
                    )
                    test.evaluate()
                }
            }
        }

    @get:Rule(order = 1)
    val compose = createAndroidComposeRule<MainActivity>()

    @Test
    fun aCorrectedAndForgottenStoryKeepsItsOriginalFeedAndContinuesWithCurrentMemories() {
        awaitReady()
        compose.onNodeWithTag("text-composer").performTextInput(MANAGEMENT_STORY)
        compose.onNodeWithTag("text-composer").performImeAction()
        compose.waitUntil(LIVE_MANAGEMENT_TIMEOUT) {
            compose.onAllNodesWithContentDescription("Gestionar este recuerdo").fetchSemanticsNodes().isNotEmpty()
        }
        compose.onNodeWithContentDescription("Gestionar este recuerdo").performScrollTo().performClick()
        click("Gestionar")
        compose.waitUntil(LIVE_MANAGEMENT_TIMEOUT) {
            compose.onAllNodesWithText("Corregir").fetchSemanticsNodes().size ==
                2
        }
        compose.onNode(hasText("Corregir") and memoryItemContaining("planetario")).performScrollTo().performClick()
        compose.onNodeWithTag("correction-input").performTextInput(MANAGEMENT_CORRECTION)
        click("Aplicar corrección")
        visible("Recuerdo modificado")
        readyItems(2)
        compose.onNode(hasText("Olvidar") and memoryItemContaining("encuadernación")).performScrollTo().performClick()
        click("Sí, olvidar")
        visible("Recuerdo borrado")
        readyItems(1)
        assertTrue(compose.onAllNodesWithText("21", substring = true).fetchSemanticsNodes().isNotEmpty())
        compose.onNodeWithText("Gestionar un recuerdo").assertIsDisplayed()
        compose.onNodeWithTag("text-composer").assertDoesNotExist()
        compose.onNodeWithContentDescription("Volver").performClick()
        awaitInput()
        compose.onNodeWithTag("conversation-messages").performScrollToNode(hasText(MANAGEMENT_STORY))
        compose.onNodeWithText(MANAGEMENT_STORY).assertIsDisplayed()
        compose.onNodeWithText(MANAGEMENT_STORY).assertIsNotEnabled()
        compose.onNodeWithContentDescription("Gestionar este recuerdo").assertDoesNotExist()
        verifyMemory()
    }

    private fun awaitReady() {
        visible("Explicar")
        click("Explicar")
        awaitInput()
    }

    private fun awaitInput() {
        compose.waitUntil(LIVE_MANAGEMENT_TIMEOUT) {
            compose.onAllNodes(hasTestTag("text-composer") and isEnabled()).fetchSemanticsNodes().size == 1
        }
    }

    private fun readyItems(expected: Int) {
        compose.waitUntil(LIVE_MANAGEMENT_TIMEOUT) {
            compose.onAllNodesWithTag("content-loading").fetchSemanticsNodes().isEmpty() &&
                compose.onAllNodesWithText("Corregir").fetchSemanticsNodes().size == expected
        }
    }

    private fun verifyMemory() =
        runBlocking {
            val app = FirebaseApp.getInstance("kioku")
            check(app.options.projectId == "kioku-9454f")
            val queries =
                NativeQueryRepository(
                    AndroidMemoryPort(
                        FirebaseAuth.getInstance(app),
                        FirebaseFunctions.getInstance(app, "europe-west1"),
                    ),
                )
            val kept =
                queries.execute(
                    queries.prepare("En la prueba K4mg8144, ¿cuándo quiero visitar el planetario K4mg8144?"),
                )
            assertTrue(kept is QueryOutcome.Reply)
            assertEquals(AnswerStatus.Answered, (kept as QueryOutcome.Reply).status)
            assertTrue(kept.text.contains("21"))
            val absent =
                queries.execute(
                    queries.prepare("En la prueba K4mg8144, ¿cuándo iré a encuadernación K4mg8144?"),
                )
            assertTrue(absent is QueryOutcome.Reply)
            assertEquals(AnswerStatus.NotFound, (absent as QueryOutcome.Reply).status)
        }

    private fun click(text: String) {
        visible(text)
        compose.onNodeWithText(text).performClick()
    }

    private fun visible(text: String) {
        compose.waitUntil(
            LIVE_MANAGEMENT_TIMEOUT,
        ) { compose.onAllNodesWithText(text).fetchSemanticsNodes().isNotEmpty() }
        if (!compose.onNodeWithText(text).isDisplayed()) compose.onNodeWithText(text).performScrollTo()
    }
}

private const val LIVE_MANAGEMENT_TIMEOUT = 195000L
private const val MANAGEMENT_STORY =
    "En la prueba K4mg8144 quiero visitar el planetario K4mg8144 el 20 de diciembre de 2026. " +
        "En la prueba K4mg8144 iré a encuadernación K4mg8144 el 18 de diciembre de 2026."
private const val MANAGEMENT_CORRECTION =
    "En la prueba K4mg8144 quiero visitar el planetario K4mg8144 el 21 de diciembre de 2026."
