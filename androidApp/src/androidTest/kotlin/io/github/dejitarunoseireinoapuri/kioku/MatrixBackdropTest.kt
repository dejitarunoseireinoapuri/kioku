package io.github.dejitarunoseireinoapuri.kioku

import androidx.activity.ComponentActivity
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.material.Text
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.toPixelMap
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.unit.dp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.LifecycleRegistry
import androidx.lifecycle.compose.LocalLifecycleOwner
import io.github.dejitarunoseireinoapuri.kioku.design.ActionButton
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuTheme
import io.github.dejitarunoseireinoapuri.kioku.design.MatrixBackdrop
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

class MatrixBackdropTest {
    @get:Rule
    val compose = createAndroidComposeRule<ComponentActivity>()

    @Test
    fun glyphsMoveWithoutInterceptingTheForegroundAction() {
        var tapped = false
        compose.mainClock.autoAdvance = false
        compose.setContent {
            KiokuTheme {
                Box(Modifier.size(180.dp, 300.dp).testTag("rain-fixture")) {
                    MatrixBackdrop { ActionButton("Acción de prueba", { tapped = true }) }
                }
            }
        }
        compose.mainClock.advanceTimeByFrame()
        val before = fingerprint()
        compose.mainClock.advanceTimeBy(2200)
        assertNotEquals(before, fingerprint())
        compose.onNodeWithText("Acción de prueba").performClick()
        compose.runOnIdle { assertTrue(tapped) }
    }

    @Test
    fun fallingSymbolsStopWhenTheHostLeavesTheForegroundAndResumeOnReturn() {
        lateinit var owner: RainLifecycleOwner
        compose.runOnUiThread {
            owner = RainLifecycleOwner()
            owner.registry.currentState = Lifecycle.State.RESUMED
        }
        compose.mainClock.autoAdvance = false
        compose.setContent {
            CompositionLocalProvider(LocalLifecycleOwner provides owner) {
                KiokuTheme {
                    Box(Modifier.size(180.dp, 300.dp).testTag("rain-fixture")) {
                        MatrixBackdrop { Text("Contenido legible") }
                    }
                }
            }
        }
        compose.mainClock.advanceTimeBy(1200)
        compose.runOnUiThread { owner.registry.currentState = Lifecycle.State.STARTED }
        compose.mainClock.advanceTimeByFrame()
        val paused = fingerprint()
        compose.mainClock.advanceTimeBy(2200)
        assertEquals(paused, fingerprint())
        compose.runOnUiThread { owner.registry.currentState = Lifecycle.State.RESUMED }
        compose.mainClock.advanceTimeBy(2200)
        assertNotEquals(paused, fingerprint())
    }

    private fun fingerprint(): Long = imageFingerprint(compose.onNodeWithTag("rain-fixture").captureToImage())
}

internal fun imageFingerprint(image: ImageBitmap): Long {
    val pixels = image.toPixelMap()
    var fingerprint = 0L
    for (y in 0 until image.height step 3) {
        for (x in 0 until image.width step 3) fingerprint = fingerprint * 31 + pixels[x, y].value.toLong()
    }
    return fingerprint
}

private class RainLifecycleOwner : LifecycleOwner {
    val registry = LifecycleRegistry(this)
    override val lifecycle: Lifecycle get() = registry
}
