package io.github.dejitarunoseireinoapuri.kioku

import android.content.ComponentName
import android.content.pm.PackageManager
import android.security.NetworkSecurityPolicy
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performTextReplacement
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.runner.lifecycle.ActivityLifecycleMonitorRegistry
import androidx.test.runner.lifecycle.Stage
import io.github.dejitarunoseireinoapuri.kioku.pilot.PilotHttp
import kotlinx.coroutines.runBlocking
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.FixMethodOrder
import org.junit.Rule
import org.junit.Test
import org.junit.runners.MethodSorters

@FixMethodOrder(MethodSorters.NAME_ASCENDING)
class ReferencePilotDeviceTest {
    @get:Rule val compose = createAndroidComposeRule<ReferencePilotActivity>()
    private val http = PilotHttp()

    @Test fun aSharedFilesReachTheRealLocalExtractorAndQueryShowsThePdfPage() {
        ready()
        val original = compose.activity
        compose.onNodeWithText("Cargar ejemplos ficticios").performScrollTo().performClick()
        compose.waitUntil(TIMEOUT) {
            compose.onAllNodesWithText("Texto confirmado por el servidor local").fetchSemanticsNodes().size ==
                FOUR_FILES &&
                idle()
        }
        val sources = catalog()
        assertTrue(sources.length() >= FOUR_FILES)
        compose.runOnIdle {
            val resumed = ActivityLifecycleMonitorRegistry.getInstance().getActivitiesInStage(Stage.RESUMED)
            assertTrue(resumed.any { it === original })
        }
        val pdf =
            (0 until sources.length())
                .map {
                    sources.getJSONObject(
                        it,
                    )
                }.single { it.getString("title").endsWith(".pdf") }
        compose.onNodeWithTag("reference-source-${pdf.getString("id")}").performScrollTo().performClick()
        compose.onNodeWithTag("reference-question").performScrollTo().performTextReplacement("violet notebook")
        compose.onNodeWithText("Buscar fragmentos").performScrollTo().performClick()
        compose.waitUntil(
            TIMEOUT,
        ) { compose.onAllNodesWithTag("reference-citation").fetchSemanticsNodes().isNotEmpty() }
        compose.onNodeWithText("Página 2").performScrollTo().assertIsDisplayed()
        captureVoiceWindow(compose.activity, "kioku-reference-pilot-query.png")
    }

    @Test fun bDeletingRequiresTheLocalDialogAndRevokesTheExactSource() {
        ready()
        val sources = catalog()
        val source =
            (0 until sources.length())
                .map {
                    sources.getJSONObject(it)
                }.single { it.getString("title").endsWith(".txt") }
        compose.onNodeWithTag("reference-source-${source.getString("id")}").performScrollTo().performClick()
        compose.onNodeWithText("Eliminar fuente").performScrollTo().performClick()
        assertEquals(sources.length(), catalog().length())
        compose.onNodeWithText("Cancelar").performClick()
        assertEquals(sources.length(), catalog().length())
        compose.onNodeWithText("Eliminar fuente").performScrollTo().performClick()
        compose.onNodeWithText("Sí, eliminar").performClick()
        val remaining = sources.length() - 1
        compose.waitUntil(TIMEOUT) {
            compose.onAllNodes(sourceButton()).fetchSemanticsNodes().size == remaining &&
                idle()
        }
        assertEquals(remaining, catalog().length())
        val citations =
            runBlocking {
                http
                    .post("/query", JSONObject().put("question", "planetario").put("sourceId", source.getString("id")))
                    .getJSONArray("citations")
            }
        assertEquals(0, citations.length())
    }

    @Test fun cPilotHasNoProductionConfigurationAndCanOnlyUseCleartextLoopback() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        assertTrue(context.packageName.endsWith(".references"))
        assertTrue("Pilot client configuration must be empty", BuildConfig.FIREBASE_APP_ID.isEmpty())
        assertTrue("Pilot client configuration must be empty", BuildConfig.FIREBASE_API_KEY.isEmpty())
        assertTrue("Pilot client configuration must be empty", BuildConfig.GOOGLE_WEB_CLIENT_ID.isEmpty())
        assertTrue(NetworkSecurityPolicy.getInstance().isCleartextTrafficPermitted("127.0.0.1"))
        assertFalse(NetworkSecurityPolicy.getInstance().isCleartextTrafficPermitted("example.com"))
        val info =
            context.packageManager.getActivityInfo(
                ComponentName(context, MainActivity::class.java),
                PackageManager.MATCH_DISABLED_COMPONENTS,
            )
        assertFalse(info.enabled)
        assertEquals(
            PackageManager.PERMISSION_DENIED,
            context.checkSelfPermission(android.Manifest.permission.RECORD_AUDIO),
        )
    }

    @Test fun dWebExampleTravelsThroughTheAppAndReturnsOnlyExtractedEvidence() {
        ready()
        val before = catalog()
        val hasWeb =
            (0 until before.length()).any {
                before
                    .getJSONObject(
                        it,
                    ).getString("title") == "Guía web ficticia"
            }
        val expected = before.length() + if (hasWeb) 0 else 1
        compose.onNodeWithText("Importar web de ejemplo").performScrollTo().performClick()
        compose.waitUntil(TIMEOUT) {
            compose.onAllNodes(sourceButton()).fetchSemanticsNodes().size == expected &&
                idle()
        }
        val sources = catalog()
        val web =
            (0 until sources.length()).map { sources.getJSONObject(it) }.single {
                it.getString("title") ==
                    "Guía web ficticia"
            }
        compose.onNodeWithTag("reference-source-${web.getString("id")}").performScrollTo().performClick()
        compose.onNodeWithTag("reference-question").performScrollTo().performTextReplacement("fichas azules")
        compose.onNodeWithText("Buscar fragmentos").performScrollTo().performClick()
        compose.waitUntil(
            TIMEOUT,
        ) { compose.onAllNodesWithTag("reference-citation").fetchSemanticsNodes().isNotEmpty() }
        compose
            .onNodeWithText(
                "Fragmentos encontrados, sin respuesta generada por IA:",
            ).performScrollTo()
            .assertIsDisplayed()
    }

    private fun ready() {
        compose.waitUntil(TIMEOUT) { idle() }
    }

    private fun idle() = compose.onAllNodesWithTag("reference-work").fetchSemanticsNodes().isEmpty()

    private fun catalog() = runBlocking { http.post("/catalog").getJSONArray("sources") }

    private fun sourceButton() =
        SemanticsMatcher("reference source") {
            it.config.getOrNull(SemanticsProperties.TestTag)?.startsWith("reference-source-") == true
        }

    private companion object {
        const val TIMEOUT = 45_000L
        const val FOUR_FILES = 4
    }
}
