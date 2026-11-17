package io.github.dejitarunoseireinoapuri.kioku

import io.github.dejitarunoseireinoapuri.kioku.data.MemoryEndpoint
import io.github.dejitarunoseireinoapuri.kioku.data.NativeCancellation
import io.github.dejitarunoseireinoapuri.kioku.data.NativeMemoryControlRepository
import io.github.dejitarunoseireinoapuri.kioku.data.NativeMemoryPort
import io.github.dejitarunoseireinoapuri.kioku.data.NativeMemoryReply
import io.github.dejitarunoseireinoapuri.kioku.domain.ChangeAction
import io.github.dejitarunoseireinoapuri.kioku.domain.ForgetScope
import io.github.dejitarunoseireinoapuri.kioku.domain.MemoryChange
import io.github.dejitarunoseireinoapuri.kioku.domain.SourceKind
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.async
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertIs
import kotlin.test.assertNull
import kotlin.test.assertTrue

@OptIn(ExperimentalCoroutinesApi::class)
class NativeMemoryControlRepositoryTest {
    @Test
    fun nativeWholeNumbersAreAcceptedAndForeignItemsRejected() =
        runTest {
            val port = ControlPort()
            val repository = NativeMemoryControlRepository(port)
            port.response =
                """{"apiVersion":2.0,"sourceId":"$CONTROL_SOURCE","version":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","text":"Dato ficticio","receivedAt":"2026-11-14T12:00:00Z","memoryEpoch":0.0,"items":[{"id":"00000000-0000-4000-8000-000000000083","text":"Dato ficticio"}]}"""
            assertEquals(0, repository.details(CONTROL_SOURCE)?.memoryRevision)
            port.response = port.response.replace("\"version\":", "\"sourceKind\":\"retained\",\"version\":")
            assertEquals(SourceKind.Retained, repository.details(CONTROL_SOURCE)?.source?.kind)
            port.response = port.response.replace("retained", "invented")
            assertNull(repository.details(CONTROL_SOURCE))
            port.response = port.response.replace("invented", "retained")
            port.response = port.response.replace("00000000-0000-4000-8000-000000000083", "other-1")
            assertNull(repository.details(CONTROL_SOURCE))
            assertEquals(MemoryEndpoint.SourceDetails, port.endpoint)
        }

    @Test
    fun onlyTheMatchingOperationAndActionCanCreateAConfirmedState() =
        runTest {
            val port = ControlPort()
            val repository = NativeMemoryControlRepository(port)
            val command =
                repository.prepare(
                    ControlFixture().source,
                    listOf("00000000-0000-4000-8000-000000000083"),
                    ChangeAction.Forget,
                    null,
                )
            port.response = result("forgotten", "1.0")
            assertIs<MemoryChange.Confirmed>(repository.execute(command))
            assertTrue(port.payload.contains("\"forgetScope\":\"source\""))
            assertIs<MemoryChange.Confirmed>(repository.execute(command.copy(forgetScope = ForgetScope.AllOccurrences)))
            assertTrue(port.payload.contains("\"forgetScope\":\"allOccurrences\""))
            port.response = result("forgotten", "1.5")
            assertIs<MemoryChange.Failed>(repository.execute(command))
            port.response = result("forgotten", "1.0").replace(CONTROL_REQUEST, CONTROL_SOURCE)
            assertIs<MemoryChange.Failed>(repository.execute(command))
            port.response = result("forgotten", "1.0")
            assertIs<MemoryChange.Failed>(repository.execute(command.copy(action = ChangeAction.Correct)))
        }

    @Test
    fun continuationMustMatchTheSelectedSourceAndOnlyContainsCurrentIds() =
        runTest {
            val port = ControlPort()
            val repository = NativeMemoryControlRepository(port)
            val command =
                repository.prepare(
                    ControlFixture().source,
                    listOf("00000000-0000-4000-8000-000000000083"),
                    ChangeAction.Forget,
                    null,
                )
            val current = "55c71022-d326-4287-bd74-93413809da74"
            val reply =
                """
                {"apiVersion":2,"operationId":"$CONTROL_REQUEST","status":"forgotten",
                "text":"Cambio confirmado","sources":[{"sourceId":"$current","receivedAt":"2026-11-15T12:00:00Z"}],
                "memoryEpoch":1,"changes":[{"sourceId":"$CONTROL_SOURCE","sourceIds":["$current"]}]}
                """.trimIndent()
            port.response = reply
            val confirmed = assertIs<MemoryChange.Confirmed>(repository.execute(command))
            assertEquals(listOf(current), confirmed.sourceIds)
            assertEquals(CONTROL_SOURCE, confirmed.previousSourceId)
            assertTrue(port.payload.contains("\"continueManagement\":true"))
            port.response = reply.replace("\"sourceIds\":[\"$current\"]", "\"sourceIds\":[]")
            assertIs<MemoryChange.Failed>(repository.execute(command))
            port.response = reply.replace("\"sourceId\":\"$CONTROL_SOURCE\"", "\"sourceId\":\"$CONTROL_REQUEST\"")
            assertIs<MemoryChange.Failed>(repository.execute(command))
        }

    @Test
    fun cancellationDiscardsNativeCallbacksAndCancelsTheHandle() =
        runTest {
            val port = ControlPort().apply { deferred = true }
            val pending = async { NativeMemoryControlRepository(port).revision() }
            runCurrent()
            pending.cancel()
            runCurrent()
            port.completion?.invoke(NativeMemoryReply.Received("""{"apiVersion":2,"memoryEpoch":1}"""))
            assertTrue(pending.isCancelled)
            assertEquals(1, port.cancellations)
        }

    private fun result(
        status: String,
        revision: String,
    ) =
        """{"apiVersion":2.0,"operationId":"$CONTROL_REQUEST","status":"$status","text":"Cambio confirmado","sources":[],"memoryEpoch":$revision}"""
}

private const val CONTROL_REQUEST = "d8da9bb7-0dbb-4769-8c3c-e9b527cc350f"

private class ControlPort : NativeMemoryPort {
    var payload = ""
    var response = ""
    var deferred = false
    var endpoint: MemoryEndpoint? = null
    var completion: ((NativeMemoryReply) -> Unit)? = null
    var cancellations = 0

    override fun requestId() = CONTROL_REQUEST

    override fun timeZone() = "Europe/Madrid"

    override fun call(
        endpoint: MemoryEndpoint,
        json: String,
        completion: (NativeMemoryReply) -> Unit,
    ): NativeCancellation {
        this.endpoint = endpoint
        payload = json
        this.completion = completion
        if (!deferred) completion(NativeMemoryReply.Received(response))
        return object : NativeCancellation {
            override fun cancel() {
                cancellations++
            }
        }
    }
}
