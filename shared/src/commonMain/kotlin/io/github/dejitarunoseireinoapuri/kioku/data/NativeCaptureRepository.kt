package io.github.dejitarunoseireinoapuri.kioku.data

import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureCommand
import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureIssue
import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureOutcome
import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureRepository
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withTimeoutOrNull
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import kotlin.coroutines.resume

class NativeCaptureRepository(
    private val port: NativeMemoryPort,
) : CaptureRepository {
    override fun tell(text: String) = CaptureCommand.Tell(port.requestId(), text, port.timeZone())

    override fun clarify(
        text: String,
        id: String,
        revision: Int,
    ) = CaptureCommand.Clarify(port.requestId(), text, id, revision)

    override suspend fun execute(command: CaptureCommand): CaptureOutcome {
        val endpoint = if (command is CaptureCommand.Tell) MemoryEndpoint.Submit else MemoryEndpoint.Clarify
        val result = request(endpoint, capturePayload(command))
        return if (result == CaptureOutcome.Unconfirmed) recover(command.requestId) else result
    }

    override suspend fun recover(requestId: String): CaptureOutcome =
        request(
            MemoryEndpoint.Operation,
            buildJsonObject {
                put("apiVersion", 1)
                put("requestId", requestId)
            }.toString(),
        )

    private suspend fun request(
        endpoint: MemoryEndpoint,
        json: String,
    ): CaptureOutcome =
        try {
            withTimeoutOrNull(CAPTURE_TIMEOUT_MS) {
                suspendCancellableCoroutine { continuation ->
                    val request =
                        port.call(endpoint, json) { reply ->
                            val outcome = captureReply(reply)
                            if (continuation.isActive) continuation.resume(outcome)
                        }
                    continuation.invokeOnCancellation { request.cancel() }
                }
            } ?: CaptureOutcome.Unconfirmed
        } catch (error: CancellationException) {
            throw error
        } catch (_: Exception) {
            CaptureOutcome.Unconfirmed
        }
}

private fun captureReply(reply: NativeMemoryReply): CaptureOutcome =
    when (reply) {
        is NativeMemoryReply.Received -> {
            runCatching { parseCapture(reply.json) }.getOrDefault(CaptureOutcome.Unconfirmed)
        }

        is NativeMemoryReply.Failed -> {
            if (reply.issue == CaptureIssue.Unavailable) {
                CaptureOutcome.Unconfirmed
            } else {
                CaptureOutcome.Failed(reply.issue)
            }
        }
    }

private const val CAPTURE_TIMEOUT_MS = 195_000L
