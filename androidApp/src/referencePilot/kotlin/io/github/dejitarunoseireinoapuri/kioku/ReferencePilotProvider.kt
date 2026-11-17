package io.github.dejitarunoseireinoapuri.kioku

import android.content.ContentProvider
import android.content.ContentValues
import android.database.Cursor
import android.database.MatrixCursor
import android.net.Uri
import android.os.ParcelFileDescriptor
import android.provider.OpenableColumns
import java.io.File

/** Only the generated note is shareable. No owner path or external file can be opened here. */
class ReferencePilotProvider : ContentProvider() {
    override fun onCreate() = true

    override fun getType(uri: Uri): String = TYPES[key(uri)]

    override fun query(
        uri: Uri,
        projection: Array<out String>?,
        selection: String?,
        selectionArgs: Array<out String>?,
        sortOrder: String?,
    ): Cursor {
        val index = key(uri)
        return MatrixCursor(arrayOf(OpenableColumns.DISPLAY_NAME, OpenableColumns.SIZE)).apply {
            addRow(arrayOf<Any>(TITLES[index], 0L))
        }
    }

    override fun openFile(
        uri: Uri,
        mode: String,
    ): ParcelFileDescriptor {
        val index = key(uri)
        check(mode == "r")
        val owner = requireNotNull(context)
        val file = File(owner.cacheDir, "reference-pilot-generated-$index")
        owner.assets.open("reference-fixtures/$index.${EXTENSIONS[index]}").use { input ->
            file.outputStream().use { input.copyTo(it) }
        }
        return ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY)
    }

    override fun delete(
        uri: Uri,
        selection: String?,
        selectionArgs: Array<out String>?,
    ): Int = 0

    override fun insert(
        uri: Uri,
        values: ContentValues?,
    ): Uri? = throw SecurityException("Read-only fixture")

    override fun update(
        uri: Uri,
        values: ContentValues?,
        selection: String?,
        selectionArgs: Array<out String>?,
    ): Int = throw SecurityException("Read-only fixture")

    private fun key(uri: Uri): Int {
        val index = uri.lastPathSegment?.toIntOrNull()
        if (index == null || index !in TITLES.indices) throw SecurityException("Unknown fixture")
        return index
    }

    private companion object {
        val TITLES =
            listOf("Itinerario ficticio.txt", "Notas ficticias.md", "Viaje ficticio.pdf", "Manual ficticio.docx")
        val EXTENSIONS = listOf("txt", "md", "pdf", "docx")
        val TYPES =
            listOf(
                "text/plain",
                "text/markdown",
                "application/pdf",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )
    }
}
