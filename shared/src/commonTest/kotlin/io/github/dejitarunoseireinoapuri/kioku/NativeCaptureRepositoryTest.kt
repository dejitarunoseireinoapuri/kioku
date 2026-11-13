package io.github.dejitarunoseireinoapuri.kioku

import io.github.dejitarunoseireinoapuri.kioku.data.MemoryEndpoint
import io.github.dejitarunoseireinoapuri.kioku.data.NativeCancellation
import io.github.dejitarunoseireinoapuri.kioku.data.NativeCaptureRepository
import io.github.dejitarunoseireinoapuri.kioku.data.NativeMemoryPort
import io.github.dejitarunoseireinoapuri.kioku.data.NativeMemoryReply
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
            assertEquals(1, assertIs<CaptureOutcome.Saved>(result.await()).memoryCount)
        }

    @Test
    fun fractionalNativeNumbersCannotCreateASavedState() =
        runTest {
            val port = CapturePortFixture()
            val repository = NativeCaptureRepository(port)
            val result = async { repository.execute(repository.tell("Dato ficticio")) }
            runCurrent()
            port.completion?.invoke(NativeMemoryReply.Received(savedPayload("1.5")))
            assertEquals(CaptureOutcome.Processing, result.await())
        }

    @Test
    fun malformedSavedPayloadCannotCreateASavedState() =
        runTest {
            val port = CapturePortFixture()
            val repository = NativeCaptureRepository(port)
            val result = async { repository.execute(repository.tell("Dato ficticio")) }
            runCurrent()
            port.completion?.invoke(NativeMemoryReply.Received("""{"apiVersion":1,"status":"saved"}"""))
            assertEquals(CaptureOutcome.Processing, result.await())
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

    private fun savedPayload(count: String): String {
        val id = "00000000-0000-4000-8000-000000000001"
        return """{"apiVersion":1e0,"operationId":"$id","status":"saved","sourceId":"$id",
            "memoryCount":$count,"source":{"sourceId":"$id","text":"Dato ficticio",
            "receivedAt":"2026-11-13T17:00:00.000Z"}}"""
    }
}

private class CapturePortFixture : NativeMemoryPort {
    var cancelled = false
    var completion: ((NativeMemoryReply) -> Unit)? = null

    override fun requestId() = "00000000-0000-4000-8000-000000000001"

    override fun timeZone() = "Europe/Madrid"

    override fun call(
        endpoint: MemoryEndpoint,
        json: String,
        completion: (NativeMemoryReply) -> Unit,
    ): NativeCancellation {
        this.completion = completion
        return NativeCancellation { cancelled = true }
    }
}
