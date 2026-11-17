package io.github.dejitarunoseireinoapuri.kioku.platform

import android.content.res.AssetFileDescriptor
import android.os.CancellationSignal
import android.os.OperationCanceledException
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceIssue
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.IOException
import java.util.concurrent.atomic.AtomicReference

internal class ReferenceReadLease {
    val signal = CancellationSignal()
    private val descriptor = AtomicReference<AssetFileDescriptor?>()

    fun attach(value: AssetFileDescriptor) {
        descriptor.set(value)
        if (signal.isCanceled) close()
        signal.throwIfCanceled()
    }

    fun close() {
        try {
            signal.cancel()
        } finally {
            try {
                descriptor.getAndSet(null)?.close()
            } catch (_: IOException) {
                // Already closed.
            }
        }
    }
}

/** Cancellation and the deadline both cancel the provider and close the owned descriptor. */
internal suspend fun <T> withReferenceRead(
    active: AtomicReference<ReferenceReadLease?>,
    block: (ReferenceReadLease) -> T,
): T =
    coroutineScope {
        val lease = ReferenceReadLease()
        if (!active.compareAndSet(null, lease)) throw ReferenceReadFailure(ReferenceIssue.Busy)
        val watchdog =
            launch(Dispatchers.Default) {
                try {
                    delay(READ_DEADLINE_MS)
                } finally {
                    lease.close()
                }
            }
        try {
            withContext(Dispatchers.IO) { block(lease) }
        } catch (
            _: SecurityException,
        ) {
            throw ReferenceReadFailure(ReferenceIssue.Permission)
        } catch (
            _: OperationCanceledException,
        ) {
            throw ReferenceReadFailure(ReferenceIssue.Interrupted)
        } catch (
            _: IOException,
        ) {
            throw ReferenceReadFailure(ReferenceIssue.Interrupted)
        } finally {
            watchdog.cancel()
            lease.close()
            active.compareAndSet(lease, null)
        }
    }

private const val READ_DEADLINE_MS = 15_000L
