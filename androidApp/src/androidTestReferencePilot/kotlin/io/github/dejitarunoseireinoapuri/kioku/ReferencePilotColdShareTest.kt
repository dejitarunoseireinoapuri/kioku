package io.github.dejitarunoseireinoapuri.kioku

import android.content.ClipData
import android.content.Intent
import androidx.core.net.toUri
import androidx.test.core.app.ActivityScenario
import androidx.test.platform.app.InstrumentationRegistry
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceImportResult
import io.github.dejitarunoseireinoapuri.kioku.feature.references.ReferenceWorkspaceState
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withTimeout
import org.junit.Assert.assertTrue
import org.junit.Test

class ReferencePilotColdShareTest {
    @Test fun anActualSendIntentStartsTheReceiverAndConfirmsItsExtractedText() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val uri = "content://${context.packageName}.samples/0".toUri()
        val intent =
            Intent(Intent.ACTION_SEND)
                .setClass(context, ReferencePilotActivity::class.java)
                .setType("text/plain")
                .putExtra(Intent.EXTRA_STREAM, uri)
                .addFlags(
                    Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK or
                        Intent.FLAG_ACTIVITY_CLEAR_TASK,
                ).apply { clipData = ClipData.newRawUri("Archivo ficticio", uri) }
        ActivityScenario.launch<ReferencePilotActivity>(intent).use { scenario ->
            lateinit var state: StateFlow<ReferenceWorkspaceState>
            scenario.onActivity { state = it.referenceState }
            val result =
                runBlocking {
                    withTimeout(DELIVERY_DEADLINE) { state.first { it.work == null && it.items.size == 1 } }
                }
            assertTrue(result.items.single().result is ReferenceImportResult.Stored)
            assertTrue(result.sources.isNotEmpty())
        }
    }

    private companion object {
        const val DELIVERY_DEADLINE = 30_000L
    }
}
