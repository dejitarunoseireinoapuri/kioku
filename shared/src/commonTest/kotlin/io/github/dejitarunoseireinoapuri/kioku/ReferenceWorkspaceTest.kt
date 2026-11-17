package io.github.dejitarunoseireinoapuri.kioku

import androidx.lifecycle.ViewModelStore
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceCitation
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceFailure
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceFormat
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceImportResult
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceInput
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceIssue
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceSummary
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceWorkspaceRepository
import io.github.dejitarunoseireinoapuri.kioku.feature.references.ReferenceWorkspaceViewModel
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.NonCancellable
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import kotlinx.coroutines.withContext
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNull
import kotlin.test.assertTrue

@OptIn(ExperimentalCoroutinesApi::class)
class ReferenceWorkspaceTest {
    @Test fun naturalAnswerIsClearedWhenQuestionOrCurrentEvidenceChanges() =
        fixture { repository, model ->
            model.refresh()
            runCurrent()
            model.editQuestion("¿Qué cuaderno usa Lira?")
            model.ask()
            runCurrent()
            assertEquals("Respuesta ficticia", model.state.value.answer)
            model.editQuestion("¿Y Nara?")
            assertNull(model.state.value.answer)
            model.ask()
            runCurrent()
            repository.sources = emptyList()
            model.refresh()
            runCurrent()
            assertNull(model.state.value.answer)
            assertTrue(
                model.state.value.citations
                    .isEmpty(),
            )
            assertFalse(model.state.value.searched)
        }

    @Test fun failedQueryKeepsTheQuestionForExplicitRetry() =
        fixture { repository, model ->
            model.editQuestion("¿Qué cuaderno usa Lira?")
            repository.answer = { throw ReferenceFailure(ReferenceIssue.Connection) }
            model.ask()
            runCurrent()
            assertEquals(ReferenceIssue.Connection, model.state.value.issue)
            assertEquals("¿Qué cuaderno usa Lira?", model.state.value.question)
            repository.answer = { listOf(citation()) }
            model.ask()
            runCurrent()
            assertEquals(listOf(citation()), model.state.value.citations)
            assertNull(model.state.value.issue)
        }

    @Test fun changingQuestionDiscardsANonCooperativeLateAnswer() =
        fixture { repository, model ->
            val gate = CompletableDeferred<Unit>()
            repository.answer = {
                withContext(NonCancellable) { gate.await() }
                listOf(citation())
            }
            model.editQuestion("cuaderno")
            model.ask()
            runCurrent()
            model.editQuestion("planetario")
            gate.complete(Unit)
            runCurrent()
            assertTrue(
                model.state.value.citations
                    .isEmpty(),
            )
            assertFalse(model.state.value.searched)
            assertNull(model.state.value.work)
        }

    @Test fun forgetNeedsExplicitConfirmationAndRemainsVisibleUntilTheServerConfirms() =
        fixture { repository, model ->
            model.refresh()
            runCurrent()
            val gate = CompletableDeferred<Unit>()
            repository.deletion = {
                gate.await()
                repository.sources = emptyList()
            }
            model.previewForget(source())
            assertEquals(0, repository.forgotten)
            model.previewForget(null)
            assertEquals(0, repository.forgotten)
            model.previewForget(source())
            model.confirmForget()
            runCurrent()
            assertEquals(listOf(source()), model.state.value.sources)
            gate.complete(Unit)
            runCurrent()
            assertTrue(
                model.state.value.sources
                    .isEmpty(),
            )
            assertEquals(1, repository.forgotten)
        }

    @Test fun refreshRemovesCitationsOfARevokedVersion() =
        fixture { repository, model ->
            model.refresh()
            runCurrent()
            model.editQuestion("cuaderno")
            model.ask()
            runCurrent()
            assertEquals(1, model.state.value.citations.size)
            repository.sources = listOf(source().copy(revision = "new-fictional-version"))
            model.refresh()
            runCurrent()
            assertTrue(
                model.state.value.citations
                    .isEmpty(),
            )
        }

    @Test fun aMixedBatchPreservesEveryResultAndRetryUsesTheSameInputIds() =
        fixture { repository, model ->
            val inputs = listOf(input("first"), input("second"))
            repository.importer =
                { if (it.id == "second") ReferenceImportResult.Failed(ReferenceIssue.Connection) else stored() }
            model.importFiles(inputs)
            runCurrent()
            assertEquals(2, model.state.value.items.size)
            assertTrue(
                model.state.value.items[1]
                    .result is ReferenceImportResult.Failed,
            )
            repository.importer = { stored() }
            model.importFiles(
                model.state.value.items
                    .map { it.input },
            )
            runCurrent()
            assertEquals(listOf("first", "second", "first", "second"), repository.imports)
            assertTrue(
                model.state.value.items
                    .all { it.result is ReferenceImportResult.Stored },
            )
        }

    @Test fun cancellingALateCatalogCannotReplaceTheNewSelection() =
        fixture { repository, model ->
            val gate = CompletableDeferred<Unit>()
            repository.loader = {
                withContext(NonCancellable) { gate.await() }
                listOf(source())
            }
            model.refresh()
            runCurrent()
            model.select(null)
            gate.complete(Unit)
            runCurrent()
            assertTrue(
                model.state.value.sources
                    .isEmpty(),
            )
            assertNull(model.state.value.work)
        }

    private fun fixture(block: suspend TestScope.(WorkspaceFixture, ReferenceWorkspaceViewModel) -> Unit) =
        runTest {
            Dispatchers.setMain(StandardTestDispatcher(testScheduler))
            val store = ViewModelStore()
            val repository = WorkspaceFixture()
            val model = ReferenceWorkspaceViewModel(repository)
            store.put("reference-workspace", model)
            try {
                block(repository, model)
            } finally {
                store.clear()
                Dispatchers.resetMain()
            }
        }
}

private class WorkspaceFixture : ReferenceWorkspaceRepository {
    var sources = listOf(source())
    var loader: suspend () -> List<ReferenceSummary> = { sources }
    var answer: suspend () -> List<ReferenceCitation> = { listOf(citation()) }
    var importer: suspend (ReferenceInput) -> ReferenceImportResult = { stored() }
    var deletion: suspend () -> Unit = {}
    var forgotten = 0
    val imports = mutableListOf<String>()

    override suspend fun catalog() = loader()

    override suspend fun query(
        question: String,
        sourceId: String?,
    ) = io.github.dejitarunoseireinoapuri.kioku.domain
        .ReferenceAnswer("Respuesta ficticia", answer())

    override suspend fun read(source: ReferenceSummary) = answer()

    override suspend fun importFile(input: ReferenceInput): ReferenceImportResult {
        imports += input.id
        return importer(input)
    }

    override suspend fun importWeb(
        url: String,
        requestId: String,
    ) = stored()

    override suspend fun forget(source: ReferenceSummary) {
        deletion()
        forgotten++
    }
}

private fun source() = ReferenceSummary("source-fictional", "version-fictional", "Manual ficticio", false, 1)

private fun citation() =
    ReferenceCitation(source().id, source().revision, source().title, "paragraph", 1, "Cuaderno violeta ficticio")

private fun input(id: String) = ReferenceInput(id, "Documento ficticio.txt", ReferenceFormat.Text)

private fun stored() = ReferenceImportResult.Stored(source().id, source().revision, 1, false)
