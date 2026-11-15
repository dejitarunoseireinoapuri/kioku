package io.github.dejitarunoseireinoapuri.kioku

import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertTextContains
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
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
import androidx.compose.ui.test.performTextReplacement
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assume.assumeTrue
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TestRule
import org.junit.runners.model.Statement

/** Authorization is checked before opening the actual account; fixtures alone never opt in. */
class LiveWritingTest {
    @get:Rule(order = 0)
    val approval =
        TestRule { test, _ ->
            object : Statement() {
                override fun evaluate() {
                    assumeTrue(InstrumentationRegistry.getArguments().getString("liveWritingProject") == "kioku-9454f")
                    test.evaluate()
                }
            }
        }

    @get:Rule(order = 1)
    val compose = createAndroidComposeRule<MainActivity>()

    @Test
    fun unclearWritingCanBeRephrasedAndOneSharedFactCorrectedWithoutChangingTheOther() {
        compose.waitUntil(WRITING_TIMEOUT) {
            compose.onAllNodes(hasTestTag("intent-Tell") and isEnabled()).fetchSemanticsNodes().size == 1
        }
        compose.onNodeWithTag("intent-Tell").performClick()
        compose.onNodeWithTag("intent-Tell").assert(SemanticsMatcher.expectValue(SemanticsProperties.Selected, true))
        send("En la prueba K4texto1834 quiero jugary prender.")
        waitForRewrite()
        compose.onNodeWithContentDescription("Gestionar este recuerdo").assertDoesNotExist()
        send(WRITING_STORY)
        compose.waitUntil(WRITING_TIMEOUT) {
            compose.onAllNodesWithContentDescription("Gestionar este recuerdo").fetchSemanticsNodes().size == 1
        }
        compose.onNodeWithContentDescription("Gestionar este recuerdo").performScrollTo().performClick()
        compose.onNodeWithText("Gestionar").performClick()
        compose.waitUntil(WRITING_TIMEOUT) { compose.onAllNodesWithText("Corregir").fetchSemanticsNodes().size == 2 }
        compose.onNode(hasText("Corregir") and memoryItemContaining("vivero")).performScrollTo().performClick()
        compose.onNodeWithTag("correction-input").performTextInput("quiero jugary prender")
        compose.onNodeWithText("Aplicar corrección").performScrollTo().performClick()
        waitForRewrite(noChange = true)
        compose.onNodeWithTag("correction-input").performScrollTo().assertTextContains("quiero jugary prender")
        compose.onNodeWithTag("correction-input").performTextReplacement(WRITING_CORRECTION)
        compose.onNodeWithText("Aplicar corrección").performScrollTo().performClick()
        compose.waitUntil(WRITING_TIMEOUT) {
            compose.onAllNodesWithText("Recuerdo modificado").fetchSemanticsNodes().isNotEmpty() &&
                compose.onAllNodesWithText("Corregir").fetchSemanticsNodes().size == 2
        }
        compose.onNode(hasText("Corregir") and memoryItemContaining("planetario")).performScrollTo().assertIsDisplayed()
        compose.onNode(hasText("Corregir") and memoryItemContaining("cómic")).performScrollTo().assertIsDisplayed()
    }

    private fun send(text: String) {
        compose.waitUntil(WRITING_TIMEOUT) {
            compose.onAllNodes(hasTestTag("text-composer") and isEnabled()).fetchSemanticsNodes().size == 1
        }
        compose.onNodeWithTag("text-composer").performTextInput(text)
        compose.onNodeWithTag("text-composer").performImeAction()
    }

    private fun waitForRewrite(noChange: Boolean = false) {
        val notice =
            SemanticsMatcher("Actionable rewrite notice") { node ->
                val text =
                    node.config
                        .getOrNull(SemanticsProperties.Text)
                        ?.joinToString { it.text }
                        .orEmpty()
                Regex("reescr[ií]b|reformula|palabras separadas|frase completa", RegexOption.IGNORE_CASE)
                    .containsMatchIn(text) && (!noChange || text.contains("No he modificado el recuerdo"))
            }
        compose.waitUntil(WRITING_TIMEOUT) { compose.onAllNodes(notice).fetchSemanticsNodes().isNotEmpty() }
        compose.onNode(notice).performScrollTo().assertIsDisplayed()
    }
}

private const val WRITING_TIMEOUT = 195000L
private const val WRITING_STORY =
    "En la prueba K4texto1834 quiero visitar el vivero el 20 de diciembre de 2026 " +
        "y leer un cómic el 21 de diciembre de 2026."
private const val WRITING_CORRECTION =
    "En la prueba K4texto1834 quiero visitar el planetario el 20 de diciembre de 2026."
