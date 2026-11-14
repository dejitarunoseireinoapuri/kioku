package io.github.dejitarunoseireinoapuri.kioku

import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.isDisplayed
import androidx.compose.ui.test.isEnabled
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onAllNodesWithText
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

/** Only a separately approved production run may open the owner's real session. */
class LiveConversationTest {
    @get:Rule(order = 0)
    val approval =
        TestRule { test, _ ->
            object : Statement() {
                override fun evaluate() {
                    assumeTrue(
                        InstrumentationRegistry.getArguments().getString("liveConversationProject") == "kioku-9454f",
                    )
                    test.evaluate()
                }
            }
        }

    @get:Rule(order = 1)
    val compose = createAndroidComposeRule<MainActivity>()

    @Test
    fun naturalChangesAndAnAcceptedOfferCrossTheRealProtectedAndroidBoundary() {
        ready()
        send(
            "En la prueba K4nube9261 quiero ver la película Loto. " +
                "En la prueba K4nube9261 el examen de japonés es el 24 de noviembre de 2026.",
        )
        savedVisible()
        ready()
        compose.onNodeWithTag("intent-Ask").performClick()
        send("En la prueba K4nube9261, corrige la fecha del examen de japonés: es el 26 de noviembre de 2026.")
        visible("Dato corregido.")
        ready()
        send("En la prueba K4nube9261 me apetece visitar el museo Nube.")
        click("Sí, recuérdalo")
        savedVisible()
        ready()
        send("Olvida lo del museo Nube de la prueba K4nube9261.")
        click("Sí, borrar")
        compose.waitUntil(CONVERSATION_LIVE_TIMEOUT) {
            compose.onAllNodesWithText("He olvidado «", substring = true).fetchSemanticsNodes().isNotEmpty()
        }
        verifyEvidence()
    }

    private fun verifyEvidence() =
        runBlocking {
            val app = FirebaseApp.getInstance("kioku")
            check(app.options.projectId == "kioku-9454f")
            val repository =
                NativeQueryRepository(
                    AndroidMemoryPort(
                        FirebaseAuth.getInstance(app),
                        FirebaseFunctions.getInstance(app, "europe-west1"),
                    ),
                )
            val date =
                repository.execute(
                    repository.prepare("En la prueba K4nube9261, ¿cuándo es el examen de japonés?"),
                )
            assertTrue(date is QueryOutcome.Reply)
            assertEquals(AnswerStatus.Answered, (date as QueryOutcome.Reply).status)
            assertTrue(date.text.contains("26"))
            val kept = repository.execute(repository.prepare("En la prueba K4nube9261, ¿qué película quiero ver?"))
            assertTrue(kept is QueryOutcome.Reply)
            assertEquals(AnswerStatus.Answered, (kept as QueryOutcome.Reply).status)
            assertTrue(kept.text.contains("Loto"))
            val forgotten =
                repository.execute(
                    repository.prepare("En la prueba K4nube9261, ¿qué museo quiero visitar?"),
                )
            assertTrue(forgotten is QueryOutcome.Reply)
            assertEquals(AnswerStatus.NotFound, (forgotten as QueryOutcome.Reply).status)
        }

    private fun ready() {
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

    private fun click(text: String) {
        visible(text)
        compose.onNodeWithText(text).performClick()
    }

    private fun visible(text: String) {
        compose.waitUntil(CONVERSATION_LIVE_TIMEOUT) {
            compose.onAllNodesWithText(text).fetchSemanticsNodes().isNotEmpty()
        }
        if (!compose.onNodeWithText(text).isDisplayed()) compose.onNodeWithText(text).performScrollTo()
        compose.waitUntil(5000) { compose.onNodeWithText(text).isDisplayed() }
    }
}

private const val CONVERSATION_LIVE_TIMEOUT = 195000L
