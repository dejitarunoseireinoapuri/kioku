package io.github.dejitarunoseireinoapuri.kioku.platform

import android.content.ContentResolver
import android.database.Cursor
import android.net.Uri
import android.os.CancellationSignal
import android.provider.OpenableColumns
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceFormat
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceInput
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceIssue
import java.io.ByteArrayOutputStream
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicLong
import java.util.concurrent.atomic.AtomicReference

internal class ReferenceReadFailure(
    val issue: ReferenceIssue,
) : RuntimeException(issue.name)

/** Private operation-scoped handles only; no file paths, filesystem copies or persistent URI permission. */
internal class ReferenceFileReader(
    private val resolver: ContentResolver,
) {
    private val handles = ConcurrentHashMap<String, Uri>()
    private val totalRead = AtomicLong()
    private val active = AtomicReference<ReferenceReadLease?>()

    suspend fun describe(delivery: ReferenceDelivery.Files): List<ReferenceInput> =
        withReferenceRead(active) { lease ->
            if (delivery.uris.size > MAX_FILES) throw ReferenceReadFailure(ReferenceIssue.TooLarge)
            handles.clear()
            totalRead.set(0)
            delivery.uris.map { uri ->
                if (uri.scheme != "content") throw ReferenceReadFailure(ReferenceIssue.Permission)
                lease.signal.throwIfCanceled()
                try {
                    val metadata = metadata(uri, lease.signal)
                    val id = UUID.randomUUID().toString()
                    handles[id] = uri
                    ReferenceInput(id, metadata, referenceFormat(resolver.getType(uri), metadata))
                } catch (_: SecurityException) {
                    throw ReferenceReadFailure(ReferenceIssue.Permission)
                }
            }
        }

    suspend fun read(id: String): ByteArray =
        withReferenceRead(active) { lease ->
            val uri = handles.remove(id) ?: throw ReferenceReadFailure(ReferenceIssue.Permission)
            try {
                val asset =
                    resolver.openAssetFileDescriptor(uri, "r", lease.signal)
                        ?: throw ReferenceReadFailure(ReferenceIssue.Permission)
                lease.attach(asset)
                val stream = asset.createInputStream()
                stream.use { input ->
                    ByteArrayOutputStream().use { output ->
                        val buffer = ByteArray(READ_BUFFER)
                        while (true) {
                            lease.signal.throwIfCanceled()
                            val count = input.read(buffer)
                            if (count < 0) break
                            val total = totalRead.addAndGet(count.toLong())
                            if (output.size().toLong() + count > MAX_FILE_BYTES || total > MAX_BATCH_BYTES) {
                                throw ReferenceReadFailure(
                                    ReferenceIssue.TooLarge,
                                )
                            }
                            output.write(buffer, 0, count)
                        }
                        output.toByteArray()
                    }
                }
            } catch (_: SecurityException) {
                throw ReferenceReadFailure(ReferenceIssue.Permission)
            }
        }

    private fun metadata(
        uri: Uri,
        signal: CancellationSignal,
    ): String {
        resolver
            .query(
                uri,
                arrayOf(OpenableColumns.DISPLAY_NAME, OpenableColumns.SIZE),
                null,
                null,
                null,
                signal,
            )?.use { cursor ->
                if (cursor.moveToFirst()) return checkedMetadata(cursor)
            }
        throw ReferenceReadFailure(ReferenceIssue.Invalid)
    }

    private fun checkedMetadata(cursor: Cursor): String {
        val name = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
        val size = cursor.getColumnIndex(OpenableColumns.SIZE)
        val title = if (name >= 0) cursor.getString(name) else null
        val bytes = if (size >= 0 && !cursor.isNull(size)) cursor.getLong(size) else null
        val issue =
            when {
                bytes != null && (bytes < 0 || bytes > MAX_FILE_BYTES) -> ReferenceIssue.TooLarge
                !validTitle(title) -> ReferenceIssue.Invalid
                else -> null
            }
        if (issue != null) throw ReferenceReadFailure(issue)
        return requireNotNull(title)
    }

    private fun validTitle(title: String?): Boolean {
        if (title.isNullOrBlank()) return false
        return title.length <= MAX_TITLE && title.none { it == '/' || it == '\\' || it == '\u0000' }
    }

    fun close() {
        active.getAndSet(null)?.close()
        handles.clear()
        totalRead.set(0)
    }

    private companion object {
        const val MAX_FILES = 5
        const val MAX_TITLE = 200
        const val READ_BUFFER = 8192
        const val MAX_FILE_BYTES = 10L * 1024 * 1024
        const val MAX_BATCH_BYTES = 25L * 1024 * 1024
    }
}

private fun referenceFormat(
    mime: String?,
    title: String,
): ReferenceFormat =
    when (mime) {
        "text/plain" -> {
            ReferenceFormat.Text
        }

        "text/markdown", "text/x-markdown" -> {
            ReferenceFormat.Markdown
        }

        "application/pdf" -> {
            ReferenceFormat.Pdf
        }

        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" -> {
            ReferenceFormat.Docx
        }

        "application/octet-stream", null -> {
            when (title.substringAfterLast('.').lowercase()) {
                "txt" -> ReferenceFormat.Text
                "md", "markdown" -> ReferenceFormat.Markdown
                "pdf" -> ReferenceFormat.Pdf
                "docx" -> ReferenceFormat.Docx
                else -> throw ReferenceReadFailure(ReferenceIssue.Unsupported)
            }
        }

        else -> {
            throw ReferenceReadFailure(ReferenceIssue.Unsupported)
        }
    }
