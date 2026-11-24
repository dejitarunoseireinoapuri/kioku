package io.github.dejitarunoseireinoapuri.kioku.platform

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.functions.FirebaseFunctions
import io.github.dejitarunoseireinoapuri.kioku.data.MemoryEndpoint
import io.github.dejitarunoseireinoapuri.kioku.data.NativeCancellation
import io.github.dejitarunoseireinoapuri.kioku.data.NativeMemoryPort
import io.github.dejitarunoseireinoapuri.kioku.data.NativeMemoryReply
import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureIssue
import org.json.JSONObject
import java.util.TimeZone
import java.util.UUID
import java.util.concurrent.TimeUnit

internal class AndroidMemoryPort(
    private val auth: FirebaseAuth,
    private val functions: FirebaseFunctions,
) : NativeMemoryPort {
    private var generation: Pair<String, String>? = null
    private var unifiedTurns = false

    override fun requestId(): String = UUID.randomUUID().toString()

    override fun timeZone(): String = TimeZone.getDefault().id

    override fun call(
        endpoint: MemoryEndpoint,
        json: String,
        completion: (NativeMemoryReply) -> Unit,
    ): NativeCancellation {
        val uid =
            auth.currentUser?.uid ?: run {
                completion(NativeMemoryReply.Failed(CaptureIssue.Denied))
                return NativeCancellation {}
            }
        var cancelled = false
        val objectValue = JSONObject(json)
        val payload = objectValue.keys().asSequence().associateWith { objectValue.get(it) }
        val active = { !cancelled && auth.currentUser?.uid == uid }
        resolveGeneration(uid) { current, failure ->
            if (active()) {
                if (current == null) {
                    completion(NativeMemoryReply.Failed(failure ?: CaptureIssue.Unavailable))
                } else {
                    send(endpoint, payload, current) { reply -> if (active()) completion(reply) }
                }
            }
        }
        return NativeCancellation { cancelled = true }
    }

    private fun resolveGeneration(
        uid: String,
        completion: (String?, CaptureIssue?) -> Unit,
    ) {
        generation?.takeIf { it.first == uid }?.let {
            completion(it.second, null)
            return
        }
        functions
            .getHttpsCallable("memoryV2")
            .call(mapOf("apiVersion" to 2, "operation" to "state"))
            .addOnCompleteListener { task ->
                val value = task.resultOrNull()?.data as? Map<*, *>
                val current = value?.get("generation") as? String
                val valid =
                    (value?.get("apiVersion") as? Number)?.toDouble() == 2.0 &&
                        current?.matches(MEMORY_GENERATION) == true
                if (task.isSuccessful && valid && auth.currentUser?.uid == uid) {
                    generation = uid to requireNotNull(current)
                    unifiedTurns = value["unifiedTurns"] == true
                    completion(current, null)
                } else {
                    completion(null, memoryTransportIssue(task.exception))
                }
            }
    }

    private fun send(
        endpoint: MemoryEndpoint,
        payload: Map<String, Any>,
        current: String,
        completion: (NativeMemoryReply) -> Unit,
    ) {
        val envelope =
            mapOf(
                "apiVersion" to 2,
                "operation" to endpoint.operation(),
                "generation" to current,
                "payload" to
                    if (endpoint == MemoryEndpoint.RouteMessage && !unifiedTurns) payload - "executionId" else payload,
            )
        val callable = functions.getHttpsCallable("memoryV2").apply { setTimeout(185, TimeUnit.SECONDS) }
        callable.call(envelope).addOnCompleteListener { task ->
            val value = task.resultOrNull()?.data as? Map<*, *>
            completion(
                if (task.isSuccessful && value != null) {
                    NativeMemoryReply.Received(JSONObject(value).toString())
                } else {
                    NativeMemoryReply.Failed(memoryTransportIssue(task.exception))
                },
            )
        }
    }
}

private fun <T> com.google.android.gms.tasks.Task<T>.resultOrNull(): T? = if (isSuccessful) result else null

private fun MemoryEndpoint.operation(): String =
    when (this) {
        MemoryEndpoint.Submit -> "submit"
        MemoryEndpoint.Clarify -> "clarify"
        MemoryEndpoint.Operation -> "operation"
        MemoryEndpoint.Query -> "query"
        MemoryEndpoint.Source -> "source"
        MemoryEndpoint.SourceDetails -> "details"
        MemoryEndpoint.Change -> "change"
        MemoryEndpoint.RouteMessage -> "route"
        MemoryEndpoint.ApplyMessage -> "apply"
    }

private val MEMORY_GENERATION = Regex("[a-fA-F0-9]{8}(-[a-fA-F0-9]{4}){3}-[a-fA-F0-9]{12}")
