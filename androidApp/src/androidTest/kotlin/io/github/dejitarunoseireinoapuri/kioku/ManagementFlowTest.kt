package io.github.dejitarunoseireinoapuri.kioku

import androidx.activity.ComponentActivity
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.graphics.toPixelMap
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.isDisplayed
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performImeAction
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performScrollToNode
import androidx.compose.ui.test.performTextInput
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuColors
import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureOutcome
import io.github.dejitarunoseireinoapuri.kioku.domain.ChangeAction
import io.github.dejitarunoseireinoapuri.kioku.domain.TextOutcome
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class ManagementFlowTest {
    @get:Rule
    val compose = createAndroidComposeRule<ComponentActivity>()
    private val controls = ManagementFlowFixture()
    private val conversation = ConversationFlowFixture()

    @Test
    fun correctingAndForgettingStayInManagementAndTheOriginalFeedBecomesReadOnly() {
        startStory()
        compose.onNode(hasText("Corregir") and memoryItemContaining("Examen el martes.")).performClick()
        compose.onNodeWithTag("correction-input").performTextInput("Examen el viernes.")
        click("Aplicar corrección")
        visible("Recuerdo modificado")
        compose.onNodeWithText("Examen el viernes.").assertIsDisplayed()
        forget("Película Loto.")
        compose.onNodeWithText("Examen el viernes.").assertIsDisplayed()
        compose.onNodeWithText("Gestionar un recuerdo").assertIsDisplayed()
        compose.onNodeWithTag("text-composer").assertDoesNotExist()
        captureBrandScreen(compose.activity, "kioku-management-updated.png") { compose.onRoot().captureToImage() }
        returnToFeed()
        compose.onNodeWithText(STORY).assertIsNotEnabled()
        compose.onNodeWithContentDescription("Gestionar este recuerdo").assertDoesNotExist()
        assertEquals(2, controls.commands.size)
    }

    @Test
    fun forgettingBothItemsStaysOnTheManagementScreenWithTheDeletedNotice() {
        startStory()
        forget("Película Loto.")
        forget("Examen el martes.")
        compose.onNodeWithText("Gestionar un recuerdo").assertIsDisplayed()
        compose.onNodeWithText("Recuerdo borrado").assertIsDisplayed()
        compose.onNodeWithText("Olvidar").assertDoesNotExist()
        compose.onNodeWithTag("text-composer").assertDoesNotExist()
        assertEquals(2, controls.commands.size)
    }

    private fun startStory() {
        conversation.answer = { TextOutcome.Captured(CaptureOutcome.Saved(controls.original.source, 1)) }
        compose.setContent {
            KiokuApp(FixtureAccount(), controlRepository = controls, conversationRepository = conversation)
        }
        compose.waitUntil(5000) { compose.onNodeWithTag("text-composer").isDisplayed() }
        compose.onNodeWithTag("text-composer").performTextInput(STORY)
        compose.onNodeWithTag("text-composer").performImeAction()
        compose.waitUntil(5000) { compose.onNodeWithContentDescription("Gestionar este recuerdo").isDisplayed() }
        compose.onNodeWithContentDescription("Gestionar este recuerdo").performClick()
        click("Gestionar")
        visible("Examen el martes.")
    }

    private fun returnToFeed() {
        compose.onNodeWithContentDescription("Volver").performClick()
        compose.onNodeWithTag("conversation-messages").performScrollToNode(hasText(STORY))
        compose.onNodeWithText(STORY).assertIsDisplayed()
        captureBrandScreen(compose.activity, "kioku-session-feed-changes.png") { compose.onRoot().captureToImage() }
    }

    private fun forget(text: String) {
        compose.onNode(hasText("Olvidar") and memoryItemContaining(text)).performScrollTo().performClick()
        val image = compose.onNodeWithTag("forget-confirm-action").captureToImage().toPixelMap()
        assertEquals(KiokuColors.Coral.toArgb(), image[image.width / 8, image.height / 2].toArgb())
        captureBrandScreen(compose.activity, "kioku-forget-filled.png") {
            compose.onNodeWithTag("forget-confirmation").captureToImage()
        }
        click("Sí, olvidar")
        visible("Recuerdo borrado")
    }

    private fun click(text: String) {
        visible(text)
        compose.onNodeWithText(text).performClick()
    }

    private fun visible(text: String) {
        compose.waitUntil(5000) { compose.onAllNodesWithText(text).fetchSemanticsNodes().isNotEmpty() }
        if (!compose.onNodeWithText(text).isDisplayed()) compose.onNodeWithText(text).performScrollTo()
    }
}

private const val STORY = "Película Loto. Examen el martes."
