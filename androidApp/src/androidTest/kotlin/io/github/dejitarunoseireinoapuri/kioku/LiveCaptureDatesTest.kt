package io.github.dejitarunoseireinoapuri.kioku

import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.isEnabled
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onAllNodesWithContentDescription
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performImeAction
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
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.ZoneId
import java.time.temporal.TemporalAdjusters

/** The default suite skips before accessing the real account; opt-in requires deployment authorization. */
class LiveCaptureDatesTest {
    @get:Rule(order = 0)
    val approval =
        TestRule { test, _ ->
            object : Statement() {
                override fun evaluate() {
                    assumeTrue(
                        InstrumentationRegistry.getArguments().getString("liveCaptureDatesProject") == "kioku-9454f",
                    )
                    test.evaluate()
                }
            }
        }

    @get:Rule(order = 1)
    val compose = createAndroidComposeRule<MainActivity>()

    @Test
    fun oneSentenceStoresAndRetrievesTwoIndependentEventDates() {
        compose.waitUntil(30_000) {
            compose.activity.hasWindowFocus() &&
                compose.onAllNodes(hasTestTag("intent-Tell") and isEnabled()).fetchSemanticsNodes().isNotEmpty()
        }
        compose.onNodeWithTag("intent-Tell").performClick()
        val today = LocalDate.now(ZoneId.of("Europe/Madrid"))
        val text =
            "En la prueba K4fecha7392 mañana construiré la maqueta K4fecha7392, " +
                "y el próximo martes visitaré el acuario K4fecha7392."
        compose.onNodeWithTag("text-composer").performTextInput(text)
        compose.onNodeWithTag("text-composer").performImeAction()
        compose.waitUntil(195_000) {
            compose.onAllNodesWithContentDescription("Gestionar este recuerdo").fetchSemanticsNodes().isNotEmpty()
        }
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
            checkDate(repository, "maqueta", today.plusDays(1))
            checkDate(repository, "acuario", today.with(TemporalAdjusters.next(DayOfWeek.TUESDAY)))
        }
    }

    private suspend fun checkDate(
        repository: NativeQueryRepository,
        subject: String,
        date: LocalDate,
    ) {
        val answer = repository.execute(repository.prepare("En la prueba K4fecha7392, ¿cuándo es lo de $subject?"))
        assertTrue(answer is QueryOutcome.Reply)
        answer as QueryOutcome.Reply
        assertEquals(AnswerStatus.Answered, answer.status)
        assertTrue(answer.text.contains(date.dayOfMonth.toString()))
        assertTrue(answer.sources.isNotEmpty())
    }
}
