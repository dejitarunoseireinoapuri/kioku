package io.github.dejitarunoseireinoapuri.kioku.data

import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureIssue
import io.github.dejitarunoseireinoapuri.kioku.domain.ChangeAction
import io.github.dejitarunoseireinoapuri.kioku.domain.EditableSource
import io.github.dejitarunoseireinoapuri.kioku.domain.MemoryChange
import io.github.dejitarunoseireinoapuri.kioku.domain.MemoryChangeCommand
import io.github.dejitarunoseireinoapuri.kioku.domain.MemoryControlRepository
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withTimeoutOrNull
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.add
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import kotlinx.serialization.json.putJsonArray
import kotlin.coroutines.resume

class NativeMemoryControlRepository(
    private val port: NativeMemoryPort,
) : MemoryControlRepository {
    override suspend fun details(id: String): EditableSource? =
        received(
            request(
                MemoryEndpoint.SourceDetails,
                buildJsonObject {
                    put("apiVersion", 1)
                    put("sourceId", id)
                }.toString(),
            ),
        ) { parseEditableSource(it, id) }

    override suspend fun revision(): Long? =
        received(
            request(MemoryEndpoint.SourceDetails, "{\"apiVersion\":1}"),
        ) { parseMemoryRevision(it) }

    override fun prepare(
        source: EditableSource,
        ids: List<String>,
        action: ChangeAction,
        correction: String?,
    ) = MemoryChangeCommand(
        port.requestId(),
        source.source.id,
        source.version,
        ids,
        action,
        correction,
        port.timeZone(),
    )

    override suspend fun execute(command: MemoryChangeCommand): MemoryChange {
        val payload =
            buildJsonObject {
                put("apiVersion", 1)
                put("requestId", command.requestId)
                put("sourceId", command.sourceId)
                put("expectedVersion", command.expectedVersion)
                putJsonArray("memoryIds") { command.memoryIds.forEach { add(it) } }
                put("action", if (command.action == ChangeAction.Forget) "forget" else "correct")
                put("correction", command.correction?.let { JsonPrimitive(it) } ?: JsonNull)
                put("zone", command.zone)
            }.toString()
        return when (val reply = request(MemoryEndpoint.Change, payload)) {
            is NativeMemoryReply.Received -> {
                runCatching {
                    parseMemoryChange(reply.json, command.requestId).also { result ->
                        require(result !is MemoryChange.Confirmed || result.action == command.action)
                    }
                }.getOrDefault(MemoryChange.Failed(CaptureIssue.Unavailable))
            }

            is NativeMemoryReply.Failed -> {
                MemoryChange.Failed(reply.issue)
            }
        }
    }

    private fun <T> received(
        reply: NativeMemoryReply,
        parse: (String) -> T,
    ): T? = (reply as? NativeMemoryReply.Received)?.let { runCatching { parse(it.json) }.getOrNull() }

    private suspend fun request(
        endpoint: MemoryEndpoint,
        json: String,
    ): NativeMemoryReply =
        try {
            withTimeoutOrNull(CONTROL_TIMEOUT_MS) {
                suspendCancellableCoroutine { continuation ->
                    val handle = port.call(endpoint, json) { if (continuation.isActive) continuation.resume(it) }
                    continuation.invokeOnCancellation { handle.cancel() }
                }
            } ?: NativeMemoryReply.Failed(CaptureIssue.Unavailable)
        } catch (error: CancellationException) {
            throw error
        } catch (_: Exception) {
            NativeMemoryReply.Failed(CaptureIssue.Unavailable)
        }
}

private const val CONTROL_TIMEOUT_MS = 195000L
