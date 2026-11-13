package io.github.dejitarunoseireinoapuri.kioku

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsEnabled
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.assertTextContains
import androidx.compose.ui.test.captureToImage
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
import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureIssue
import io.github.dejitarunoseireinoapuri.kioku.domain.MemorySource
import io.github.dejitarunoseireinoapuri.kioku.domain.QueryCommand
import io.github.dejitarunoseireinoapuri.kioku.domain.QueryOutcome
import io.github.dejitarunoseireinoapuri.kioku.domain.QueryReference
import io.github.dejitarunoseireinoapuri.kioku.domain.QueryRepository
import kotlinx.coroutines.CompletableDeferred
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Rule
import org.junit.Test

class QueryNavigationTest {
    @get:Rule
    val compose = createAndroidComposeRule<LifecycleTestActivity>()
    private val account = FixtureAccount()
    private val queries = QueryNavigationFixture()

    @Before
    fun openQueries() {
        compose.runOnUiThread { LifecycleTestActivity.content = { KiokuApp(account, queryRepository = queries) } }
        compose.activityRule.scenario.recreate()
        compose.waitUntil(5000) { compose.onNodeWithTag("intent-Ask").isDisplayed() }
        compose.onNodeWithTag("intent-Ask").performClick()
    }

    @After
    fun clearHost() {
        compose.runOnUiThread { LifecycleTestActivity.content = null }
    }

    @Test
    fun answerWaitsForEvidenceAndLoadsTheCurrentSourceOnOpening() {
        val response = CompletableDeferred<QueryOutcome>()
        val source = CompletableDeferred<MemorySource?>()
        queries.answer = { response.await() }
        queries.read = { source.await() }
        send("¿Qué película quiero ver?")
        visible("Buscando en tu memoria...")
        compose.onNodeWithTag("content-loading").assertIsDisplayed()
        compose.onNodeWithTag("text-composer").assertIsDisplayed().assertIsNotEnabled()
        captureBrandScreen(compose.activity, "kioku-compact-query.png") { compose.onRoot().captureToImage() }
        response.complete(queries.reply())
        visible("Quieres ver la película ficticia Loto.")
        compose.onNodeWithText("Ver texto original 1 · 2026-11-13").performScrollTo().performClick()
        visible("Cargando texto original...")
        compose.onNodeWithTag("content-loading").assertIsDisplayed()
        compose.onNodeWithContentDescription("Volver").assertIsDisplayed()
        source.complete(
            MemorySource(
                "fixture-query-source",
                "Quiero ver la película ficticia Loto.",
                "2026-11-13",
                receivedAt = "2026-11-13T12:00:00Z",
            ),
        )
        visible("Quiero ver la película ficticia Loto.")
        compose.onNodeWithText("Lo contaste el 13/11/2026").assertIsDisplayed()
        captureBrandScreen(compose.activity, "kioku-source-date.png") { compose.onRoot().captureToImage() }
        compose.onNodeWithContentDescription("Volver").performClick()
        visible("Quieres ver la película ficticia Loto.")
        assertEquals(1, queries.commands.size)
        assertEquals(1, queries.sourceReads)
    }

    @Test
    fun returningFromAPendingSourceKeepsTheAnswerAndDoesNotResubmit() {
        val source = CompletableDeferred<MemorySource?>()
        queries.read = { source.await() }
        send("¿Qué película quiero ver?")
        visible("Quieres ver la película ficticia Loto.")
        compose.onNodeWithText("Ver texto original 1 · 2026-11-13").performScrollTo().performClick()
        visible("Cargando texto original...")
        compose.onNodeWithContentDescription("Volver").performClick()
        visible("Quieres ver la película ficticia Loto.")
        compose.onNodeWithTag("content-loading").assertIsDisplayed()
        source.complete(MemorySource("fixture-query-source", "Quiero ver la película ficticia Loto.", "2026-11-13"))
        compose.waitUntil(5000) { !compose.onNodeWithTag("content-loading").isDisplayed() }
        visible("Quieres ver la película ficticia Loto.")
        assertEquals(1, queries.commands.size)
        assertEquals(1, queries.sourceReads)
    }

    @Test
    fun failedQueryDismissesLoadingAndAllowsAnotherQuestion() {
        val response = CompletableDeferred<QueryOutcome>()
        queries.answer = { response.await() }
        send("¿Qué película quiero ver?")
        visible("Buscando en tu memoria...")
        response.complete(QueryOutcome.Failed(CaptureIssue.Unavailable))
        compose.waitUntil(5000) { !compose.onNodeWithTag("content-loading").isDisplayed() }
        compose.onNodeWithTag("text-composer").assertIsDisplayed().assertIsEnabled()
        compose.onNodeWithTag("content-loading").assertDoesNotExist()
        compose.onNodeWithText("Recuerdo guardado").assertDoesNotExist()
        queries.answer = { queries.reply() }
        send("¿Qué película tengo pendiente?")
        visible("Quieres ver la película ficticia Loto.")
        assertEquals(2, queries.commands.size)
    }

    @Test
    fun ambiguityContinuesItsQuestionAndAbsenceDoesNotCreateASavedCard() {
        queries.answer = { QueryOutcome.Reply(AnswerStatus.Clarification, "¿A qué Pablo te refieres?", emptyList()) }
        send("¿Qué recomendó Pablo?")
        visible("¿A qué Pablo te refieres?")
        queries.answer = { QueryOutcome.Reply(AnswerStatus.NotFound, "No tengo ese recuerdo guardado.", emptyList()) }
        send("Mi compañero de japonés.")
        visible("No tengo ese recuerdo guardado.")
        compose.onNodeWithText("Recuerdo guardado").assertDoesNotExist()
        assertEquals("¿Qué recomendó Pablo?\nAclaración: Mi compañero de japonés.", queries.commands.last().text)
    }

    @Test
    fun queryAndDraftSurviveRecreationButNotLogout() {
        val response = CompletableDeferred<QueryOutcome>()
        queries.answer = { response.await() }
        compose.onNodeWithTag("text-composer").performTextInput("¿Qué película quiero ver?")
        compose.activityRule.scenario.recreate()
        compose.onNodeWithTag("text-composer").assertTextContains("¿Qué película quiero ver?")
        compose.onNodeWithTag("text-composer").performImeAction()
        visible("Buscando en tu memoria...")
        compose.activityRule.scenario.recreate()
        visible("Buscando en tu memoria...")
        assertEquals(1, queries.commands.size)
        response.complete(queries.reply())
        visible("Quieres ver la película ficticia Loto.")
        compose.activityRule.scenario.recreate()
        visible("Quieres ver la película ficticia Loto.")
        compose.onNodeWithContentDescription("Ajustes").performClick()
        compose.onNodeWithText("Cerrar sesión").performScrollTo().performClick()
        compose.onNodeWithText("Continuar con Google").performScrollTo().performClick()
        compose.onNodeWithText("Quieres ver la película ficticia Loto.").assertDoesNotExist()
    }

    private fun send(text: String) {
        compose.onNodeWithTag("text-composer").performTextInput(text)
        compose.onNodeWithTag("text-composer").performImeAction()
    }

    private fun visible(text: String) {
        compose.waitUntil(5000) { compose.onAllNodesWithText(text).fetchSemanticsNodes().isNotEmpty() }
        if (!compose.onNodeWithText(text).isDisplayed()) compose.onNodeWithText(text).performScrollTo()
        compose.waitUntil(5000) { compose.onNodeWithText(text).isDisplayed() }
        compose.onNodeWithText(text).assertIsDisplayed()
    }
}

private class QueryNavigationFixture : QueryRepository {
    val commands = mutableListOf<QueryCommand>()
    var sourceReads = 0
    var answer: suspend () -> QueryOutcome = { reply() }
    var read: suspend () -> MemorySource? = { null }

    override fun prepare(text: String) = QueryCommand("query-fixture-${commands.size}", text)

    override suspend fun execute(command: QueryCommand): QueryOutcome {
        commands.add(command)
        return answer()
    }

    override suspend fun source(id: String): MemorySource? {
        sourceReads++
        return read()
    }

    fun reply() =
        QueryOutcome.Reply(
            AnswerStatus.Answered,
            "Quieres ver la película ficticia Loto.",
            listOf(QueryReference("fixture-query-source", "2026-11-13")),
        )
}
