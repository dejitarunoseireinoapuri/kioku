package io.github.dejitarunoseireinoapuri.kioku.data

import io.github.dejitarunoseireinoapuri.kioku.domain.AnswerStatus
import io.github.dejitarunoseireinoapuri.kioku.domain.MemorySource
import io.github.dejitarunoseireinoapuri.kioku.domain.QueryOutcome
import io.github.dejitarunoseireinoapuri.kioku.domain.QueryReference
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.doubleOrNull
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject

internal fun parseQuery(
    json: String,
    requestId: String,
): QueryOutcome {
    val value = queryObject(json)
    require(value.keys == setOf("apiVersion", "operationId", "status", "text", "sources"))
    require(value.queryText("operationId") == requestId)
    val status = value.queryText("status")
    val text = value.queryText("text")
    val sources =
        value.getValue("sources").jsonArray.map { element ->
            val source = element.jsonObject
            require(source.keys == setOf("sourceId", "receivedAt"))
            val id = source.queryText("sourceId")
            val date = source.queryText("receivedAt")
            require(id.matches(QUERY_UUID) && date.matches(QUERY_DATE))
            QueryReference(id, date.take(QUERY_DATE_LENGTH))
        }
    require(sources.size <= MAX_QUERY_SOURCES && sources.distinctBy { it.sourceId }.size == sources.size)
    if (status == "processing" || status == "repeatRequired") {
        require(text.isEmpty() && sources.isEmpty())
        return if (status == "processing") QueryOutcome.Processing else QueryOutcome.RepeatRequired
    }
    require(text.length in 1..MAX_ANSWER_LENGTH)
    require(status != "answered" || sources.isNotEmpty())
    val answerStatus =
        when (status) {
            "answered" -> AnswerStatus.Answered
            "notFound" -> AnswerStatus.NotFound
            "needsClarification" -> AnswerStatus.Clarification
            else -> error("Invalid query response")
        }
    return QueryOutcome.Reply(answerStatus, text, sources)
}

internal fun parseQuerySource(
    json: String,
    id: String,
): MemorySource {
    val source = queryObject(json)
    require(source.keys == setOf("apiVersion", "sourceId", "text", "receivedAt"))
    require(source.queryText("sourceId") == id && id.matches(QUERY_UUID))
    val text = source.queryText("text")
    val date = source.queryText("receivedAt")
    require(text.length in 1..MAX_QUERY_SOURCE_LENGTH && date.matches(QUERY_DATE))
    return MemorySource(id, text, date.take(QUERY_DATE_LENGTH))
}

private fun queryObject(json: String): JsonObject {
    require(json.length <= MAX_QUERY_RESPONSE_LENGTH)
    val value = Json.parseToJsonElement(json).jsonObject
    val version = value["apiVersion"] as? JsonPrimitive
    require(version != null && !version.isString && version.doubleOrNull == 1.0)
    return value
}

private fun JsonObject.queryText(key: String): String {
    val value = get(key) as? JsonPrimitive
    require(value?.isString == true)
    return value.content
}

private val QUERY_UUID = Regex("[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}")
private val QUERY_DATE = Regex("\\d{4}-\\d{2}-\\d{2}T.+Z")
private const val QUERY_DATE_LENGTH = 10
private const val MAX_QUERY_SOURCES = 6
private const val MAX_ANSWER_LENGTH = 2400
private const val MAX_QUERY_SOURCE_LENGTH = 10_020
private const val MAX_QUERY_RESPONSE_LENGTH = 40_000
