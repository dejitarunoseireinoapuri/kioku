package io.github.dejitarunoseireinoapuri.kioku.platform

import android.os.Build
import android.os.ParcelFileDescriptor
import android.system.ErrnoException
import android.system.Os
import android.system.OsConstants
import android.system.StructPollfd
import java.util.concurrent.atomic.AtomicBoolean

/** Bounded nonblocking writes make cancellation independent of a stalled recognition service. */
internal class PcmVoicePipe {
    private val descriptors = ParcelFileDescriptor.createPipe()
    val source = descriptors[0]
    private val writer = descriptors[1]
    private val open = AtomicBoolean(true)

    init {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            val flags = Os.fcntlInt(writer.fileDescriptor, OsConstants.F_GETFL, 0)
            Os.fcntlInt(writer.fileDescriptor, OsConstants.F_SETFL, flags or OsConstants.O_NONBLOCK)
        } else {
            error("Nonblocking voice pipe requires Android 11")
        }
    }

    fun write(
        bytes: ByteArray,
        length: Int = bytes.size,
    ): Boolean {
        var offset = 0
        val poll =
            StructPollfd().apply {
                fd = writer.fileDescriptor
                events = OsConstants.POLLOUT.toShort()
            }
        while (offset < length && open.get()) {
            if (Os.poll(arrayOf(poll), POLL_MILLIS) == 0) continue
            if (!open.get()) return false
            try {
                val count = Os.write(writer.fileDescriptor, bytes, offset, minOf(PIPE_CHUNK_BYTES, length - offset))
                offset += count
            } catch (error: ErrnoException) {
                if (error.errno != OsConstants.EAGAIN) throw error
            }
        }
        return offset == length
    }

    fun finish() {
        if (open.getAndSet(false)) writer.close()
    }

    fun cancel() {
        finish()
        source.close()
    }

    private companion object {
        const val POLL_MILLIS = 100
        const val PIPE_CHUNK_BYTES = 4096
    }
}
