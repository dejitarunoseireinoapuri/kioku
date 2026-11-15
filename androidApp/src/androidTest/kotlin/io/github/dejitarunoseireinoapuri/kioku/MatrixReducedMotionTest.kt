package io.github.dejitarunoseireinoapuri.kioku

import androidx.activity.ComponentActivity
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.material.Text
import androidx.compose.ui.Modifier
import androidx.compose.ui.MotionDurationScale
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.unit.dp
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuTheme
import io.github.dejitarunoseireinoapuri.kioku.design.MatrixBackdrop
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class MatrixReducedMotionTest {
    @get:Rule
    val compose =
        createAndroidComposeRule<ComponentActivity>(
            effectContext =
                object : MotionDurationScale {
                    override val scaleFactor = 0f
                },
        )

    @Test
    fun disabledAnimationsLeaveAStaticVisibleBackground() {
        compose.mainClock.autoAdvance = false
        compose.setContent {
            KiokuTheme {
                Box(Modifier.size(180.dp, 300.dp).testTag("static-rain")) {
                    MatrixBackdrop { Text("Sin movimiento") }
                }
            }
        }
        compose.mainClock.advanceTimeBy(1200)
        val before = imageFingerprint(compose.onNodeWithTag("static-rain").captureToImage())
        compose.mainClock.advanceTimeBy(2200)
        assertEquals(before, imageFingerprint(compose.onNodeWithTag("static-rain").captureToImage()))
    }
}
