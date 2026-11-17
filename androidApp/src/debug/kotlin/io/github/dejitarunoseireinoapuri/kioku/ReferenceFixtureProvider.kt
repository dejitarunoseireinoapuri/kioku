package io.github.dejitarunoseireinoapuri.kioku

import android.content.ContentProvider
import android.content.ContentValues
import android.database.Cursor
import android.database.MatrixCursor
import android.net.Uri
import android.os.ParcelFileDescriptor
import android.provider.OpenableColumns
import java.io.File

/** Debug-only provider of generated fixtures; it cannot select or expose owner files. */
class ReferenceFixtureProvider : ContentProvider() {
    override fun onCreate() = true

    override fun getType(uri: Uri): String = if (key(uri) == "markdown") "text/markdown" else "text/plain"

    override fun query(
        uri: Uri,
        projection: Array<out String>?,
        selection: String?,
        selectionArgs: Array<out String>?,
        sortOrder: String?,
    ): Cursor {
        val item = key(uri)
        if (item == "denied") throw SecurityException("Synthetic denied fixture")
        return MatrixCursor(arrayOf(OpenableColumns.DISPLAY_NAME, OpenableColumns.SIZE)).apply {
            addRow(arrayOf<Any>(if (item == "markdown") "Manual ficticio.md" else "Itinerario ficticio.txt", 0L))
        }
    }

    override fun openFile(
        uri: Uri,
        mode: String,
    ): ParcelFileDescriptor {
        if (mode != "r") throw SecurityException("Read-only fixture")
        val item = key(uri)
        val file = File(requireNotNull(context).cacheDir, "kioku-reference-fixture-$item.txt")
        if (item ==
            "oversize"
        ) {
            file.outputStream().use { output -> repeat(OVERSIZE_BLOCKS) { output.write(ByteArray(BLOCK)) } }
        } else {
            file.writeText("Nara visitará el planetario ficticio.\nLira elige un cuaderno violeta.", Charsets.UTF_8)
        }
        return ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY)
    }

    override fun delete(
        uri: Uri,
        selection: String?,
        selectionArgs: Array<out String>?,
    ): Int {
        val file = File(requireNotNull(context).cacheDir, "kioku-reference-fixture-${key(uri)}.txt")
        return if (file.delete()) 1 else 0
    }

    override fun insert(
        uri: Uri,
        values: ContentValues?,
    ): Uri? = throw SecurityException("Read-only fixture")

    override fun update(
        uri: Uri,
        values: ContentValues?,
        selection: String?,
        selectionArgs: Array<out String>?,
    ) = throw SecurityException("Read-only fixture")

    private fun key(uri: Uri): String {
        val item = uri.lastPathSegment.orEmpty()
        if (item !in setOf("note", "markdown", "oversize", "denied")) throw SecurityException("Unknown fixture")
        return item
    }

    private companion object {
        const val BLOCK = 8192
        const val OVERSIZE_BLOCKS = 1281
    }
}
