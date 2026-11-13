package io.github.dejitarunoseireinoapuri.kioku.data

import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureIssue
import io.github.dejitarunoseireinoapuri.kioku.domain.MemorySource
import io.github.dejitarunoseireinoapuri.kioku.domain.QueryCommand
import io.github.dejitarunoseireinoapuri.kioku.domain.QueryOutcome
import io.github.dejitarunoseireinoapuri.kioku.domain.QueryRepository
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withTimeoutOrNull
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import kotlin.coroutines.resume

class NativeQueryRepository(
    private val port: NativeMemoryPort,
) : QueryRepository {
    override fun prepare(text: String) = QueryCommand(port.requestId(), text)

    override suspend fun execute(command: QueryCommand): QueryOutcome {
        val invalid =
            when {
                command.text.isBlank() -> CaptureIssue.Invalid
                command.previousQuestions.size > MAX_CONTEXT_QUESTIONS -> CaptureIssue.MoreContext
                else -> null
            }
        if (invalid != null) return QueryOutcome.Failed(invalid)
        val question = queryQuestion(command)
        val reply =
            if (question.length > MAX_QUERY_TEXT_LENGTH) {
                NativeMemoryReply.Failed(CaptureIssue.MoreContext)
            } else {
                request(MemoryEndpoint.Query, payload("requestId", command.requestId, question))
            }
        return when (reply) {
            is NativeMemoryReply.Received -> {
                runCatching { parseQuery(reply.json, command.requestId) }
                    .getOrDefault(QueryOutcome.Failed(CaptureIssue.Unavailable))
            }

            is NativeMemoryReply.Failed -> {
                QueryOutcome.Failed(reply.issue)
            }
        }
    }

    override suspend fun source(id: String): MemorySource? {
        val reply = request(MemoryEndpoint.Source, payload("sourceId", id))
        return (reply as? NativeMemoryReply.Received)?.let { runCatching { parseQuerySource(it.json, id) }.getOrNull() }
    }

    private suspend fun request(
        endpoint: MemoryEndpoint,
        json: String,
    ): NativeMemoryReply =
        try {
            withTimeoutOrNull(QUERY_TIMEOUT_MS) {
                suspendCancellableCoroutine { continuation ->
                    val request = port.call(endpoint, json) { if (continuation.isActive) continuation.resume(it) }
                    continuation.invokeOnCancellation { request.cancel() }
                }
            } ?: NativeMemoryReply.Failed(CaptureIssue.Unavailable)
        } catch (error: CancellationException) {
            throw error
        } catch (_: Exception) {
            NativeMemoryReply.Failed(CaptureIssue.Unavailable)
        }

    private fun payload(
        key: String,
        id: String,
        text: String? = null,
    ) = buildJsonObject {
        put("apiVersion", 1)
        put(key, id)
        if (text != null) put("text", text)
    }.toString()
}

private const val QUERY_TIMEOUT_MS = 195_000L
private const val MAX_QUERY_TEXT_LENGTH = 2000
private const val MAX_CONTEXT_QUESTIONS = 4
