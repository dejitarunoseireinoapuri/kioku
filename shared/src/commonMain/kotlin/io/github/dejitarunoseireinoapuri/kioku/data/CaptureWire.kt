package io.github.dejitarunoseireinoapuri.kioku.data

import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureCommand
import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureIssue
import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureOutcome
import io.github.dejitarunoseireinoapuri.kioku.domain.MemorySource
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.intOrNull
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.put

internal fun capturePayload(command: CaptureCommand): String =
    buildJsonObject {
        put("apiVersion", 1)
        put("requestId", command.requestId)
        put("text", command.text)
        when (command) {
            is CaptureCommand.Tell -> {
                put("mode", "tell")
                put("channel", "text")
                put("zone", command.zone)
            }

            is CaptureCommand.Clarify -> {
                put("clarificationId", command.clarificationId)
                put("expectedRevision", command.revision)
            }
        }
    }.toString()

internal fun parseCapture(json: String): CaptureOutcome {
    require(json.length <= MAX_RESPONSE_LENGTH)
    val value = Json.parseToJsonElement(json).jsonObject
    require(value["apiVersion"]?.jsonPrimitive?.intOrNull == 1)
    require(value.text("operationId").matches(UUID_PATTERN))
    return when (value.text("status")) {
        "saved" -> {
            saved(value)
        }

        "needsClarification" -> {
            require(
                value.keys == setOf("apiVersion", "status", "operationId", "clarificationId", "revision", "question"),
            )
            val id = value.text("clarificationId")
            val revision = value["revision"]?.jsonPrimitive?.intOrNull
            val question = value.text("question")
            require(
                id.matches(UUID_PATTERN) && revision in 1..MAX_CLARIFICATION_REVISION &&
                    question.length in 1..MAX_QUESTION_LENGTH,
            )
            CaptureOutcome.Clarification(id, requireNotNull(revision), question)
        }

        else -> {
            terminal(value)
        }
    }
}

private fun saved(value: JsonObject): CaptureOutcome.Saved {
    require(value.keys == setOf("apiVersion", "status", "operationId", "sourceId", "memoryCount", "source"))
    val source = value.getValue("source").jsonObject
    require(source.keys == setOf("sourceId", "text", "receivedAt"))
    val id = source.text("sourceId")
    val count = value["memoryCount"]?.jsonPrimitive?.intOrNull
    val text = source.text("text")
    val date = source.text("receivedAt")
    require(id.matches(UUID_PATTERN) && id == value.text("sourceId") && count in 1..MAX_MEMORY_COUNT)
    require(text.length in 1..MAX_SOURCE_LENGTH && date.matches(Regex("\\d{4}-\\d{2}-\\d{2}T.+Z")))
    return CaptureOutcome.Saved(MemorySource(id, text, date.take(DATE_LENGTH)), requireNotNull(count))
}

private fun terminal(value: JsonObject): CaptureOutcome {
    require(value.keys == setOf("apiVersion", "status", "operationId"))
    return when (value.text("status")) {
        "processing" -> CaptureOutcome.Processing
        "ignored" -> CaptureOutcome.Ignored
        "failed" -> CaptureOutcome.Failed(CaptureIssue.Unavailable)
        "expired" -> CaptureOutcome.Expired
        "needsRetelling" -> CaptureOutcome.Failed(CaptureIssue.MoreContext)
        else -> error("Invalid memory response")
    }
}

private fun JsonObject.text(key: String): String {
    val value = get(key) as? JsonPrimitive
    require(value?.isString == true)
    return value.content
}

private val UUID_PATTERN = Regex("[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}")
private const val MAX_RESPONSE_LENGTH = 40_000
private const val MAX_SOURCE_LENGTH = 10_020
private const val MAX_QUESTION_LENGTH = 500
private const val MAX_MEMORY_COUNT = 8
private const val MAX_CLARIFICATION_REVISION = 3
private const val DATE_LENGTH = 10
