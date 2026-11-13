package io.github.dejitarunoseireinoapuri.kioku.platform

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.functions.FirebaseFunctions
import com.google.firebase.functions.FirebaseFunctionsException
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
        val name =
            when (endpoint) {
                MemoryEndpoint.Submit -> "submitTurn"
                MemoryEndpoint.Clarify -> "resolveClarification"
                MemoryEndpoint.Operation -> "getOperation"
            }
        var cancelled = false
        val objectValue = JSONObject(json)
        val payload = objectValue.keys().asSequence().associateWith { objectValue.get(it) }
        val callable = functions.getHttpsCallable(name).apply { setTimeout(185, TimeUnit.SECONDS) }
        callable.call(payload).addOnCompleteListener { task ->
            if (!cancelled && auth.currentUser?.uid == uid) {
                val value = task.resultOrNull()?.data as? Map<*, *>
                val reply =
                    if (task.isSuccessful && value != null) {
                        NativeMemoryReply.Received(JSONObject(value).toString())
                    } else {
                        NativeMemoryReply.Failed(issue(task.exception))
                    }
                completion(reply)
            }
        }
        return NativeCancellation { cancelled = true }
    }

    private fun issue(error: Exception?): CaptureIssue =
        when ((error as? FirebaseFunctionsException)?.code) {
            FirebaseFunctionsException.Code.PERMISSION_DENIED, FirebaseFunctionsException.Code.UNAUTHENTICATED -> {
                CaptureIssue.Denied
            }

            FirebaseFunctionsException.Code.INVALID_ARGUMENT -> {
                CaptureIssue.Invalid
            }

            FirebaseFunctionsException.Code.RESOURCE_EXHAUSTED -> {
                CaptureIssue.Limited
            }

            FirebaseFunctionsException.Code.FAILED_PRECONDITION -> {
                CaptureIssue.NotConfigured
            }

            else -> {
                CaptureIssue.Unavailable
            }
        }
}

private fun <T> com.google.android.gms.tasks.Task<T>.resultOrNull(): T? = if (isSuccessful) result else null
