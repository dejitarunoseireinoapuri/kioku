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
import org.junit.Assert.assertTrue
import org.junit.Assume.assumeTrue
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TestRule
import org.junit.runners.model.Statement
import java.io.File

/** Never opens the real account unless the separately authorized project is explicitly selected. */
class LivePerspectiveTest {
    @get:Rule(order = 0)
    val approval =
        TestRule { test, _ ->
            object : Statement() {
                override fun evaluate() {
                    assumeTrue(
                        InstrumentationRegistry.getArguments().getString("livePerspectiveProject") == "kioku-9454f",
                    )
                    test.evaluate()
                }
            }
        }

    @get:Rule(order = 1)
    val compose = createAndroidComposeRule<MainActivity>()

    @Test
    fun ownMemoriesUseFirstPersonWithoutChangingTheOtherSubject() {
        compose.waitUntil(30_000) {
            compose.onAllNodes(hasTestTag("intent-Tell") and isEnabled()).fetchSemanticsNodes().isNotEmpty()
        }
        compose.onNodeWithTag("intent-Tell").performClick()
        compose.onNodeWithTag("text-composer").performTextInput(STORY)
        compose.onNodeWithTag("text-composer").performImeAction()
        compose.waitUntil(195_000) {
            compose.onAllNodesWithContentDescription("Gestionar este recuerdo").fetchSemanticsNodes().isNotEmpty()
        }
        checkAnswer()
        compose.onNodeWithContentDescription("Gestionar este recuerdo").performScrollTo().performClick()
        compose.onNodeWithText("Gestionar").performClick()
        compose.waitUntil(195_000) { compose.onAllNodesWithText("Corregir").fetchSemanticsNodes().size == 2 }
        val own = memoryText("parque Loto")
        val other = memoryText("cine Faro")
        assertTrue(Regex("\\b(quiero|me apetece|tengo previsto)\\b", RegexOption.IGNORE_CASE).containsMatchIn(own))
        assertTrue(Regex("Pablo.*quiere", RegexOption.IGNORE_CASE).containsMatchIn(other))
    }

    private fun checkAnswer() =
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
            val result = repository.execute(repository.prepare("En la prueba K4yo5826, ¿qué parque quiero visitar?"))
            assertTrue(result is QueryOutcome.Reply)
            val reply = result as QueryOutcome.Reply
            assertEquals(AnswerStatus.Answered, reply.status)
            assertTrue(reply.text.contains("Loto", ignoreCase = true))
            assertTrue(Regex("quiero|me apetece|tengo previsto", RegexOption.IGNORE_CASE).containsMatchIn(reply.text))
            assertEquals(1, reply.sources.size)
            File(compose.activity.getExternalFilesDir(null), "kioku-perspective-source-id.txt")
                .writeText(reply.sources.single().sourceId)
        }

    private fun memoryText(part: String): String =
        compose
            .onAllNodesWithText(part, substring = true, ignoreCase = true)
            .fetchSemanticsNodes()
            .flatMap { it.config[SemanticsProperties.Text] }
            .joinToString(" ") { it.text }
}

private const val STORY =
    "En la prueba K4yo5826 quiero visitar el parque Loto K4yo5826. " +
        "Mi hermano Pablo K4yo5826 quiere ir al cine Faro K4yo5826."
