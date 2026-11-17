package io.github.dejitarunoseireinoapuri.kioku.pilot

import android.os.SystemClock
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceFailure
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceIssue
import io.github.dejitarunoseireinoapuri.kioku.platform.ReferenceRpc
import org.json.JSONException
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.io.IOException
import java.io.InputStream
import java.net.HttpURLConnection
import java.net.Proxy
import java.net.URL

/** This adapter has no configurable host, production credentials or AI endpoint. */
internal class PilotHttp : ReferenceRpc {
    private var token: String? = null
    private var signedInAt = 0L

    override suspend fun post(
        path: String,
        payload: JSONObject,
    ): JSONObject =
        withPilotCall { call ->
            try {
                if (token == null || SystemClock.elapsedRealtime() - signedInAt > SESSION_WINDOW_MS) {
                    token = exchange("/session", JSONObject(), null, call).getString("token")
                    signedInAt = SystemClock.elapsedRealtime()
                }
                exchange(path, payload, token, call)
            } catch (error: ReferenceFailure) {
                if (error.issue == ReferenceIssue.Permission) token = null
                throw error
            } catch (_: IOException) {
                throw ReferenceFailure(ReferenceIssue.Connection)
            } catch (_: JSONException) {
                throw ReferenceFailure(ReferenceIssue.Connection)
            }
        }

    private fun exchange(
        path: String,
        payload: JSONObject,
        bearer: String?,
        call: PilotCall,
    ): JSONObject {
        require(path in PATHS)
        val connection = URL("http://127.0.0.1:8787$path").openConnection(Proxy.NO_PROXY) as HttpURLConnection
        call.attach(connection)
        try {
            connection.requestMethod = "POST"
            connection.instanceFollowRedirects = false
            connection.connectTimeout = TIMEOUT_MS
            connection.readTimeout = TIMEOUT_MS
            connection.doOutput = true
            connection.setRequestProperty("Content-Type", "application/json")
            connection.setRequestProperty("Connection", "close")
            bearer?.let { connection.setRequestProperty("Authorization", "Bearer $it") }
            val bytes = payload.toString().toByteArray(Charsets.UTF_8)
            connection.setFixedLengthStreamingMode(bytes.size)
            connection.outputStream.use { it.write(bytes) }
            val successful = connection.responseCode == HttpURLConnection.HTTP_OK
            val stream = if (successful) connection.inputStream else connection.errorStream
            val body = stream?.use { readBody(it) } ?: throw ReferenceFailure(ReferenceIssue.Connection)
            if (!successful) throw ReferenceFailure(pilotIssue(body.optString("issue")))
            return body
        } finally {
            connection.disconnect()
        }
    }

    private fun readBody(input: InputStream): JSONObject =
        ByteArrayOutputStream().use { output ->
            val buffer = ByteArray(BUFFER_SIZE)
            while (true) {
                val count = input.read(buffer)
                if (count < 0) break
                if (output.size() + count > MAX_RESPONSE) throw ReferenceFailure(ReferenceIssue.TooLarge)
                output.write(buffer, 0, count)
            }
            JSONObject(output.toString(Charsets.UTF_8.name()))
        }

    private companion object {
        val PATHS =
            setOf(
                "/session",
                "/catalog",
                "/admit",
                "/operation",
                "/cancel",
                "/read",
                "/forget",
                "/query",
                "/upload",
                "/web",
                "/fixture",
            )
        const val TIMEOUT_MS = 45_000
        const val MAX_RESPONSE = 2 * 1024 * 1024
        const val BUFFER_SIZE = 8192
        const val SESSION_WINDOW_MS = 45L * 60 * 1000
    }
}

internal fun pilotIssue(issue: String): ReferenceIssue =
    when (issue) {
        "denied" -> ReferenceIssue.Permission
        "unsupported" -> ReferenceIssue.Unsupported
        "no-text" -> ReferenceIssue.NoText
        "too-large" -> ReferenceIssue.TooLarge
        "interrupted" -> ReferenceIssue.Interrupted
        "conflict", "retired" -> ReferenceIssue.Conflict
        "invalid" -> ReferenceIssue.Invalid
        "busy" -> ReferenceIssue.Busy
        else -> ReferenceIssue.Unavailable
    }
