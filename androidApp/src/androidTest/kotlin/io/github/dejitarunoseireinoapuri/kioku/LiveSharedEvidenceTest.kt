package io.github.dejitarunoseireinoapuri.kioku

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

/** An explicit project guard runs before the real activity; ordinary suites never access production. */
class LiveSharedEvidenceTest {
    @get:Rule(order = 0)
    val approval =
        TestRule { test, _ ->
            object : Statement() {
                override fun evaluate() {
                    assumeTrue(
                        InstrumentationRegistry.getArguments().getString("liveSharedEvidenceProject") == "kioku-9454f",
                    )
                    test.evaluate()
                }
            }
        }

    @get:Rule(order = 1)
    val compose = createAndroidComposeRule<MainActivity>()

    @Test
    fun forgettingOneOfTwoDatedPlansKeepsTheOtherAndItsDate() {
        compose.waitUntil(30_000) {
            compose.onAllNodes(hasTestTag("intent-Tell") and isEnabled()).fetchSemanticsNodes().isNotEmpty()
        }
        compose.onNodeWithTag("intent-Tell").performClick()
        compose.onNodeWithTag("text-composer").performTextInput(SHARED_STORY)
        compose.onNodeWithTag("text-composer").performImeAction()
        compose.waitUntil(SHARED_TIMEOUT) {
            compose.onAllNodesWithContentDescription("Gestionar este recuerdo").fetchSemanticsNodes().size == 1
        }
        compose.onNodeWithContentDescription("Gestionar este recuerdo").performScrollTo().performClick()
        click("Gestionar")
        compose.waitUntil(SHARED_TIMEOUT) { compose.onAllNodesWithText("Corregir").fetchSemanticsNodes().size == 2 }
        selectForget()
        click("Cancelar")
        compose.onNodeWithText("Sí, olvidar").assertDoesNotExist()
        selectForget()
        click("Sí, olvidar")
        compose.waitUntil(SHARED_TIMEOUT) {
            compose.onAllNodesWithText("He olvidado «", substring = true).fetchSemanticsNodes().isNotEmpty()
        }
        verifyQueries()
    }

    private fun selectForget() {
        compose.onNode(hasText("Olvidar") and memoryItemContaining("cerámica")).performScrollTo().performClick()
    }

    private fun click(text: String) {
        compose.waitUntil(SHARED_TIMEOUT) { compose.onAllNodesWithText(text).fetchSemanticsNodes().isNotEmpty() }
        if (!compose.onNodeWithText(text).isDisplayed()) compose.onNodeWithText(text).performScrollTo()
        compose.onNodeWithText(text).performClick()
    }

    private fun verifyQueries() =
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
            val missing = reply(queries, "En la prueba K4hf7029, ¿cuándo iré a cerámica K4hf7029?")
            assertEquals(AnswerStatus.NotFound, missing.status)
            val kept = reply(queries, "En la prueba K4hf7029, ¿cuándo visitaré el acuario K4hf7029?")
            assertEquals(AnswerStatus.Answered, kept.status)
            assertTrue(kept.text.contains("20"))
            assertTrue(kept.text.contains("diciembre", ignoreCase = true))
            assertEquals(1, kept.sources.size)
        }

    private suspend fun reply(
        queries: NativeQueryRepository,
        question: String,
    ): QueryOutcome.Reply {
        val result = queries.execute(queries.prepare(question))
        assertTrue(result is QueryOutcome.Reply)
        return result as QueryOutcome.Reply
    }
}

private const val SHARED_TIMEOUT = 195000L
private const val SHARED_STORY =
    "En la prueba K4hf7029 iré a cerámica K4hf7029 el 18 de diciembre de 2026 " +
        "y visitaré el acuario K4hf7029 el 20 de diciembre de 2026."
