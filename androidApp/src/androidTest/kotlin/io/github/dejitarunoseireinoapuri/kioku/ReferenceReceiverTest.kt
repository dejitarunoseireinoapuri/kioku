package io.github.dejitarunoseireinoapuri.kioku

import android.content.ClipData
import android.content.ComponentName
import android.content.Intent
import android.net.Uri
import androidx.test.platform.app.InstrumentationRegistry
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceFormat
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceIssue
import io.github.dejitarunoseireinoapuri.kioku.platform.ReferenceDelivery
import io.github.dejitarunoseireinoapuri.kioku.platform.ReferenceFileReader
import io.github.dejitarunoseireinoapuri.kioku.platform.ReferenceReadFailure
import io.github.dejitarunoseireinoapuri.kioku.platform.receiveReferences
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class ReferenceReceiverTest {
    private val context = InstrumentationRegistry.getInstrumentation().targetContext

    private fun uri(key: String = "note") = Uri.parse("content://${context.packageName}.reference-fixtures/$key")

    private fun single(key: String = "note") =
        Intent(Intent.ACTION_SEND)
            .setType("text/plain")
            .putExtra(Intent.EXTRA_STREAM, uri(key))
            .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)

    @Test fun realContentUriCanBeReadOnlyOnceAsAnOperationScopedHandle() =
        runBlocking {
            val intent = single().apply { clipData = ClipData.newRawUri("Ficticio", uri()) }
            val delivery = receiveReferences(intent) as ReferenceDelivery.Files
            assertEquals(1, delivery.uris.size)
            val reader = ReferenceFileReader(context.contentResolver)
            try {
                val item = reader.describe(delivery).single()
                assertEquals(ReferenceFormat.Text, item.format)
                assertTrue(reader.read(item.id).toString(Charsets.UTF_8).contains("planetario ficticio"))
                assertReadIssue(ReferenceIssue.Permission) { reader.read(item.id) }
            } finally {
                reader.close()
                context.contentResolver.delete(uri(), null, null)
            }
        }

    @Test fun markdownAndPermissionFailuresAreClassifiedWithoutGenericErrors() =
        runBlocking {
            val reader = ReferenceFileReader(context.contentResolver)
            try {
                assertEquals(
                    ReferenceFormat.Markdown,
                    reader.describe(ReferenceDelivery.Files(listOf(uri("markdown")))).single().format,
                )
                assertReadIssue(
                    ReferenceIssue.Permission,
                ) { reader.describe(ReferenceDelivery.Files(listOf(uri("denied")))) }
            } finally {
                reader.close()
            }
        }

    @Test fun actualBytesEnforceTheSizeCapEvenWhenTheProviderReportsZero() =
        runBlocking {
            val reader = ReferenceFileReader(context.contentResolver)
            try {
                val item = reader.describe(ReferenceDelivery.Files(listOf(uri("oversize")))).single()
                assertReadIssue(ReferenceIssue.TooLarge) { reader.read(item.id) }
            } finally {
                reader.close()
                context.contentResolver.delete(uri("oversize"), null, null)
            }
        }

    @Test fun missingGrantAndFilesystemUrisAreRejectedBeforeAnyRead() {
        assertEquals(ReferenceDelivery.Failed(ReferenceIssue.Permission), receiveReferences(single().setFlags(0)))
        val files = single().putExtra(Intent.EXTRA_STREAM, Uri.parse("file:///fictional/private.txt"))
        assertEquals(ReferenceDelivery.Failed(ReferenceIssue.Permission), receiveReferences(files))
    }

    @Test fun aSixthAttachmentIsRejectedInsteadOfSilentlyOmitted() {
        val intent =
            Intent(Intent.ACTION_SEND_MULTIPLE)
                .setType("text/plain")
                .putParcelableArrayListExtra(Intent.EXTRA_STREAM, ArrayList(List(6) { uri() }))
                .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        assertEquals(ReferenceDelivery.Failed(ReferenceIssue.TooLarge), receiveReferences(intent))
    }

    @Test fun browserLinksDriveLinksAndOrdinarySharedTextStayDifferent() {
        fun shared(text: String) =
            receiveReferences(Intent(Intent.ACTION_SEND).setType("text/plain").putExtra(Intent.EXTRA_TEXT, text))
        assertEquals(
            ReferenceDelivery.Web("https://reference.example.test/article"),
            shared("Título ficticio\nhttps://reference.example.test/article"),
        )
        assertEquals(
            ReferenceDelivery.Failed(ReferenceIssue.DriveLink),
            shared("https://drive.google.com/file/fictitious"),
        )
        assertEquals(ReferenceDelivery.Failed(ReferenceIssue.Invalid), shared("Un relato ficticio sin enlace"))
        assertEquals(
            ReferenceDelivery.Failed(ReferenceIssue.Invalid),
            shared("https://a.example.test https://b.example.test"),
        )
    }

    @Test fun sharingTargetsTheReusableChatWhileSourceManagementStaysPrivate() {
        val component = ComponentName(context, ReferenceImportActivity::class.java)
        val info =
            context.packageManager.getActivityInfo(
                component,
                android.content.pm.PackageManager.MATCH_DISABLED_COMPONENTS,
            )
        assertEquals(false, info.exported)
        assertTrue(info.enabled)
        val receiver =
            context.packageManager
                .resolveActivity(
                    single().setPackage(context.packageName),
                    android.content.pm.PackageManager.MATCH_DEFAULT_ONLY,
                )?.activityInfo
        assertEquals(MainActivity::class.java.name, receiver?.name)
        assertEquals(android.content.pm.ActivityInfo.LAUNCH_SINGLE_TASK, receiver?.launchMode)
    }

    private suspend fun assertReadIssue(
        expected: ReferenceIssue,
        operation: suspend () -> Any,
    ) {
        try {
            operation()
            throw AssertionError("Expected safe source issue")
        } catch (
            error: ReferenceReadFailure,
        ) {
            assertEquals(expected, error.issue)
        }
    }
}
