package io.github.dejitarunoseireinoapuri.kioku

import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.hasTestTag
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
import androidx.compose.ui.test.performTextInput
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Assume.assumeTrue
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TestRule
import org.junit.runners.model.Statement

/** The live opt-in is evaluated before MainActivity opens the real account. */
class LiveAnswerPerspectiveTest {
    @get:Rule(order = 0)
    val approval =
        TestRule { test, _ ->
            object : Statement() {
                override fun evaluate() {
                    val project = InstrumentationRegistry.getArguments().getString("livePerspectiveProject")
                    assumeTrue(project == "kioku-9454f")
                    test.evaluate()
                }
            }
        }

    @get:Rule(order = 1)
    val compose = createAndroidComposeRule<MainActivity>()

    @Test
    fun theAppAnswersYouWhileBothManagementReadsRemainMyOwnMemory() {
        visible("Explicar")
        compose.onNodeWithText("Explicar").performClick()
        send("En la prueba K4tu1534 quiero visitar el vivero esta tarde.")
        openManagement()
        assertManagementPerspective()
        compose.onNodeWithContentDescription("Volver").performClick()
        selectAsk()
        send("En la prueba K4tu1534, ¿qué quiero hacer hoy?")
        compose.waitUntil(PERSPECTIVE_TIMEOUT) {
            compose.onAllNodesWithContentDescription("Gestionar este recuerdo").fetchSemanticsNodes().size == 1 &&
                compose
                    .onAllNodesWithText("vivero", substring = true, ignoreCase = true)
                    .fetchSemanticsNodes()
                    .isNotEmpty()
        }
        val answer =
            compose
                .onAllNodesWithText("vivero", substring = true, ignoreCase = true)
                .fetchSemanticsNodes()
                .single()
                .config[SemanticsProperties.Text]
                .joinToString { it.text }
        assertTrue(answer.contains("vivero", true))
        assertSecondPerson(answer)
        compose.onNodeWithText("Ver texto original", substring = true).assertDoesNotExist()
        openManagement()
        assertManagementPerspective()
    }

    private fun send(text: String) {
        compose.waitUntil(PERSPECTIVE_TIMEOUT) {
            compose.onAllNodes(hasTestTag("text-composer") and isEnabled()).fetchSemanticsNodes().size == 1
        }
        compose.onNodeWithTag("text-composer").performTextInput(text)
        compose.onNodeWithTag("text-composer").performImeAction()
    }

    private fun selectAsk() {
        compose.waitUntil(PERSPECTIVE_TIMEOUT) {
            compose.onAllNodes(hasTestTag("intent-Ask") and isEnabled()).fetchSemanticsNodes().size == 1
        }
        compose.onNodeWithTag("intent-Ask").performClick()
        compose.onNodeWithTag("intent-Ask").assert(SemanticsMatcher.expectValue(SemanticsProperties.Selected, true))
    }

    private fun openManagement() {
        compose.waitUntil(PERSPECTIVE_TIMEOUT) {
            compose.onAllNodesWithContentDescription("Gestionar este recuerdo").fetchSemanticsNodes().size == 1
        }
        compose.onNodeWithContentDescription("Gestionar este recuerdo").performScrollTo().performClick()
        compose.onNodeWithText("Gestionar").performClick()
        visible("Corregir")
    }

    private fun assertManagementPerspective() {
        val memory =
            compose
                .onAllNodesWithText("quiero", substring = true, ignoreCase = true)
                .fetchSemanticsNodes()
                .single()
                .config[SemanticsProperties.Text]
                .joinToString { it.text }
        assertTrue(memory.contains("vivero", true))
        assertFalse(Regex("\\bquieres\\b", RegexOption.IGNORE_CASE).containsMatchIn(memory))
    }

    private fun assertSecondPerson(answer: String) {
        assertTrue("The cited plan must address its owner in second person", hasSecondPerson(answer))
        assertFalse("The assistant must not take ownership of the owner's plan", hasFirstPerson(answer))
    }

    private fun hasSecondPerson(text: String) =
        Regex(
            """\b(?:quieres|querías|tienes|tenías|planeas|planeabas)\b""",
            RegexOption.IGNORE_CASE,
        ).containsMatchIn(text)

    private fun hasFirstPerson(text: String) =
        Regex("""\b(?:quiero|quería|tengo|tenía|planeo|planeaba)\b""", RegexOption.IGNORE_CASE).containsMatchIn(text)

    private fun visible(text: String) {
        compose.waitUntil(PERSPECTIVE_TIMEOUT) { compose.onAllNodesWithText(text).fetchSemanticsNodes().isNotEmpty() }
    }
}

private const val PERSPECTIVE_TIMEOUT = 195000L
