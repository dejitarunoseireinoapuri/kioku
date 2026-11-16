package io.github.dejitarunoseireinoapuri.kioku

import androidx.activity.ComponentActivity
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.State
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.MotionDurationScale
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.compositeOver
import androidx.compose.ui.graphics.toPixelMap
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.unit.dp
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuColors
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuTheme
import io.github.dejitarunoseireinoapuri.kioku.design.MatrixBackdrop
import io.github.dejitarunoseireinoapuri.kioku.design.Panel
import io.github.dejitarunoseireinoapuri.kioku.design.TranscriptMessage
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.ConversationComposer
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.ConversationState
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

class MatrixTransparencyTest {
    @get:Rule
    val compose =
        createAndroidComposeRule<ComponentActivity>(
            effectContext =
                object : MotionDurationScale {
                    override val scaleFactor = 0f
                },
        )

    @Test
    fun readingGroupsKeepThirtyPercentOfTheSameRainWithoutCompoundingNestedSurfaces() {
        val foreground = mutableStateOf(false)
        compose.mainClock.autoAdvance = false
        openFixture(foreground)
        compose.mainClock.advanceTimeBy(1200)
        val background = compose.onNodeWithTag("transparent-fixture").captureToImage()
        compose.runOnIdle { foreground.value = true }
        compose.mainClock.advanceTimeByFrame()
        val composed = compose.onNodeWithTag("transparent-fixture").captureToImage()
        val density = compose.activity.resources.displayMetrics.density
        for (tag in listOf("nested-panel", "transparent-message")) {
            val bounds = compose.onNodeWithTag(tag).fetchSemanticsNode().boundsInRoot
            assertRainAlpha(background, composed, bounds.deflate(8 * density))
        }
        val frame = compose.onNodeWithTag("composer-frame").fetchSemanticsNode().boundsInRoot
        assertRainAlpha(
            background,
            composed,
            Rect(
                frame.left + 48 * density,
                frame.top + 4 * density,
                frame.right - 56 * density,
                frame.bottom - 4 * density,
            ),
        )
        val intent = compose.onNodeWithTag("intent-Tell").fetchSemanticsNode().boundsInRoot
        assertRainAlpha(
            background,
            composed,
            Rect(
                intent.left + 4 * density,
                intent.top + 3 * density,
                intent.right - 4 * density,
                intent.top + 10 * density,
            ),
        )
        assertRainAlpha(background, composed, Rect(8 * density, 450 * density, 312 * density, 492 * density), 1f)
    }

    private fun openFixture(foreground: State<Boolean>) {
        compose.setContent {
            KiokuTheme {
                Box(Modifier.size(320.dp, 500.dp).testTag("transparent-fixture")) {
                    MatrixBackdrop {
                        if (foreground.value) {
                            Column {
                                Panel {
                                    Panel(Modifier.testTag("nested-panel")) { Spacer(Modifier.height(48.dp)) }
                                }
                                TranscriptMessage(Modifier.testTag("transparent-message")) {
                                    Spacer(Modifier.height(64.dp))
                                }
                                ConversationComposer(ConversationState(draft = " ")) {}
                            }
                        }
                    }
                }
            }
        }
    }
}

private fun assertRainAlpha(
    before: ImageBitmap,
    after: ImageBitmap,
    bounds: Rect,
    alpha: Float = 0.3f,
) {
    val original = before.toPixelMap()
    val foreground = after.toPixelMap()
    var visibleGlyphPixels = 0
    for (y in bounds.top.toInt() until bounds.bottom.toInt() step 2) {
        for (x in bounds.left.toInt() until bounds.right.toInt() step 2) {
            val message = "The rain must retain alpha $alpha at $x,$y"
            val expected = KiokuColors.Background.copy(alpha = 1f - alpha).compositeOver(original[x, y])
            // GPU composition can round a channel by one 8-bit level.
            val tolerance = 1f / 255 + 0.0001f
            assertEquals(message, expected.red, foreground[x, y].red, tolerance)
            assertEquals(message, expected.green, foreground[x, y].green, tolerance)
            assertEquals(message, expected.blue, foreground[x, y].blue, tolerance)
            if (original[x, y].green > 0.08f) visibleGlyphPixels++
        }
    }
    assertTrue("The checked region must include visible rain, not only black pixels", visibleGlyphPixels > 5)
}
