package io.github.dejitarunoseireinoapuri.kioku

import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.isDisplayed
import androidx.compose.ui.test.isEnabled
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onAllNodesWithContentDescription
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
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Assume.assumeTrue
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TestRule
import org.junit.runners.model.Statement
import java.time.LocalDate
import java.time.ZoneId

/** The outer project guard prevents all real account access in ordinary suites. */
class LiveAtomicCaptureTest {
    @get:Rule(order = 0)
    val approval =
        TestRule { test, _ ->
            object : Statement() {
                override fun evaluate() {
                    assumeTrue(InstrumentationRegistry.getArguments().getString("liveAtomicProject") == "kioku-9454f")
                    test.evaluate()
                }
            }
        }

    @get:Rule(order = 1)
    val compose = createAndroidComposeRule<MainActivity>()

    @Test
    fun sharedSentenceKeepsTwoIndependentPlansAndOnlyForgetsTheChosenOne() {
        visible("Explicar")
        compose.onNodeWithText("Explicar").performClick()
        awaitInput()
        compose.onNodeWithTag("text-composer").performTextInput(ATOMIC_STORY)
        compose.onNodeWithTag("text-composer").performImeAction()
        compose.waitUntil(ATOMIC_TIMEOUT) {
            compose.onAllNodesWithContentDescription("Gestionar este recuerdo").fetchSemanticsNodes().isNotEmpty()
        }
        compose.onNodeWithContentDescription("Gestionar este recuerdo").performScrollTo().performClick()
        click("Gestionar")
        readyItems(2)
        assertIndependentLabels()
        compose.onNode(hasText("Olvidar") and memoryItemContaining("cómic")).performScrollTo().performClick()
        click("Sí, olvidar")
        visible("Recuerdo borrado")
        readyItems(1)
        assertTrue(compose.onAllNodesWithText("vivero", substring = true).fetchSemanticsNodes().isNotEmpty())
        compose.onNodeWithText("cómic", substring = true).assertDoesNotExist()
        compose.onNodeWithText("Gestionar un recuerdo").assertIsDisplayed()
        compose.onNodeWithContentDescription("Volver").performClick()
        awaitInput()
        compose.onNodeWithTag("conversation-messages").performScrollToNode(hasText(ATOMIC_STORY))
        compose.onNodeWithText(ATOMIC_STORY).assertIsNotEnabled()
        compose.onNodeWithContentDescription("Gestionar este recuerdo").assertDoesNotExist()
        verifyMemory()
    }

    private fun assertIndependentLabels() {
        val first = compose.onAllNodesWithText("vivero", substring = true).fetchSemanticsNodes()
        val second = compose.onAllNodesWithText("cómic", substring = true).fetchSemanticsNodes()
        assertEquals(1, first.size)
        assertEquals(1, second.size)
        val firstText = first.single().config[SemanticsProperties.Text].joinToString { it.text }
        val secondText = second.single().config[SemanticsProperties.Text].joinToString { it.text }
        assertFalse(firstText.contains("cómic", true))
        assertFalse(secondText.contains("vivero", true))
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
                queries.execute(queries.prepare("En la prueba K4at9501, ¿cuándo quiero visitar el vivero?"))
            assertTrue(kept is QueryOutcome.Reply)
            assertEquals(AnswerStatus.Answered, (kept as QueryOutcome.Reply).status)
            val today = LocalDate.now(ZoneId.systemDefault()).dayOfMonth
            assertTrue(Regex("\\b$today\\b").containsMatchIn(kept.text))
            val absent =
                queries.execute(queries.prepare("En la prueba K4at9501, ¿cuándo quiero leer un cómic?"))
            assertTrue(absent is QueryOutcome.Reply)
            assertEquals(AnswerStatus.NotFound, (absent as QueryOutcome.Reply).status)
        }

    private fun awaitInput() {
        compose.waitUntil(ATOMIC_TIMEOUT) {
            compose.onAllNodes(hasTestTag("text-composer") and isEnabled()).fetchSemanticsNodes().size == 1
        }
    }

    private fun readyItems(expected: Int) {
        compose.waitUntil(ATOMIC_TIMEOUT) {
            compose.onAllNodesWithText("Corregir").fetchSemanticsNodes().size == expected
        }
    }

    private fun click(text: String) {
        visible(text)
        compose.onNodeWithText(text).performClick()
    }

    private fun visible(text: String) {
        compose.waitUntil(ATOMIC_TIMEOUT) { compose.onAllNodesWithText(text).fetchSemanticsNodes().isNotEmpty() }
        if (!compose.onNodeWithText(text).isDisplayed()) compose.onNodeWithText(text).performScrollTo()
    }
}

private const val ATOMIC_TIMEOUT = 195000L
private const val ATOMIC_STORY =
    "En la prueba K4at9501 quiero visitar el vivero esta tarde y leer un cómic mañana."
