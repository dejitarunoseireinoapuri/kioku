package io.github.dejitarunoseireinoapuri.kioku

import androidx.activity.ComponentActivity
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.assertIsSelected
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performSemanticsAction
import androidx.compose.ui.test.performTextInput
import androidx.compose.ui.text.TextLayoutResult
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuColors
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Rule
import org.junit.Test

class NavigationTest {
    @get:Rule
    val compose = createAndroidComposeRule<ComponentActivity>()
    private val account = FixtureAccount()

    @Before
    fun openSyntheticConversation() {
        compose.setContent { KiokuApp(account) }
    }

    @Test
    fun headingReceivesReadableForegroundFromRootTheme() {
        val layouts = mutableListOf<TextLayoutResult>()
        compose
            .onNodeWithText("Cuéntame algo que quieras recordar.")
            .performSemanticsAction(SemanticsActions.GetTextLayoutResult) { it(layouts) }
        assertEquals(
            KiokuColors.Text.toArgb(),
            layouts
                .single()
                .layoutInput.style.color
                .toArgb(),
        )
        captureBrandScreen(compose.activity, "kioku-home-technical.png") { compose.onRoot().captureToImage() }
    }

    @Test
    fun modeAndDraftSurviveSettingsRoundTrip() {
        compose.onNodeWithTag("intent-Ask").performClick()
        compose.onNodeWithTag("text-composer").performTextInput("Una pregunta de prueba")
        compose.onNodeWithContentDescription("Ajustes").performClick()
        captureBrandScreen(compose.activity, "kioku-settings-technical.png") { compose.onRoot().captureToImage() }
        compose.onNodeWithContentDescription("Volver").performClick()
        compose.onNodeWithTag("intent-Ask").assertIsSelected()
        compose.onNodeWithText("Una pregunta de prueba").assertIsDisplayed()
    }

    @Test
    fun answerSourceReturnsToSameConversation() {
        compose.onNodeWithContentDescription("Ajustes").performClick()
        compose.onNodeWithText("05 · Pregunta y respuesta").performScrollTo().performClick()
        compose.onNodeWithText("Ver texto original").performScrollTo().performClick()
        compose.onNodeWithText("LO QUE DIJISTE ORIGINALMENTE").assertIsDisplayed()
        compose.onNodeWithContentDescription("Volver").performClick()
        compose.onNodeWithTag("intent-Ask").assertIsSelected()
        compose
            .onNodeWithText("Dijiste que te apetecía ver Perfect Days cuando Gemma se fuera de viaje.")
            .assertIsDisplayed()
    }

    @Test
    fun disconnectedExampleDoesNotAcceptInputAndRetryReturnsToReady() {
        compose.onNodeWithContentDescription("Ajustes").performClick()
        compose.onNodeWithText("08 · Sin conexión").performScrollTo().performClick()
        compose.onNodeWithTag("intent-Tell").assertIsNotEnabled()
        compose.onNodeWithTag("intent-Ask").assertIsNotEnabled()
        compose.onNodeWithTag("text-composer").assertIsNotEnabled()
        compose.onNodeWithText("Reintentar").performClick()
        compose.onNodeWithText("Cuéntame algo que quieras recordar.").assertIsDisplayed()
    }

    @Test
    fun lockedExampleExposesOnlyFinishAndCancelControls() {
        compose.onNodeWithContentDescription("Ajustes").performClick()
        compose.onNodeWithText("02 · Grabación bloqueada").performScrollTo().performClick()
        compose.onNodeWithTag("text-composer").assertDoesNotExist()
        compose.onNodeWithText("Cancelar").assertIsDisplayed()
        compose.onNodeWithText("Terminar").performClick()
        compose.onNodeWithText("Recuerdo guardado").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun correctedSourcePreservesOriginalAndShowsCorrectionSeparately() {
        compose.onNodeWithContentDescription("Ajustes").performClick()
        compose.onNodeWithText("07 · Fuente con corrección").performScrollTo().performClick()
        compose.onNodeWithText("Ver texto original").performScrollTo().performClick()
        compose.onNodeWithText("Cuando Gemma se vaya de viaje, me apetece ver Perfect Days.").assertIsDisplayed()
        compose.onNodeWithText("CORRECCIÓN APLICADA").performScrollTo().assertIsDisplayed()
        compose
            .onNodeWithText("Querías ver Aftersun cuando Gemma se fuera de viaje.")
            .performScrollTo()
            .assertIsDisplayed()
    }
}
