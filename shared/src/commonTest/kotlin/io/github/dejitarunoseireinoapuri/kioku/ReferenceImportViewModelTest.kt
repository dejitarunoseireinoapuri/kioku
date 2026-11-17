package io.github.dejitarunoseireinoapuri.kioku

import androidx.lifecycle.ViewModelStore
import io.github.dejitarunoseireinoapuri.kioku.domain.AccountSession
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceFormat
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceImportRepository
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceImportResult
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceInput
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceIssue
import io.github.dejitarunoseireinoapuri.kioku.feature.references.ReferenceImportState
import io.github.dejitarunoseireinoapuri.kioku.feature.references.ReferenceImportViewModel
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
import kotlin.test.assertIs
import kotlin.test.assertNull
import kotlin.test.assertTrue

@OptIn(ExperimentalCoroutinesApi::class)
class ReferenceImportViewModelTest {
    @Test fun unavailableTransportNeverReadsAnAttachment() =
        referenceTest { repository, model ->
            repository.available = false
            model.authorize(actor())
            model.receive(listOf(input()))
            runCurrent()
            assertEquals(ReferenceIssue.Unavailable, model.state.value.issue)
            assertEquals(0, repository.calls)
        }

    @Test fun accountAdmissionIsRequiredBeforeReading() =
        referenceTest { repository, model ->
            model.receive(listOf(input()))
            runCurrent()
            assertEquals(ReferenceIssue.SignInRequired, model.state.value.issue)
            assertEquals(0, repository.calls)
        }

    @Test fun storedIsShownOnlyAfterTheServerResultAndTheBatchIsSnapshotted() =
        referenceTest { repository, model ->
            val pending = CompletableDeferred<ReferenceImportResult>()
            repository.result = { pending.await() }
            model.authorize(actor())
            val inputs = mutableListOf(input())
            model.receive(inputs)
            inputs.clear()
            runCurrent()
            assertEquals(1, repository.calls)
            assertTrue(model.state.value.busy)
            assertNull(
                model.state.value.items
                    .single()
                    .result,
            )
            pending.complete(stored())
            runCurrent()
            assertFalse(model.state.value.busy)
            assertIs<ReferenceImportResult.Stored>(
                model.state.value.items
                    .single()
                    .result,
            )
        }

    @Test fun eachBatchItemKeepsItsOwnSuccessOrFailure() =
        referenceTest { repository, model ->
            repository.result =
                { if (it.id == "one") ReferenceImportResult.Failed(ReferenceIssue.Permission) else stored() }
            model.authorize(actor())
            model.receive(listOf(input("one"), input("two")))
            runCurrent()
            assertEquals(2, repository.calls)
            assertEquals(
                ReferenceImportResult.Failed(ReferenceIssue.Permission),
                model.state.value.items[0]
                    .result,
            )
            assertIs<ReferenceImportResult.Stored>(
                model.state.value.items[1]
                    .result,
            )
        }

    @Test fun accountChangesRejectEvenUncooperativeLateResults() =
        referenceTest { repository, model ->
            val pending = CompletableDeferred<ReferenceImportResult>()
            repository.result = { withContext(NonCancellable) { pending.await() } }
            model.authorize(actor())
            model.receive(listOf(input()))
            runCurrent()
            model.authorize(actor().copy(generation = 2))
            pending.complete(stored())
            runCurrent()
            assertEquals(ReferenceImportState(), model.state.value)
            assertEquals(1, repository.calls)
        }

    @Test fun cancelDiscardsTextAndDoesNotRestoreALateConfirmation() =
        referenceTest { repository, model ->
            val pending = CompletableDeferred<ReferenceImportResult>()
            repository.result = { withContext(NonCancellable) { pending.await() } }
            model.authorize(actor())
            model.receive(listOf(input()))
            runCurrent()
            model.cancel()
            pending.complete(stored())
            runCurrent()
            assertEquals(ReferenceImportState(), model.state.value)
        }

    @Test fun invalidAndOversizedBatchesNeverReadFiles() =
        referenceTest { repository, model ->
            model.authorize(actor())
            model.receive(List(6) { input(it.toString()) })
            assertEquals(ReferenceIssue.TooLarge, model.state.value.issue)
            model.receive(listOf(input(), input()))
            assertEquals(ReferenceIssue.Invalid, model.state.value.issue)
            runCurrent()
            assertEquals(0, repository.calls)
        }

    private fun referenceTest(block: suspend TestScope.(ReferenceRepositoryFixture, ReferenceImportViewModel) -> Unit) =
        runTest {
            Dispatchers.setMain(StandardTestDispatcher(testScheduler))
            val store = ViewModelStore()
            val repository = ReferenceRepositoryFixture()
            val model = ReferenceImportViewModel(repository)
            store.put("reference-fixture", model)
            try {
                block(repository, model)
            } finally {
                store.clear()
                Dispatchers.resetMain()
            }
        }
}

private class ReferenceRepositoryFixture : ReferenceImportRepository {
    override var available = true
    var calls = 0
    var result: suspend (ReferenceInput) -> ReferenceImportResult = { stored() }

    override suspend fun importSource(
        session: AccountSession,
        input: ReferenceInput,
    ): ReferenceImportResult {
        calls++
        return result(input)
    }
}

private fun actor() = AccountSession("reference-fictional-owner", 1, "Cuenta ficticia")

private fun input(id: String = "one") = ReferenceInput(id, "Itinerario ficticio.txt", ReferenceFormat.Text)

private fun stored() = ReferenceImportResult.Stored("fictional-source", "fictional-version", 2, false)
