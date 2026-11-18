package io.github.dejitarunoseireinoapuri.kioku

import android.content.ContentProvider
import android.content.ContentValues
import android.database.Cursor
import android.database.MatrixCursor
import android.graphics.Color
import android.graphics.Paint
import android.graphics.pdf.PdfDocument
import android.net.Uri
import android.os.ParcelFileDescriptor
import android.provider.OpenableColumns
import java.io.File

/** Debug-only provider of generated fixtures; it cannot select or expose owner files. */
class ReferenceFixtureProvider : ContentProvider() {
    override fun onCreate() = true

    override fun getType(uri: Uri): String =
        when (key(uri)) {
            "markdown" -> "text/markdown"
            "pdf" -> "application/pdf"
            else -> "text/plain"
        }

    override fun query(
        uri: Uri,
        projection: Array<out String>?,
        selection: String?,
        selectionArgs: Array<out String>?,
        sortOrder: String?,
    ): Cursor {
        val item = key(uri)
        if (item == "denied") throw SecurityException("Synthetic denied fixture")
        val title =
            when (item) {
                "markdown" -> "Manual ficticio.md"
                "pdf" -> "PDF ficticio de prueba.pdf"
                else -> "Itinerario ficticio.txt"
            }
        return MatrixCursor(arrayOf(OpenableColumns.DISPLAY_NAME, OpenableColumns.SIZE)).apply {
            addRow(arrayOf<Any>(title, 0L))
        }
    }

    override fun openFile(
        uri: Uri,
        mode: String,
    ): ParcelFileDescriptor {
        if (mode != "r") throw SecurityException("Read-only fixture")
        val item = key(uri)
        val file = fixtureFile(item)
        if (item == "pdf") {
            createPdf(file)
        } else if (item ==
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
        val file = fixtureFile(key(uri))
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
        if (item !in setOf("note", "markdown", "oversize", "denied", "pdf")) {
            throw SecurityException("Unknown fixture")
        }
        return item
    }

    private fun fixtureFile(item: String): File {
        val extension = if (item == "pdf") "pdf" else "txt"
        return File(requireNotNull(context).cacheDir, "kioku-reference-fixture-$item.$extension")
    }

    private fun createPdf(file: File) {
        val document = PdfDocument()
        try {
            val page = document.startPage(PdfDocument.PageInfo.Builder(PDF_WIDTH, PDF_HEIGHT, 1).create())
            val paint =
                Paint().apply {
                    color = Color.BLACK
                    textSize = PDF_FONT_SIZE
                }
            page.canvas.drawText("Documento ficticio de Kioku.", PDF_LEFT, PDF_TITLE_Y, paint)
            page.canvas.drawText("Lira usa un cuaderno violeta.", PDF_LEFT, PDF_BODY_Y, paint)
            document.finishPage(page)
            file.outputStream().use { document.writeTo(it) }
        } finally {
            document.close()
        }
    }

    private companion object {
        const val BLOCK = 8192
        const val OVERSIZE_BLOCKS = 1281
        const val PDF_WIDTH = 320
        const val PDF_HEIGHT = 480
        const val PDF_FONT_SIZE = 14f
        const val PDF_LEFT = 24f
        const val PDF_TITLE_Y = 42f
        const val PDF_BODY_Y = 64f
    }
}
