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
import androidx.compose.ui.graphics.toPixelMap
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.unit.dp
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
    fun messagesPanelsComposerAndSelectedModeKeepTheSameRainVisibleUnderneath() {
        val foreground = mutableStateOf(false)
        compose.mainClock.autoAdvance = false
        openFixture(foreground)
        compose.mainClock.advanceTimeBy(1200)
        val background = compose.onNodeWithTag("transparent-fixture").captureToImage()
        compose.runOnIdle { foreground.value = true }
        compose.mainClock.advanceTimeByFrame()
        val composed = compose.onNodeWithTag("transparent-fixture").captureToImage()
        val density = compose.activity.resources.displayMetrics.density
        for (tag in listOf("transparent-panel", "transparent-message")) {
            val bounds = compose.onNodeWithTag(tag).fetchSemanticsNode().boundsInRoot
            assertUncovered(background, composed, bounds.deflate(8 * density))
        }
        val frame = compose.onNodeWithTag("composer-frame").fetchSemanticsNode().boundsInRoot
        assertUncovered(
            background,
            composed,
            Rect(
                frame.left + 8 * density,
                frame.top + 3 * density,
                frame.right - 8 * density,
                frame.top + 7 * density,
            ),
        )
        val intent = compose.onNodeWithTag("intent-Tell").fetchSemanticsNode().boundsInRoot
        assertUncovered(
            background,
            composed,
            Rect(
                intent.left + 4 * density,
                intent.top + 3 * density,
                intent.right - 4 * density,
                intent.top + 10 * density,
            ),
        )
    }

    private fun openFixture(foreground: State<Boolean>) {
        compose.setContent {
            KiokuTheme {
                Box(Modifier.size(320.dp, 500.dp).testTag("transparent-fixture")) {
                    MatrixBackdrop {
                        if (foreground.value) {
                            Column {
                                Panel(Modifier.testTag("transparent-panel")) { Spacer(Modifier.height(48.dp)) }
                                TranscriptMessage(Modifier.testTag("transparent-message")) {
                                    Spacer(Modifier.height(64.dp))
                                }
                                ConversationComposer(ConversationState()) {}
                            }
                        }
                    }
                }
            }
        }
    }
}

private fun assertUncovered(
    before: ImageBitmap,
    after: ImageBitmap,
    bounds: Rect,
) {
    val original = before.toPixelMap()
    val foreground = after.toPixelMap()
    var visibleGlyphPixels = 0
    for (y in bounds.top.toInt() until bounds.bottom.toInt() step 2) {
        for (x in bounds.left.toInt() until bounds.right.toInt() step 2) {
            val message = "The foreground must not mask the shared rain at $x,$y"
            // Transparent GPU layers can round a channel by one 8-bit level; matte fills cannot pass this bound.
            val tolerance = 1f / 255 + 0.0001f
            assertEquals(message, original[x, y].red, foreground[x, y].red, tolerance)
            assertEquals(message, original[x, y].green, foreground[x, y].green, tolerance)
            assertEquals(message, original[x, y].blue, foreground[x, y].blue, tolerance)
            if (original[x, y].green > 0.08f) visibleGlyphPixels++
        }
    }
    assertTrue("The checked region must include visible rain, not only black pixels", visibleGlyphPixels > 5)
}
