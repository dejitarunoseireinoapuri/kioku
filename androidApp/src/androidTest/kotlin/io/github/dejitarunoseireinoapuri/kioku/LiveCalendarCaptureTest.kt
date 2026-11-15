package io.github.dejitarunoseireinoapuri.kioku

import androidx.compose.ui.semantics.SemanticsProperties
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

/** No real account is opened without the explicit outer project opt-in. */
class LiveCalendarCaptureTest {
    @get:Rule(order = 0)
    val approval =
        TestRule { test, _ ->
            object : Statement() {
                override fun evaluate() {
                    assumeTrue(InstrumentationRegistry.getArguments().getString("liveCalendarProject") == "kioku-9454f")
                    test.evaluate()
                }
            }
        }

    @get:Rule(order = 1)
    val compose = createAndroidComposeRule<MainActivity>()

    @Test
    fun relativeMonthAndWeekdaySaveAndRemainIndependentlyRetrievable() {
        compose.waitUntil(CALENDAR_TIMEOUT) {
            compose.onAllNodesWithText("Explicar").fetchSemanticsNodes().isNotEmpty()
        }
        compose.onNodeWithText("Explicar").performClick()
        compose.waitUntil(CALENDAR_TIMEOUT) {
            compose.onAllNodes(hasTestTag("text-composer") and isEnabled()).fetchSemanticsNodes().size == 1
        }
        compose.onNodeWithTag("text-composer").performTextInput(CALENDAR_STORY)
        compose.onNodeWithTag("text-composer").performImeAction()
        compose.waitUntil(CALENDAR_TIMEOUT) {
            compose.onAllNodesWithContentDescription("Gestionar este recuerdo").fetchSemanticsNodes().size == 1
        }
        compose.onNodeWithContentDescription("Gestionar este recuerdo").performScrollTo().performClick()
        compose.onNodeWithText("Gestionar").performClick()
        compose.waitUntil(CALENDAR_TIMEOUT) {
            compose.onAllNodesWithText("Corregir").fetchSemanticsNodes().size == 2
        }
        assertIndependentLabels()
        verifyQueries()
    }

    private fun assertIndependentLabels() {
        val texts =
            compose
                .onAllNodesWithText("Quiero", substring = true, ignoreCase = true)
                .fetchSemanticsNodes()
                .map { node ->
                    node.config[SemanticsProperties.Text].joinToString { it.text }
                }
        val course = texts.single { it.contains("empezar", true) }
        assertFalse(course.contains("matrícula", true))
        assertFalse(course.contains("martes", true))
        val registration = compose.onAllNodesWithText("matrícula", substring = true).fetchSemanticsNodes()
        assertEquals(1, registration.size)
        assertFalse(
            registration
                .single()
                .config[SemanticsProperties.Text]
                .joinToString { it.text }
                .contains("empezar"),
        )
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
            for (question in listOf("¿Cuándo quiero empezar cerámica?", "¿Cuándo es la matrícula?")) {
                val result = queries.execute(queries.prepare("En la prueba K4cal1517, $question"))
                assertTrue(result is QueryOutcome.Reply)
                assertEquals(AnswerStatus.Answered, (result as QueryOutcome.Reply).status)
                assertTrue(result.sources.isNotEmpty())
            }
        }
}

private const val CALENDAR_TIMEOUT = 195000L
private const val CALENDAR_STORY =
    "En la prueba K4cal1517 quiero empezar cerámica el mes que viene, la matrícula es el próximo martes."
