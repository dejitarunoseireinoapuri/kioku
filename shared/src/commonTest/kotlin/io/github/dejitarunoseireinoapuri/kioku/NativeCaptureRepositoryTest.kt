package io.github.dejitarunoseireinoapuri.kioku

import io.github.dejitarunoseireinoapuri.kioku.data.MemoryEndpoint
import io.github.dejitarunoseireinoapuri.kioku.data.NativeCancellation
import io.github.dejitarunoseireinoapuri.kioku.data.NativeCaptureRepository
import io.github.dejitarunoseireinoapuri.kioku.data.NativeMemoryPort
import io.github.dejitarunoseireinoapuri.kioku.data.NativeMemoryReply
import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureIssue
import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureOutcome
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.async
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertIs
import kotlin.test.assertTrue

@OptIn(ExperimentalCoroutinesApi::class)
class NativeCaptureRepositoryTest {
    @Test
    fun nativeNumericRepresentationsPreserveWholeNumbers() =
        runTest {
            val port = CapturePortFixture()
            val repository = NativeCaptureRepository(port)
            val result = async { repository.execute(repository.tell("Dato ficticio")) }
            runCurrent()
            port.completion?.invoke(NativeMemoryReply.Received(savedPayload("1.0")))
            val saved = assertIs<CaptureOutcome.Saved>(result.await())
            assertEquals(1, saved.memoryCount)
            assertEquals(1L, saved.memoryRevision)
            assertEquals("2026-11-13T17:00:00.000Z", saved.source.receivedAt)
        }

    @Test
    fun fractionalNativeNumbersCannotCreateASavedState() =
        runTest {
            val port = CapturePortFixture()
            val repository = NativeCaptureRepository(port)
            val result = async { repository.execute(repository.tell("Dato ficticio")) }
            runCurrent()
            port.completion?.invoke(NativeMemoryReply.Received(savedPayload("1.5")))
            assertEquals(CaptureOutcome.Unconfirmed, result.await())
            assertEquals(listOf(MemoryEndpoint.Submit, MemoryEndpoint.Operation), port.calls)
        }

    @Test
    fun malformedSavedPayloadCannotCreateASavedState() =
        runTest {
            val port = CapturePortFixture()
            val repository = NativeCaptureRepository(port)
            val result = async { repository.execute(repository.tell("Dato ficticio")) }
            runCurrent()
            port.completion?.invoke(NativeMemoryReply.Received("""{"apiVersion":2,"status":"saved"}"""))
            assertEquals(CaptureOutcome.Unconfirmed, result.await())
        }

    @Test
    fun cancellationRemovesTheNativeCallbackAndLateResponsesCannotCompleteTheRequest() =
        runTest {
            val port = CapturePortFixture()
            val repository = NativeCaptureRepository(port)
            val result = async { repository.execute(repository.tell("Dato ficticio")) }
            runCurrent()
            result.cancel()
            runCurrent()
            assertTrue(port.cancelled)
            port.completion?.invoke(NativeMemoryReply.Received("{}"))
            assertTrue(result.isCancelled)
        }

    @Test
    fun anUnavailableWriteChecksTheReceiptWithoutRepeatingTheWrite() =
        runTest {
            for (status in listOf("failed", "processing")) {
                val port = CapturePortFixture()
                port.response = { endpoint ->
                    if (endpoint == MemoryEndpoint.Submit) {
                        NativeMemoryReply.Failed(CaptureIssue.Unavailable)
                    } else {
                        NativeMemoryReply.Received(
                            """{"apiVersion":2,"operationId":"00000000-0000-4000-8000-000000000001",
                    "status":"$status"}""",
                        )
                    }
                }
                val repository = NativeCaptureRepository(port)
                val result = repository.execute(repository.tell("Prueba ficticia."))
                assertEquals(
                    if (status ==
                        "failed"
                    ) {
                        CaptureOutcome.Failed(CaptureIssue.Unavailable)
                    } else {
                        CaptureOutcome.Processing
                    },
                    result,
                )
                assertEquals(listOf(MemoryEndpoint.Submit, MemoryEndpoint.Operation), port.calls)
            }
        }

    @Test
    fun aLostWriteResponseCanRecoverAnAlreadySavedReceipt() =
        runTest {
            val port = CapturePortFixture()
            port.response = { endpoint ->
                if (endpoint == MemoryEndpoint.Submit) {
                    NativeMemoryReply.Failed(CaptureIssue.Unavailable)
                } else {
                    NativeMemoryReply.Received(savedPayload("1"))
                }
            }
            val repository = NativeCaptureRepository(port)
            assertIs<CaptureOutcome.Saved>(repository.execute(repository.tell("Dato ficticio.")))
            assertEquals(listOf(MemoryEndpoint.Submit, MemoryEndpoint.Operation), port.calls)
        }

    @Test
    fun invalidCommitRevisionsCannotConfirmASave() =
        runTest {
            for (epoch in listOf("null", "0", "-1", "1.5", "\"1\"", "9007199254740992")) {
                val port = CapturePortFixture()
                val repository = NativeCaptureRepository(port)
                val result = async { repository.execute(repository.tell("Dato ficticio")) }
                runCurrent()
                port.completion?.invoke(NativeMemoryReply.Received(savedPayload("1", epoch)))
                assertEquals(CaptureOutcome.Unconfirmed, result.await())
            }
        }

    private fun savedPayload(
        count: String,
        epoch: String = "1.0",
    ): String {
        val id = "00000000-0000-4000-8000-000000000001"
        return """{"apiVersion":2e0,"operationId":"$id","status":"saved","sourceId":"$id",
            "memoryCount":$count,"memoryEpoch":$epoch,"source":{"sourceId":"$id","text":"Dato ficticio",
            "receivedAt":"2026-11-13T17:00:00.000Z"}}"""
    }
}

private class CapturePortFixture : NativeMemoryPort {
    var cancelled = false
    var completion: ((NativeMemoryReply) -> Unit)? = null
    val calls = mutableListOf<MemoryEndpoint>()
    var response: (MemoryEndpoint) -> NativeMemoryReply? = { null }

    override fun requestId() = "00000000-0000-4000-8000-000000000001"

    override fun timeZone() = "Europe/Madrid"

    override fun call(
        endpoint: MemoryEndpoint,
        json: String,
        completion: (NativeMemoryReply) -> Unit,
    ): NativeCancellation {
        this.completion = completion
        calls.add(endpoint)
        response(endpoint)?.let(completion)
        return NativeCancellation { cancelled = true }
    }
}
