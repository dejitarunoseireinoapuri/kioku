package io.github.dejitarunoseireinoapuri.kioku

import androidx.activity.ComponentActivity
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.isDisplayed
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performImeAction
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performTextInput
import io.github.dejitarunoseireinoapuri.kioku.domain.AnswerStatus
import io.github.dejitarunoseireinoapuri.kioku.domain.MemoryItem
import io.github.dejitarunoseireinoapuri.kioku.domain.QueryCommand
import io.github.dejitarunoseireinoapuri.kioku.domain.QueryOutcome
import io.github.dejitarunoseireinoapuri.kioku.domain.QueryReference
import io.github.dejitarunoseireinoapuri.kioku.domain.QueryRepository
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class QueryMemoryActionsTest {
    @get:Rule
    val compose = createAndroidComposeRule<ComponentActivity>()
    private val controls = QueryManagementFixture()
    private var queryCount = 0

    @Test
    fun anAnswerMenuOpensAllItsSourcesAndSelectionTargetsOnlyTheChosenFact() {
        controls.read = { id ->
            controls.source(id).copy(
                items =
                    listOf(
                        MemoryItem(
                            "$id-1",
                            if (id ==
                                "first"
                            ) {
                                "Quiero ver Loto."
                            } else {
                                "Quiero ir al vivero."
                            },
                        ),
                    ),
            )
        }
        start(
            QueryOutcome.Reply(
                AnswerStatus.Answered,
                "Tengo dos planes.",
                listOf(QueryReference("first", "2026-11-13"), QueryReference("second", "2026-11-13")),
            ),
        )
        visible("Tengo dos planes.")
        compose.onNodeWithText("Ver texto original", substring = true).assertDoesNotExist()
        compose.onNodeWithContentDescription("Gestionar este recuerdo").performScrollTo().performClick()
        compose.onNodeWithText("Gestionar un recuerdo").assertDoesNotExist()
        captureBrandScreen(compose.activity, "kioku-answer-menu.png") { compose.onRoot().captureToImage() }
        compose.onNodeWithText("Gestionar").performClick()
        visible("Quiero ir al vivero.")
        compose.onNodeWithText("Quiero ver Loto.").assertIsDisplayed()
        compose
            .onNode(
                hasText("Olvidar") and memoryItemContaining("Quiero ir al vivero."),
            ).performScrollTo()
            .performClick()
        visible("¿Borrar este recuerdo?")
        compose.onNodeWithText("Cancelar").performClick()
        compose.onNodeWithText("Gestionar un recuerdo").assertIsDisplayed()
        assertEquals(2, controls.reads)
        assertEquals(1, queryCount)
    }

    @Test
    fun anAnswerWithoutEvidenceHasNoManagementMenu() {
        start(QueryOutcome.Reply(AnswerStatus.NotFound, "No tengo ese recuerdo.", emptyList()))
        visible("No tengo ese recuerdo.")
        compose.onNodeWithContentDescription("Gestionar este recuerdo").assertDoesNotExist()
        compose.onNodeWithText("Ver texto original", substring = true).assertDoesNotExist()
    }

    private fun start(answer: QueryOutcome) {
        val queries =
            object : QueryRepository {
                override fun prepare(text: String) = QueryCommand("synthetic-query", text)

                override suspend fun execute(command: QueryCommand): QueryOutcome {
                    queryCount++
                    return answer
                }

                override suspend fun source(id: String) = null
            }
        compose.setContent { KiokuApp(FixtureAccount(), queryRepository = queries, controlRepository = controls) }
        compose.waitUntil(5000) { compose.onNodeWithTag("intent-Ask").isDisplayed() }
        compose.onNodeWithTag("intent-Ask").performClick()
        compose.onNodeWithTag("text-composer").performTextInput("¿Qué planes tengo?")
        compose.onNodeWithTag("text-composer").performImeAction()
    }

    private fun visible(text: String) {
        compose.waitUntil(5000) { compose.onAllNodesWithText(text).fetchSemanticsNodes().isNotEmpty() }
        if (!compose.onNodeWithText(text).isDisplayed()) compose.onNodeWithText(text).performScrollTo()
    }
}
