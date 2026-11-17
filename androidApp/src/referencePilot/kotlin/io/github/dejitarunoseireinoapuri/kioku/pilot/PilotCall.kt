package io.github.dejitarunoseireinoapuri.kioku.pilot

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.awaitCancellation
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.IOException
import java.net.HttpURLConnection
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicReference

internal class PilotCall {
    private val closed = AtomicBoolean(false)
    private val active = AtomicReference<HttpURLConnection?>()

    fun attach(connection: HttpURLConnection) {
        active.set(connection)
        if (closed.get()) {
            connection.disconnect()
            throw IOException("Cancelled reference transport")
        }
    }

    fun close() {
        closed.set(true)
        active.getAndSet(null)?.disconnect()
    }
}

/** Cancelling the presentation scope also closes the blocking native HTTP connection. */
internal suspend fun <T> withPilotCall(block: (PilotCall) -> T): T =
    coroutineScope {
        val call = PilotCall()
        val watcher =
            launch(Dispatchers.Default) {
                try {
                    awaitCancellation()
                } finally {
                    call.close()
                }
            }
        try {
            withContext(Dispatchers.IO) { block(call) }
        } finally {
            watcher.cancel()
            call.close()
        }
    }
