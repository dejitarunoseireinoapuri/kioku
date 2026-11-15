package io.github.dejitarunoseireinoapuri.kioku

import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.isDisplayed
import androidx.compose.ui.test.isEnabled
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onAllNodesWithContentDescription
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onFirst
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

/** Default suites must skip before opening the real account; production requires separate authorization. */
class LiveRepeatedForgetTest {
    @get:Rule(order = 0)
    val approval =
        TestRule { test, _ ->
            object : Statement() {
                override fun evaluate() {
                    assumeTrue(
                        InstrumentationRegistry.getArguments().getString("liveRepeatedProject") == "kioku-9454f",
                    )
                    test.evaluate()
                }
            }
        }

    @get:Rule(order = 1)
    val compose = createAndroidComposeRule<MainActivity>()

    @Test
    fun repeatedFactsDisappearFromAllStoriesByTextAndBySourceWithoutLosingOtherFacts() {
        ready()
        seedStories()
        compose.onNodeWithTag("intent-Ask").performClick()
        send("Olvida que en la prueba K4eco3746 yo quiero ver la película Farol K4eco3746.")
        confirmForget("Farol")
        verifyMovieRemoval()
        forgetExamCopiesFromSource()
        verifyExamRemoval()
    }

    private fun seedStories() {
        val stories =
            listOf(
                "En la prueba K4eco3746 quiero ver la película Farol K4eco3746. " +
                    "En la prueba K4eco3746 el simulacro de japonés K4eco3746 es el 27 de noviembre de 2026.",
                "En la prueba K4eco3746 tengo pendiente ver la película Farol K4eco3746. " +
                    "En la prueba K4eco3746 tengo el simulacro de japonés K4eco3746 el 27 de noviembre de 2026. " +
                    "En la prueba K4eco3746 me gustan las peras.",
                "En la prueba K4eco3746 mi hermano quiere ver la película Farol K4eco3746.",
            )
        stories.forEachIndexed { index, story ->
            ready()
            send(story)
            compose.waitUntil(REPEATED_LIVE_TIMEOUT) {
                compose.onAllNodesWithContentDescription("Gestionar este recuerdo").fetchSemanticsNodes().size ==
                    index + 1
            }
        }
        ready()
    }

    private fun forgetExamCopiesFromSource() {
        ready()
        send("En la prueba K4eco3746, ¿cuándo es el simulacro de japonés K4eco3746?")
        compose.waitUntil(REPEATED_LIVE_TIMEOUT) {
            compose.onAllNodesWithContentDescription("Gestionar este recuerdo").fetchSemanticsNodes().isNotEmpty()
        }
        assertTrue(compose.onAllNodesWithText("27", substring = true).fetchSemanticsNodes().isNotEmpty())
        compose
            .onAllNodesWithContentDescription("Gestionar este recuerdo")
            .onFirst()
            .performScrollTo()
            .performClick()
        click("Gestionar")
        val exam =
            hasText("Olvidar") and memoryItemContaining("simulacro")
        compose.waitUntil(20_000) { compose.onAllNodes(exam).fetchSemanticsNodes().size == 1 }
        compose.onNode(exam).performScrollTo().performClick()
        confirmForget("simulacro", fromManagement = true)
    }

    private fun verifyMovieRemoval() =
        runBlocking {
            val repository = queries()
            val absent = reply(repository, "En la prueba K4eco3746, ¿qué película tengo yo pendiente de ver?")
            assertEquals(AnswerStatus.NotFound, absent.status)
        }

    private fun confirmForget(
        expected: String,
        fromManagement: Boolean = false,
    ) {
        click("Sí, olvidar")
        compose.waitUntil(REPEATED_LIVE_TIMEOUT) {
            if (fromManagement) {
                return@waitUntil compose
                    .onAllNodesWithText(
                        "Recuerdo borrado",
                    ).fetchSemanticsNodes()
                    .isNotEmpty()
            }
            compose
                .onAllNodes(
                    hasText("He olvidado «", substring = true) and
                        hasText(expected, substring = true, ignoreCase = true),
                ).fetchSemanticsNodes()
                .isNotEmpty()
        }
    }

    private fun verifyExamRemoval() =
        runBlocking {
            val repository = queries()
            val absent = reply(repository, "En la prueba K4eco3746, ¿cuándo es el simulacro de japonés K4eco3746?")
            assertEquals(AnswerStatus.NotFound, absent.status)
            val kept =
                reply(repository, "En la prueba K4eco3746, ¿qué fruta me gusta y qué película quiere ver mi hermano?")
            assertEquals(AnswerStatus.Answered, kept.status)
            assertTrue(kept.text.contains("peras", ignoreCase = true))
            assertTrue(kept.text.contains("Farol"))
        }

    private suspend fun reply(
        repository: NativeQueryRepository,
        question: String,
    ): QueryOutcome.Reply {
        val result = repository.execute(repository.prepare(question))
        assertTrue(result is QueryOutcome.Reply)
        return result as QueryOutcome.Reply
    }

    private fun queries(): NativeQueryRepository {
        val app = FirebaseApp.getInstance("kioku")
        check(app.options.projectId == "kioku-9454f")
        return NativeQueryRepository(
            AndroidMemoryPort(FirebaseAuth.getInstance(app), FirebaseFunctions.getInstance(app, "europe-west1")),
        )
    }

    private fun ready() {
        compose.waitUntil(30_000) {
            compose.activity.hasWindowFocus() &&
                compose.onAllNodes(hasTestTag("text-composer") and isEnabled()).fetchSemanticsNodes().isNotEmpty()
        }
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
        compose.waitUntil(REPEATED_LIVE_TIMEOUT) {
            compose.onAllNodesWithText(text).fetchSemanticsNodes().isNotEmpty()
        }
        if (!compose.onNodeWithText(text).isDisplayed()) compose.onNodeWithText(text).performScrollTo()
        compose.waitUntil(5000) { compose.onNodeWithText(text).isDisplayed() }
    }
}

private const val REPEATED_LIVE_TIMEOUT = 195000L
