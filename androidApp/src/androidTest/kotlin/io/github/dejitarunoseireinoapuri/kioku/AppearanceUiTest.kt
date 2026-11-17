package io.github.dejitarunoseireinoapuri.kioku

import androidx.compose.ui.graphics.toPixelMap
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.isDisplayed
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.test.platform.app.InstrumentationRegistry
import io.github.dejitarunoseireinoapuri.kioku.platform.AndroidAppearanceRepository
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Rule
import org.junit.Test

class AppearanceUiTest {
    @get:Rule val compose = createAndroidComposeRule<LifecycleTestActivity>()
    private val name = "synthetic-appearance-test"
    private val context = InstrumentationRegistry.getInstrumentation().targetContext

    @Before fun open() {
        context
            .getSharedPreferences(name, 0)
            .edit()
            .clear()
            .commit()
        compose.runOnUiThread {
            LifecycleTestActivity.content = {
                KiokuApp(
                    FixtureAccount(),
                    appearanceRepository =
                        androidx.compose.runtime.remember {
                            AndroidAppearanceRepository(context, name)
                        },
                )
            }
        }
        compose.activityRule.scenario.recreate()
        compose.waitUntil(5000) { compose.onNodeWithContentDescription("Ajustes").isDisplayed() }
    }

    @After fun close() {
        compose.runOnUiThread { LifecycleTestActivity.content = null }
        context
            .getSharedPreferences(name, 0)
            .edit()
            .clear()
            .commit()
    }

    @Test fun fallingLettersCanBeDisabledAndRemainDisabledAfterRecreation() {
        compose.onNodeWithTag("matrix-rain", useUnmergedTree = true).assertExists()
        compose.onNodeWithContentDescription("Ajustes").performClick()
        compose.onNodeWithText("Katakana cayendo").performScrollTo().assertIsDisplayed()
        compose.onNodeWithTag("falling-letters-setting").performScrollTo().performClick()
        compose.onNodeWithTag("matrix-rain", useUnmergedTree = true).assertDoesNotExist()
        val pixels = compose.onRoot().captureToImage().toPixelMap()
        assertEquals(androidx.compose.ui.graphics.Color.Black, pixels[1, pixels.height / 2])
        compose.activityRule.scenario.recreate()
        compose.waitUntil(5000) { compose.onNodeWithTag("falling-letters-setting").isDisplayed() }
        compose.onNodeWithTag("matrix-rain", useUnmergedTree = true).assertDoesNotExist()
        assertEquals(false, AndroidAppearanceRepository(context, name).fallingLetters.value)
        captureBrandScreen(
            compose.activity,
            "kioku-black-background-settings.png",
        ) { compose.onRoot().captureToImage() }
        compose.onNodeWithTag("falling-letters-setting").performScrollTo().performClick()
        compose.onNodeWithTag("matrix-rain", useUnmergedTree = true).assertExists()
    }
}
