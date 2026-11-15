package io.github.dejitarunoseireinoapuri.kioku

import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.isDisplayed
import androidx.compose.ui.test.isEnabled
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onFirst
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performImeAction
import androidx.compose.ui.test.performScrollTo
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

/** Explicit production opt-in; the outer rule prevents opening a real session in ordinary suites. */
class LiveSourceControlTest {
    @get:Rule(order = 0)
    val approval =
        TestRule { test, _ ->
            object : Statement() {
                override fun evaluate() {
                    assumeTrue(
                        InstrumentationRegistry.getArguments().getString("liveSourceControlProject") == "kioku-9454f",
                    )
                    test.evaluate()
                }
            }
        }

    @get:Rule(order = 1)
    val compose = createAndroidComposeRule<MainActivity>()

    @Test
    fun syntheticSourceCanBeCorrectedAndForgottenThroughTheRealAndroidBoundary() {
        awaitReady()
        send(STORY)
        savedVisible()
        compose.onNodeWithContentDescription("Gestionar este recuerdo").performScrollTo().performClick()
        compose.onNodeWithText("Gestionar").performClick()
        val movie = memoryItemContaining("Loto")
        compose.waitUntil(20_000) {
            compose.onAllNodes(hasText("Corregir") and movie).fetchSemanticsNodes().size == 1
        }
        compose.onNode(hasText("Corregir") and movie).performScrollTo().performClick()
        compose.onNodeWithTag("correction-input").performTextInput(CORRECTION)
        compose.onNodeWithText("Aplicar corrección").performScrollTo().performClick()
        waitVisible("Recuerdo modificado")
        compose.onNodeWithContentDescription("Volver").performClick()
        awaitReady()
        compose.onNodeWithTag("intent-Ask").performClick()
        send("En la prueba K4farol8254, que pelicula quiero ver?")
        compose.waitUntil(LIVE_TIMEOUT) {
            compose.onAllNodesWithText("Ver texto original", substring = true).fetchSemanticsNodes().isNotEmpty()
        }
        assertTrue(compose.onAllNodesWithText("Niebla", substring = true).fetchSemanticsNodes().isNotEmpty())
        compose
            .onAllNodesWithText("Ver texto original", substring = true)
            .onFirst()
            .performScrollTo()
            .performClick()
        waitVisible("Gestionar")
        compose.onNodeWithText("Gestionar").performClick()
        waitVisible("Olvidar")
        compose.onNodeWithText("Olvidar").performScrollTo().performClick()
        waitVisible("Sí, olvidar")
        compose.onNodeWithText("Sí, olvidar").performScrollTo().performClick()
        compose.waitUntil(LIVE_TIMEOUT) {
            compose.onAllNodesWithText("Recuerdo borrado").fetchSemanticsNodes().isNotEmpty()
        }
        verifyCurrentEvidence()
    }

    private fun verifyCurrentEvidence() =
        runBlocking {
            val app = FirebaseApp.getInstance("kioku")
            check(app.options.projectId == "kioku-9454f")
            val port =
                AndroidMemoryPort(FirebaseAuth.getInstance(app), FirebaseFunctions.getInstance(app, "europe-west1"))
            val queries = NativeQueryRepository(port)
            val forgotten = queries.execute(queries.prepare("En la prueba K4farol8254, que pelicula quiero ver?"))
            assertTrue(forgotten is QueryOutcome.Reply)
            assertEquals(AnswerStatus.NotFound, (forgotten as QueryOutcome.Reply).status)
            val kept = queries.execute(queries.prepare("En la prueba K4farol8254, cuando es el examen de japones?"))
            assertTrue(kept is QueryOutcome.Reply)
            val reply = kept as QueryOutcome.Reply
            assertEquals(AnswerStatus.Answered, reply.status)
            assertTrue(reply.text.contains("24"))
        }

    private fun awaitReady() {
        compose.waitUntil(30_000) {
            compose.activity.hasWindowFocus() &&
                compose.onAllNodes(hasTestTag("text-composer") and isEnabled()).fetchSemanticsNodes().isNotEmpty()
        }
    }

    private fun savedVisible() {
        compose.waitUntil(120_000) { compose.onNodeWithContentDescription("Gestionar este recuerdo").isDisplayed() }
    }

    private fun send(text: String) {
        compose.onNodeWithTag("text-composer").performTextInput(text)
        compose.onNodeWithTag("text-composer").performImeAction()
    }

    private fun waitVisible(text: String) {
        compose.waitUntil(LIVE_TIMEOUT) { compose.onAllNodesWithText(text).fetchSemanticsNodes().isNotEmpty() }
        if (!compose.onNodeWithText(text).isDisplayed()) compose.onNodeWithText(text).performScrollTo()
        compose.waitUntil(5000) { compose.onNodeWithText(text).isDisplayed() }
    }
}

private const val LIVE_TIMEOUT = 195000L
private const val STORY =
    "En la prueba K4farol8254 quiero ver la pelicula Loto. " +
        "En la prueba K4farol8254 el examen de japones es el 24 de noviembre de 2026."
private const val CORRECTION = "En la prueba K4farol8254 quiero ver la pelicula Niebla."
