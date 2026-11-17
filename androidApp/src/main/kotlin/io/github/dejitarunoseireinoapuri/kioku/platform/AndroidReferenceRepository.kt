package io.github.dejitarunoseireinoapuri.kioku.platform

import android.util.Base64
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceAnswer
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceCitation
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceFailure
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceImportResult
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceInput
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceIssue
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceSummary
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceWorkspaceRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.security.MessageDigest

internal class AndroidReferenceRepository(
    private val http: ReferenceRpc,
    private val reader: ReferenceFileReader,
) : ReferenceWorkspaceRepository {
    private val transfers = mutableMapOf<String, JSONObject>()
    private val completed = mutableMapOf<String, ReferenceImportResult.Stored>()
    private var pendingWeb: Pair<String, String>? = null

    override suspend fun catalog(): List<ReferenceSummary> =
        http
            .post("/catalog")
            .getJSONArray("sources")
            .objects()
            .map {
                ReferenceSummary(
                    it.getString("id"),
                    it.getString("revision"),
                    it.getString("title"),
                    it.getBoolean("partial"),
                    it.getInt("fragments"),
                )
            }.also { current ->
                completed.entries.removeAll { entry ->
                    current.none {
                        it.id == entry.value.id && it.revision == entry.value.revision
                    }
                }
            }

    override suspend fun importFile(input: ReferenceInput): ReferenceImportResult {
        completed[input.id]?.let { return it }
        return try {
            val command = transfers[input.id] ?: prepare(input).also { transfers[input.id] = it }
            val admit =
                JSONObject()
                    .put("requestId", input.id)
                    .put("title", input.title)
                    .put("format", command.getString("format"))
                    .put("checksum", command.getString("checksum"))
            val admission = http.post("/admit", admit)
            val result =
                when (admission.getString("state")) {
                    "ready" -> {
                        admission
                    }

                    else -> {
                        val lease =
                            if (admission.has("lease")) {
                                admission.getString("lease")
                            } else {
                                http.post("/operation", JSONObject().put("requestId", input.id)).getString("lease")
                            }
                        val upload = JSONObject(command.toString()).apply { remove("checksum") }
                        http.post("/upload", JSONObject().put("lease", lease).put("command", upload))
                    }
                }
            stored(result).also {
                completed[input.id] = it
                transfers.remove(input.id)
            }
        } catch (error: ReferenceReadFailure) {
            ReferenceImportResult.Failed(error.issue)
        } catch (error: ReferenceFailure) {
            ReferenceImportResult.Failed(error.issue)
        }
    }

    private suspend fun prepare(input: ReferenceInput): JSONObject {
        val bytes = reader.read(input.id)
        return withContext(Dispatchers.Default) {
            val format = input.format.name.lowercase()
            val digest =
                MessageDigest
                    .getInstance("SHA-256")
                    .apply {
                        update(format.toByteArray(Charsets.UTF_8))
                        update(0.toByte())
                        update(bytes)
                    }.digest()
                    .joinToString("") { "%02x".format(it) }
            JSONObject()
                .put("apiVersion", 1)
                .put("requestId", input.id)
                .put("title", input.title)
                .put("format", format)
                .put("bytes", Base64.encodeToString(bytes, Base64.NO_WRAP))
                .put("checksum", digest)
        }
    }

    override suspend fun importWeb(
        url: String,
        requestId: String,
    ): ReferenceImportResult {
        val id = pendingWeb?.takeIf { it.first == url }?.second ?: requestId
        pendingWeb = url to id
        val result =
            try {
                http.post("/web", JSONObject().put("url", url).put("requestId", id))
            } catch (error: ReferenceFailure) {
                if (error.issue ==
                    ReferenceIssue.Conflict
                ) {
                    pendingWeb = null
                }
                throw error
            }
        if (result.optString("state") != "ready") {
            throw ReferenceFailure(ReferenceIssue.Busy)
        }
        return stored(result).also { pendingWeb = null }
    }

    override suspend fun read(source: ReferenceSummary): List<ReferenceCitation> {
        val current = http.post("/read", JSONObject().put("id", source.id))
        if (current.getString("revision") !=
            source.revision
        ) {
            throw ReferenceFailure(ReferenceIssue.Conflict)
        }
        return current.getJSONObject("document").getJSONArray("chunks").objects().map {
            citation(it, source.id, source.revision, source.title).copy(
                url = current.optJSONObject("origin")?.optString("url")?.takeIf { url -> url.isNotBlank() },
            )
        }
    }

    override suspend fun query(
        question: String,
        sourceId: String?,
    ): ReferenceAnswer {
        val reply =
            http.post(
                "/query",
                JSONObject().put("question", question).apply { sourceId?.let { put("sourceId", it) } },
            )
        return ReferenceAnswer(
            reply.optString("text").takeIf { it.isNotEmpty() },
            reply
                .getJSONArray("citations")
                .objects()
                .map {
                    citation(it, it.getString("sourceId"), it.getString("revision"), it.getString("title"))
                },
        )
    }

    override suspend fun forget(source: ReferenceSummary) {
        http.post("/forget", JSONObject().put("id", source.id).put("revision", source.revision))
        completed.entries.removeAll { it.value.id == source.id }
    }

    fun clearTransfers() {
        transfers.clear()
        completed.clear()
        pendingWeb = null
    }

    private fun stored(result: JSONObject): ReferenceImportResult.Stored {
        val source = result.getJSONObject("source")
        val document = source.getJSONObject("document")
        return ReferenceImportResult.Stored(
            source.getString("id"),
            source.getString("revision"),
            document.getJSONArray("chunks").length(),
            document.getString("coverage") == "partial",
        )
    }
}

private fun JSONArray.objects(): List<JSONObject> = (0 until length()).map { getJSONObject(it) }

private fun citation(
    item: JSONObject,
    id: String,
    revision: String,
    title: String,
): ReferenceCitation {
    val locator = item.getJSONObject("locator")
    return ReferenceCitation(
        id,
        revision,
        title,
        locator.getString("kind"),
        locator.getInt("number"),
        item.getString("text"),
        item.optJSONObject("origin")?.optString("url")?.takeIf { it.isNotBlank() },
    )
}
