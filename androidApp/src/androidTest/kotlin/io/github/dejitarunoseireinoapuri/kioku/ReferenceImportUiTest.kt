package io.github.dejitarunoseireinoapuri.kioku

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceFormat
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceImportResult
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceInput
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceIssue
import io.github.dejitarunoseireinoapuri.kioku.feature.references.ReferenceImportApp
import io.github.dejitarunoseireinoapuri.kioku.feature.references.ReferenceImportItem
import io.github.dejitarunoseireinoapuri.kioku.feature.references.ReferenceImportState
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class ReferenceImportUiTest {
    @get:Rule val compose = createAndroidComposeRule<LifecycleTestActivity>()
    private val input = ReferenceInput("fictional-note", "Plan ficticio de Nara", ReferenceFormat.Text)

    @After fun close() {
        compose.runOnUiThread { LifecycleTestActivity.content = null }
    }

    @Test fun readingDoesNotAnnounceStoredAndCanBeClosed() {
        var closes = 0
        open(ReferenceImportState(listOf(ReferenceImportItem(input)), readingId = input.id)) { closes++ }
        compose.onNodeWithText(input.title).assertIsDisplayed()
        compose.onNodeWithTag("reference-reading").assertIsDisplayed()
        compose.onNodeWithText("Texto guardado. Consultas con IA pendientes de activar.").assertDoesNotExist()
        compose.onNodeWithText("Cerrar importación").performClick()
        compose.runOnIdle { assertEquals(1, closes) }
    }

    @Test fun aPartialResultAndPermissionFailureRemainVisibleInTheBatch() {
        val second = ReferenceInput("fictional-manual", "Manual ficticio de Lira", ReferenceFormat.Docx)
        open(
            ReferenceImportState(
                listOf(
                    ReferenceImportItem(input, ReferenceImportResult.Stored("source-a", "revision-a", 2, true)),
                    ReferenceImportItem(second, ReferenceImportResult.Failed(ReferenceIssue.Permission)),
                ),
            ),
        )
        compose.onNodeWithText(input.title).assertIsDisplayed()
        compose.onNodeWithText(second.title).assertIsDisplayed()
        compose.onNodeWithText("Texto parcial guardado. El documento no se ha leído completo.").assertIsDisplayed()
        compose
            .onNodeWithText("No se puede leer este archivo. Vuelve a compartirlo con permiso de lectura.")
            .assertIsDisplayed()
    }

    @Test fun unavailableFeatureDoesNotClaimAnyFileWasStored() {
        open(ReferenceImportState(issue = ReferenceIssue.Unavailable))
        compose.onNodeWithText("La importación de documentos todavía no está activada.").assertIsDisplayed()
        compose.onNodeWithTag("reference-reading").assertDoesNotExist()
        compose.onNodeWithText("Cerrar importación").assertIsDisplayed()
    }

    private fun open(
        state: ReferenceImportState,
        onClose: () -> Unit = {},
    ) {
        compose.runOnUiThread {
            LifecycleTestActivity.content = { ReferenceImportApp(state, onClose) }
        }
        compose.activityRule.scenario.recreate()
    }
}
