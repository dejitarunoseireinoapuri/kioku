package io.github.dejitarunoseireinoapuri.kioku

import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import io.github.dejitarunoseireinoapuri.kioku.di.appModule
import io.github.dejitarunoseireinoapuri.kioku.domain.AnswerStatus
import io.github.dejitarunoseireinoapuri.kioku.domain.QueryOutcome
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceCitation
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceFailure
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceFormat
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceImportResult
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceInput
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceIssue
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceSummary
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceWorkspaceRepository
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.QueryBody
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.QueryState
import io.github.dejitarunoseireinoapuri.kioku.feature.references.LocalReferenceReader
import io.github.dejitarunoseireinoapuri.kioku.feature.references.ReferenceImportItem
import io.github.dejitarunoseireinoapuri.kioku.feature.references.ReferenceWorkspaceActions
import io.github.dejitarunoseireinoapuri.kioku.feature.references.ReferenceWorkspaceApp
import io.github.dejitarunoseireinoapuri.kioku.feature.references.ReferenceWorkspaceState
import io.github.dejitarunoseireinoapuri.kioku.feature.references.SharedSourceNotice
import org.junit.After
import org.junit.Rule
import org.junit.Test
import org.koin.compose.KoinApplication
import org.koin.dsl.koinConfiguration

/** Entirely synthetic UI: never initializes Firebase or uses an owner's account. */
class UnifiedSourcesUiTest {
    @get:Rule val compose = createAndroidComposeRule<LifecycleTestActivity>()

    @After fun close() = compose.runOnUiThread { LifecycleTestActivity.content = null }

    @Test fun sourcesHasOnlyUrlImportAndManagement() {
        open { ReferenceWorkspaceApp(ReferenceWorkspaceState(), FixtureSourceActions(), pilot = false) }
        compose.onNodeWithText("Fuentes").assertExists()
        compose.onNodeWithText("URL").assertExists()
        compose.onNodeWithText("Importar fuente").assertExists()
        compose.onNodeWithText("Abrir archivos").assertDoesNotExist()
        compose.onNodeWithTag("reference-question").assertDoesNotExist()
        compose.onNodeWithText("Preguntar").assertDoesNotExist()
    }

    @Test fun aFailedSharedFileShowsConnectionAndCanRetry() {
        var retried = false
        val item =
            ReferenceImportItem(
                ReferenceInput("fixture", "Ficción", ReferenceFormat.Text),
                ReferenceImportResult.Failed(ReferenceIssue.Connection),
            )
        open { SharedSourceNotice(ReferenceWorkspaceState(items = listOf(item)), {}, { retried = true }) }
        compose.onNodeWithText("No se ha podido conectar", substring = true).assertExists()
        compose.onNodeWithText("Texto guardado en Kioku").assertDoesNotExist()
        compose.onNodeWithText("Reintentar importación").performClick()
        compose.runOnIdle { check(retried) }
    }

    @Test fun aPartialSharedSourceDoesNotClaimFullExtraction() {
        val receipt = ReferenceImportResult.Stored("fixture", "revision", 1, true)
        open { SharedSourceNotice(ReferenceWorkspaceState(webReceipt = receipt), {}, {}) }
        compose.onNodeWithText("Cobertura parcial: falta contenido del original").assertExists()
        compose.onNodeWithText("Texto guardado en Kioku").assertDoesNotExist()
    }

    @Test fun aChatCitationLoadsItsCurrentFragmentWithoutOpeningAnotherChat() {
        openAnswer(FixtureReferenceReader())
        compose.onNodeWithText(CITATION.title).performClick()
        compose.waitUntil(TIMEOUT_MS) {
            compose
                .onAllNodes(
                    androidx.compose.ui.test
                        .hasText(CITATION.text),
                ).fetchSemanticsNodes()
                .isNotEmpty()
        }
        compose.onNodeWithText("Página 1").assertExists()
        compose.onNodeWithTag("reference-question").assertDoesNotExist()
    }

    @Test fun revokedCitationDoesNotRevealItsCachedQuotation() {
        openAnswer(FixtureReferenceReader(revoked = true))
        compose.onNodeWithText(CITATION.title).performClick()
        compose.waitUntil(TIMEOUT_MS) {
            compose
                .onAllNodes(
                    androidx.compose.ui.test
                        .hasText("No se ha podido completar", substring = true),
                ).fetchSemanticsNodes()
                .isNotEmpty()
        }
        compose.onNodeWithText(CITATION.text).assertDoesNotExist()
    }

    private fun openAnswer(repository: ReferenceWorkspaceRepository) =
        open {
            KoinApplication(configuration = koinConfiguration { modules(appModule()) }) {
                CompositionLocalProvider(LocalReferenceReader provides { repository }) {
                    QueryBody(
                        QueryState(
                            outcome =
                                QueryOutcome.Reply(
                                    AnswerStatus.Answered,
                                    "Respuesta ficticia atribuida.",
                                    emptyList(),
                                    listOf(CITATION),
                                ),
                        ),
                        {},
                        {},
                    )
                }
            }
        }

    private fun open(content: @androidx.compose.runtime.Composable () -> Unit) {
        compose.runOnUiThread { LifecycleTestActivity.content = content }
        compose.activityRule.scenario.recreate()
    }

    private companion object {
        const val TIMEOUT_MS = 10_000L
        val CITATION =
            ReferenceCitation(
                "fictional-source",
                "fictional-revision",
                "Manual ficticio",
                "page",
                1,
                "Lira usa un cuaderno violeta ficticio.",
            )
    }

    private class FixtureReferenceReader(
        private val revoked: Boolean = false,
    ) : ReferenceWorkspaceRepository {
        override suspend fun read(source: ReferenceSummary): List<ReferenceCitation> {
            check(source.id == CITATION.sourceId && source.revision == CITATION.revision)
            if (revoked) throw ReferenceFailure(ReferenceIssue.Conflict)
            return listOf(CITATION)
        }

        override suspend fun catalog() = emptyList<ReferenceSummary>()

        override suspend fun forget(source: ReferenceSummary) = error("Read-only fixture")

        override suspend fun importFile(input: ReferenceInput): ReferenceImportResult = error("Share only")

        override suspend fun importWeb(
            url: String,
            requestId: String,
        ): ReferenceImportResult = error("Not imported")

        override suspend fun query(
            question: String,
            sourceId: String?,
        ) = error("No second chat")
    }
}

private class FixtureSourceActions : ReferenceWorkspaceActions {
    override fun pick() = error("No picker")

    override fun example() = Unit

    override fun refresh() = Unit

    override fun question(text: String) = error("No second chat")

    override fun web(text: String) = Unit

    override fun importWeb() = Unit

    override fun select(source: ReferenceSummary?) = Unit

    override fun read() = Unit

    override fun ask() = error("No second chat")

    override fun previewForget(source: ReferenceSummary?) = Unit

    override fun confirmForget() = Unit

    override fun interrupt() = Unit

    override fun retry() = Unit
}
