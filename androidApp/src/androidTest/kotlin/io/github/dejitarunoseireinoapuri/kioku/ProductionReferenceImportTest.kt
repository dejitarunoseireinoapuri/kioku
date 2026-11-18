package io.github.dejitarunoseireinoapuri.kioku

import android.content.Intent
import android.net.Uri
import android.view.WindowManager
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.isEnabled
import androidx.compose.ui.test.junit4.v2.createEmptyComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceImportResult
import org.junit.Assert.assertNull
import org.junit.Assume.assumeTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/** Explicit production opt-in: generated PDF only, no question or AI endpoint is invoked. */
@RunWith(AndroidJUnit4::class)
class ProductionReferenceImportTest {
    @get:Rule val compose = createEmptyComposeRule()

    @Test fun sharedFictionalPdfIsStoredAndReadWithoutInference() {
        assumeTrue(
            InstrumentationRegistry.getArguments().getString("kiokuProductionReferenceSmoke") == "synthetic-no-ai",
        )
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val uri = Uri.parse("content://${context.packageName}.reference-fixtures/pdf")
        val intent =
            Intent(context, MainActivity::class.java).apply {
                action = Intent.ACTION_SEND
                type = "application/pdf"
                putExtra(Intent.EXTRA_STREAM, uri)
                addFlags(
                    Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK or
                        Intent.FLAG_ACTIVITY_CLEAR_TASK,
                )
            }
        try {
            ActivityScenario.launch<MainActivity>(intent).use { scenario ->
                scenario.onActivity { it.window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON) }
                awaitStored()
                var storedId: String? = null
                scenario.onActivity { activity ->
                    storedId =
                        (
                            activity.referenceState
                                ?.value
                                ?.items
                                ?.single()
                                ?.result as?
                                ReferenceImportResult.Stored
                        )?.id
                }
                val source = hasTestTag("reference-source-${requireNotNull(storedId)}") and isEnabled()
                compose.onNodeWithText("Fuentes").performClick()
                compose.waitUntil(TIMEOUT_MS) {
                    compose.onAllNodes(source).fetchSemanticsNodes().size == 1
                }
                compose
                    .onNode(source)
                    .performScrollTo()
                    .performClick()
                compose.onNodeWithText("Ver texto extraído").performScrollTo().performClick()
                awaitText("Lira usa un cuaderno violeta.", substring = true)
                awaitText("Página 1")
            }
        } finally {
            context.contentResolver.delete(uri, null, null)
        }
    }

    private fun awaitStored() {
        var failure: String? = null
        compose.waitUntil(TIMEOUT_MS) {
            failure =
                FAILURE_SIGNALS.firstOrNull { signal ->
                    compose.onAllNodes(hasText(signal)).fetchSemanticsNodes().isNotEmpty()
                }
            failure != null ||
                compose
                    .onAllNodes(hasText("Texto guardado en Kioku"))
                    .fetchSemanticsNodes()
                    .isNotEmpty()
        }
        assertNull("Closed import issue: $failure", failure)
    }

    private fun awaitText(
        text: String,
        substring: Boolean = false,
    ) {
        compose.waitUntil(TIMEOUT_MS) {
            compose.onAllNodes(hasText(text, substring = substring)).fetchSemanticsNodes().isNotEmpty()
        }
    }

    private companion object {
        const val TIMEOUT_MS = 90_000L
        val FAILURE_SIGNALS =
            listOf(
                "Accede a Kioku y vuelve a compartir el archivo.",
                "No se puede leer este archivo. Vuelve a compartirlo con permiso de lectura.",
                "No se ha podido completar la operación. Vuelve a intentarlo; " +
                    "si persiste, comprueba la disponibilidad del servicio.",
                "No se ha podido reconocer el archivo o enlace compartido.",
            )
    }
}
