package io.github.dejitarunoseireinoapuri.kioku

import android.graphics.Bitmap
import androidx.activity.ComponentActivity
import androidx.compose.ui.graphics.toPixelMap
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsEnabled
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.assertIsSelected
import androidx.compose.ui.test.assertTextContains
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.isDisplayed
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextClearance
import androidx.compose.ui.test.performTextInput
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import java.io.File

class ComposerInteractionTest {
    @get:Rule
    val compose = createAndroidComposeRule<ComponentActivity>()

    @Before
    fun openApp() {
        compose.setContent { KiokuApp(FixtureAccount()) }
        compose.waitUntil(5000) { compose.onNodeWithTag("intent-Ask").isDisplayed() }
        compose.onNodeWithTag("intent-Ask").performClick()
    }

    @Test
    fun keyboardKeepsOnlyTheComposerAboveItAndRestoresTheSelectedModeOnClosing() {
        compose.onNodeWithTag("text-composer").performClick().performTextInput("Pregunta ficticia sin enviar")
        compose.runOnUiThread {
            val window = compose.activity.window
            WindowCompat.getInsetsController(window, window.decorView).show(WindowInsetsCompat.Type.ime())
        }
        compose.waitUntil(5000) { imeVisible() }
        compose.onNodeWithTag("intent-Ask").assertDoesNotExist()
        compose.onNodeWithTag("intent-Tell").assertDoesNotExist()
        val bottom =
            compose
                .onNodeWithTag(
                    "text-composer",
                ).assertIsDisplayed()
                .fetchSemanticsNode()
                .boundsInWindow.bottom
        val view = compose.activity.window.decorView
        val imeBottom =
            WindowInsetsCompat
                .toWindowInsetsCompat(view.rootWindowInsets, view)
                .getInsets(WindowInsetsCompat.Type.ime())
                .bottom
        assertTrue("The composer must sit above the software keyboard", bottom <= view.height - imeBottom + 1)
        captureKeyboard()
        compose.runOnUiThread {
            WindowCompat.getInsetsController(compose.activity.window, view).hide(WindowInsetsCompat.Type.ime())
        }
        compose.waitUntil(5000) { !imeVisible() && compose.onNodeWithTag("intent-Ask").isDisplayed() }
        compose.onNodeWithTag("intent-Ask").assertIsSelected()
        compose.onNodeWithTag("text-composer").assertTextContains("Pregunta ficticia sin enviar")
    }

    @Test
    fun sendUsesAnAccentBackgroundOnlyForNonBlankTextAndRemainsAnAccessibleTarget() {
        compose.onNodeWithTag("send-action").assertIsNotEnabled()
        compose.onNodeWithTag("text-composer").performTextInput("   ")
        compose.onNodeWithTag("send-action").assertIsNotEnabled()
        compose.onNodeWithTag("text-composer").performTextClearance()
        compose.onNodeWithTag("text-composer").performTextInput("Pregunta ficticia")
        val action = compose.onNodeWithTag("send-action").assertIsEnabled().assertIsDisplayed()
        val image = action.captureToImage()
        val pixel = image.toPixelMap()[image.width / 6, image.height / 2]
        assertEquals(1f, pixel.red, 0.01f)
        assertEquals(103f / 255, pixel.green, 0.01f)
        assertEquals(79f / 255, pixel.blue, 0.01f)
        val bounds = action.fetchSemanticsNode().boundsInRoot
        val minimum = 48 * compose.activity.resources.displayMetrics.density
        assertTrue(bounds.width >= minimum && bounds.height >= minimum)
    }

    private fun imeVisible(): Boolean {
        val view = compose.activity.window.decorView
        return view.rootWindowInsets?.let {
            WindowInsetsCompat.toWindowInsetsCompat(it, view).isVisible(WindowInsetsCompat.Type.ime())
        } == true
    }

    private fun captureKeyboard() {
        if (InstrumentationRegistry.getArguments().getString("brandScreenshots") != "true") return
        val bitmap = InstrumentationRegistry.getInstrumentation().uiAutomation.takeScreenshot()
        File(compose.activity.getExternalFilesDir(null), "kioku-chat-keyboard.png").outputStream().use {
            bitmap.compress(Bitmap.CompressFormat.PNG, 100, it)
        }
        bitmap.recycle()
    }
}
