package io.github.dejitarunoseireinoapuri.kioku.data

import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceCitation
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.intOrNull
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject

internal fun parseQueryCitations(value: JsonObject): List<ReferenceCitation> {
    val citations =
        value["citations"]
            ?.jsonArray
            ?.map { raw ->
                val item = raw.jsonObject
                val fields = setOf("sourceId", "revision", "title", "location", "number", "text")
                require(item.keys == fields || item.keys == fields + "url")
                val id = item.citationText("sourceId", CITATION_ID_LENGTH)
                val revision = item.citationText("revision", CITATION_ID_LENGTH)
                require(id.matches(CITATION_UUID) && revision.matches(CITATION_UUID))
                val number = item["number"] as? JsonPrimitive
                require(number != null && !number.isString && number.intOrNull?.let { it in 1..MAX_LOCATOR } == true)
                val location = item.citationText("location", MAX_LOCATION)
                require(location in setOf("page", "paragraph", "line", "section"))
                val url = item["url"]?.let { item.citationText("url", MAX_URL) }
                require(url == null || (url.startsWith("https://") && url.none { it.isWhitespace() }))
                ReferenceCitation(
                    id,
                    revision,
                    item.citationText("title", MAX_TITLE),
                    location,
                    requireNotNull(number.intOrNull),
                    item.citationText("text", MAX_QUOTE),
                    url,
                )
            }.orEmpty()
    require(citations.size <= MAX_CITATIONS && citations.distinct().size == citations.size)
    return citations
}

private fun JsonObject.citationText(
    key: String,
    max: Int,
): String {
    val value = get(key) as? JsonPrimitive
    require(value?.isString == true && value.content.length in 1..max)
    return value.content
}

private const val CITATION_ID_LENGTH = 36
private const val MAX_LOCATOR = 200_000
private const val MAX_LOCATION = 12
private const val MAX_URL = 4096
private const val MAX_TITLE = 200
private const val MAX_QUOTE = 2000
private const val MAX_CITATIONS = 12
private val CITATION_UUID = Regex("[a-fA-F0-9]{8}(-[a-fA-F0-9]{4}){3}-[a-fA-F0-9]{12}")
