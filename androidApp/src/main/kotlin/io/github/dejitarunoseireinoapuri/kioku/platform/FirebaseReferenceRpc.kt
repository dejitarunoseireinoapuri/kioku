package io.github.dejitarunoseireinoapuri.kioku.platform

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.functions.FirebaseFunctions
import com.google.firebase.functions.FirebaseFunctionsException
import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureIssue
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceFailure
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceIssue
import kotlinx.coroutines.suspendCancellableCoroutine
import org.json.JSONArray
import org.json.JSONObject
import java.util.UUID
import java.util.concurrent.TimeUnit
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

/** Uses the same Firebase identity and attestation as memory; no client credential or Firestore write. */
internal class FirebaseReferenceRpc(
    private val auth: FirebaseAuth,
    private val functions: FirebaseFunctions,
) : ReferenceRpc {
    private val uid = auth.currentUser?.uid
    private var generation: String? = null
    private var query: Pair<String, String>? = null

    override suspend fun post(
        path: String,
        payload: JSONObject,
    ): JSONObject {
        var reply = request(path, payload)
        if (path == "/query" && reply.optString("status") == "repeatRequired") {
            // The previous job is confirmed terminal. One fresh read can now use current evidence.
            query = null
            reply = request(path, payload)
        }
        if (path == "/query") acceptQuery(reply)
        return reply
    }

    private suspend fun request(
        path: String,
        payload: JSONObject,
    ): JSONObject {
        checkIdentity()
        val current = generation ?: resolveGeneration().also { generation = it }
        val command = if (path == "/query") JSONObject(payload.toString()) else payload
        if (path == "/upload" &&
            (command.optJSONObject("command")?.optString("bytes")?.length ?: 0) > MAX_ENCODED_BYTES
        ) {
            throw ReferenceFailure(ReferenceIssue.TooLarge)
        }
        if (path == "/query") {
            val fingerprint = payload.toString()
            val id = query?.takeIf { it.first == fingerprint }?.second ?: UUID.randomUUID().toString()
            query = fingerprint to id
            command.put("requestId", id)
        }
        val reply =
            call(
                "referenceSources",
                mapOf(
                    "apiVersion" to 1,
                    "generation" to current,
                    "operation" to path.removePrefix("/"),
                    "payload" to referenceMap(command),
                ),
            )
        return reply
    }

    private fun acceptQuery(reply: JSONObject) {
        when (reply.optString("status")) {
            "processing" -> {
                throw ReferenceFailure(ReferenceIssue.Busy)
            }

            "repeatRequired" -> {
                query = null
                throw ReferenceFailure(ReferenceIssue.Interrupted)
            }

            else -> {
                query = null
            }
        }
    }

    private suspend fun resolveGeneration(): String {
        val reply = call("memoryV2", mapOf("apiVersion" to 2, "operation" to "state"))
        val value = reply.optString("generation")
        if (reply.optInt("apiVersion") != 2 || !value.matches(GENERATION)) {
            throw ReferenceFailure(ReferenceIssue.Unavailable)
        }
        return value
    }

    private fun checkIdentity() {
        if (uid == null || auth.currentUser?.uid != uid) throw ReferenceFailure(ReferenceIssue.SignInRequired)
    }

    private suspend fun call(
        name: String,
        data: Map<String, Any>,
    ): JSONObject =
        suspendCancellableCoroutine { continuation ->
            checkIdentity()
            functions
                .getHttpsCallable(name)
                .apply { setTimeout(REQUEST_SECONDS, TimeUnit.SECONDS) }
                .call(data)
                .addOnCompleteListener { task ->
                    if (continuation.isActive) {
                        val value = if (task.isSuccessful) task.result.data as? Map<*, *> else null
                        if (auth.currentUser?.uid != uid) {
                            continuation.resumeWithException(ReferenceFailure(ReferenceIssue.SignInRequired))
                        } else if (value != null) {
                            continuation.resume(JSONObject(value))
                        } else {
                            continuation.resumeWithException(ReferenceFailure(referenceTransportIssue(task.exception)))
                        }
                    }
                }
        }

    private companion object {
        const val MAX_ENCODED_BYTES = 8 * 1024 * 1024
        const val REQUEST_SECONDS = 245L
        val GENERATION = Regex("[a-fA-F0-9]{8}(-[a-fA-F0-9]{4}){3}-[a-fA-F0-9]{12}")
    }
}

private fun referenceTransportIssue(error: Exception?): ReferenceIssue {
    val failure = error as? FirebaseFunctionsException
    val details = failure?.details as? Map<*, *>
    if (memoryTransportIssue(error) in setOf(CaptureIssue.Connection, CaptureIssue.TimedOut)) {
        return ReferenceIssue.Connection
    }
    return when (details?.get("referenceIssue")) {
        "ai-unavailable", "unavailable" -> {
            ReferenceIssue.Unavailable
        }

        "interrupted" -> {
            ReferenceIssue.Interrupted
        }

        "too-large" -> {
            ReferenceIssue.TooLarge
        }

        "unsupported" -> {
            ReferenceIssue.Unsupported
        }

        "no-text" -> {
            ReferenceIssue.NoText
        }

        "invalid" -> {
            ReferenceIssue.Invalid
        }

        "conflict", "retired", "cancelled" -> {
            ReferenceIssue.Conflict
        }

        "denied" -> {
            ReferenceIssue.Permission
        }

        else -> {
            referenceCodeIssue(failure?.code)
        }
    }
}

private fun referenceCodeIssue(code: FirebaseFunctionsException.Code?): ReferenceIssue =
    when (code) {
        FirebaseFunctionsException.Code.UNAUTHENTICATED -> {
            ReferenceIssue.SignInRequired
        }

        FirebaseFunctionsException.Code.PERMISSION_DENIED -> {
            ReferenceIssue.Permission
        }

        FirebaseFunctionsException.Code.RESOURCE_EXHAUSTED -> {
            ReferenceIssue.Busy
        }

        FirebaseFunctionsException.Code.UNAVAILABLE, FirebaseFunctionsException.Code.DEADLINE_EXCEEDED -> {
            ReferenceIssue.Connection
        }

        else -> {
            ReferenceIssue.Unavailable
        }
    }

private fun referenceMap(value: JSONObject): Map<String, Any?> =
    value.keys().asSequence().associateWith { referenceValue(value.get(it)) }

private fun referenceValue(value: Any?): Any? =
    when (value) {
        is JSONObject -> referenceMap(value)
        is JSONArray -> (0 until value.length()).map { referenceValue(value.get(it)) }
        JSONObject.NULL -> null
        else -> value
    }
