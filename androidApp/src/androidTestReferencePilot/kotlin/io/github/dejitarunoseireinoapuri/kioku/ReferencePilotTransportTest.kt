package io.github.dejitarunoseireinoapuri.kioku

import androidx.core.net.toUri
import androidx.test.platform.app.InstrumentationRegistry
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceImportResult
import io.github.dejitarunoseireinoapuri.kioku.pilot.PilotHttp
import io.github.dejitarunoseireinoapuri.kioku.pilot.PilotReferences
import io.github.dejitarunoseireinoapuri.kioku.platform.ReferenceDelivery
import io.github.dejitarunoseireinoapuri.kioku.platform.ReferenceFileReader
import kotlinx.coroutines.runBlocking
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class ReferencePilotTransportTest {
    @Test fun localSessionAndCatalogUseTheRealNativeTransport() =
        runBlocking {
            val result = PilotHttp().post("/catalog")
            assertTrue(result.has("epoch"))
            assertTrue(result.has("sources"))
        }

    @Test fun everyPackagedFictionalFormatIsReadAndExtractedThroughTheNativeRepository() =
        runBlocking {
            val context = InstrumentationRegistry.getInstrumentation().targetContext
            val reader = ReferenceFileReader(context.contentResolver)
            val http = PilotHttp()
            val repository = PilotReferences(http, reader)
            try {
                val inputs =
                    reader.describe(
                        ReferenceDelivery.Files(
                            (0 until FILE_COUNT).map {
                                "content://${context.packageName}.samples/$it".toUri()
                            },
                        ),
                    )
                val results = inputs.map { repository.importFile(it) }
                assertEquals(FILE_COUNT, results.size)
                assertTrue(results.all { it is ReferenceImportResult.Stored })
                val pdf = results[2] as ReferenceImportResult.Stored
                val evidence = repository.query("violet notebook", pdf.id).citations
                assertTrue(evidence.any { it.location == "page" && it.number == 2 })
                val web =
                    http.post(
                        "/web",
                        JSONObject()
                            .put("url", "https://kioku.example.test/guia")
                            .put(
                                "requestId",
                                java.util.UUID
                                    .randomUUID()
                                    .toString(),
                            ),
                    )
                assertEquals("ready", web.getString("state"))
            } finally {
                reader.close()
                repository.clearTransfers()
            }
        }

    private companion object {
        const val FILE_COUNT = 4
    }
}
