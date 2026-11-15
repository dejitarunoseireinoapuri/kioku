package io.github.dejitarunoseireinoapuri.kioku.data

import io.github.dejitarunoseireinoapuri.kioku.domain.ChangeAction
import io.github.dejitarunoseireinoapuri.kioku.domain.EditableSource
import io.github.dejitarunoseireinoapuri.kioku.domain.MemoryChange
import io.github.dejitarunoseireinoapuri.kioku.domain.MemoryItem
import io.github.dejitarunoseireinoapuri.kioku.domain.MemorySource
import io.github.dejitarunoseireinoapuri.kioku.domain.SourceReplacement
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.doubleOrNull
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject

internal fun parseEditableSource(
    json: String,
    id: String,
): EditableSource {
    val value = controlObject(json)
    val fields = setOf("apiVersion", "sourceId", "version", "text", "receivedAt", "memoryEpoch", "items")
    require(value.keys == fields || value.keys == fields + "sourceKind")
    require(value.controlText("sourceId") == id && id.matches(CONTROL_UUID))
    val version = value.controlText("version")
    val text = value.controlText("text")
    val date = value.controlText("receivedAt")
    require(
        version.matches(Regex("[a-f0-9]{64}")) && text.length in 1..MAX_CONTROL_SOURCE &&
            date.matches(CONTROL_DATE),
    )
    val items =
        value.getValue("items").jsonArray.map { element ->
            val item = element.jsonObject
            require(item.keys == setOf("id", "text"))
            val itemId = item.controlText("id")
            val itemText = item.controlText("text")
            require(itemId in (1..MAX_CONTROL_ITEMS).map { "$id-$it" } && itemText.length in 1..MAX_CONTROL_ITEM_TEXT)
            MemoryItem(itemId, itemText)
        }
    require(items.size in 1..MAX_CONTROL_ITEMS && items.distinctBy { it.id }.size == items.size)
    return EditableSource(
        MemorySource(id, text, date.take(CONTROL_DATE_LENGTH), receivedAt = date, kind = parseSourceKind(value)),
        version,
        items,
        controlRevision(value),
    )
}

internal fun parseMemoryRevision(json: String): Long {
    val value = controlObject(json)
    require(value.keys == setOf("apiVersion", "memoryEpoch"))
    return controlRevision(value)
}

internal fun parseMemoryChange(
    json: String,
    requestId: String,
): MemoryChange {
    val value = controlObject(json)
    val fields = setOf("apiVersion", "operationId", "status", "text", "sources", "memoryEpoch")
    require(value.keys - "changes" == fields)
    require(value.controlText("operationId") == requestId)
    val text = value.controlText("text")
    val sources = value.getValue("sources").jsonArray
    require(sources.size <= 2 && text.length <= MAX_CONTROL_ANSWER)
    val ids =
        sources.map { element ->
            val source = element.jsonObject
            require(source.keys == setOf("sourceId", "receivedAt"))
            require(source.controlText("receivedAt").matches(CONTROL_DATE))
            source.controlText("sourceId").also { require(it.matches(CONTROL_UUID)) }
        }
    require(ids.distinct().size == ids.size)
    val revision = controlRevision(value)
    val changes = parseSourceReplacements(value)
    val status = value.controlText("status")
    if (status in setOf("needsClarification", "processing")) require(sources.isEmpty() && changes.isEmpty())
    return when (status) {
        "corrected" -> {
            require(sources.isNotEmpty() && text.isNotBlank())
            MemoryChange.Confirmed(ChangeAction.Correct, revision, ids, replacements = changes)
        }

        "forgotten" -> {
            MemoryChange.Confirmed(ChangeAction.Forget, revision, ids, replacements = changes)
        }

        "needsClarification" -> {
            require(text.isNotBlank())
            MemoryChange.Clarification(text)
        }

        "processing" -> {
            require(text.isEmpty())
            MemoryChange.Processing
        }

        else -> {
            error("Invalid memory change")
        }
    }
}

private fun parseSourceReplacements(value: JsonObject): List<SourceReplacement> {
    val entries = value["changes"]?.jsonArray ?: return emptyList()
    require(entries.size <= MAX_CONTROL_CHANGES)
    val changes =
        entries.map { entry ->
            val item = entry.jsonObject
            require(item.keys == setOf("sourceId", "sourceIds"))
            val previous = item.controlText("sourceId").also { require(it.matches(CONTROL_UUID)) }
            val ids =
                item.getValue("sourceIds").jsonArray.map {
                    require(it is JsonPrimitive && it.isString)
                    it.content.also { id -> require(id.matches(CONTROL_UUID) && id != previous) }
                }
            require(ids.size <= 2 && ids.distinct().size == ids.size)
            SourceReplacement(previous, ids)
        }
    require(changes.distinctBy { it.sourceId }.size == changes.size)
    val ids = changes.flatMap { it.sourceIds }
    require(ids.distinct().size == ids.size && changes.none { it.sourceId in ids })
    return changes
}

private fun controlObject(json: String): JsonObject {
    require(json.length <= MAX_CONTROL_PAYLOAD)
    val value = Json.parseToJsonElement(json).jsonObject
    val version = value["apiVersion"] as? JsonPrimitive
    require(version != null && !version.isString && version.doubleOrNull == 1.0)
    return value
}

private fun JsonObject.controlText(key: String): String {
    val value = get(key) as? JsonPrimitive
    require(value?.isString == true)
    return value.content
}

private fun controlRevision(value: JsonObject): Long {
    val revision = value["memoryEpoch"] as? JsonPrimitive
    require(revision != null && !revision.isString)
    val number = requireNotNull(revision.doubleOrNull)
    require(number.isFinite() && number in 0.0..MAX_CONTROL_REVISION && number % 1.0 == 0.0)
    return number.toLong()
}

private val CONTROL_UUID = Regex("[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}")
private val CONTROL_DATE = Regex("\\d{4}-\\d{2}-\\d{2}T.+Z")

private const val MAX_CONTROL_SOURCE = 10020
private const val MAX_CONTROL_ITEM_TEXT = 1600
private const val MAX_CONTROL_ITEMS = 8
private const val CONTROL_DATE_LENGTH = 10
private const val MAX_CONTROL_ANSWER = 2400
private const val MAX_CONTROL_PAYLOAD = 80000
private const val MAX_CONTROL_CHANGES = 32
private const val MAX_CONTROL_REVISION = 9007199254740991.0
