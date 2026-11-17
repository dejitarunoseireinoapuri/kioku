package io.github.dejitarunoseireinoapuri.kioku

import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Color
import android.window.SplashScreenView
import androidx.test.filters.SdkSuppress
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.runner.lifecycle.ActivityLifecycleCallback
import androidx.test.runner.lifecycle.ActivityLifecycleMonitorRegistry
import androidx.test.runner.lifecycle.Stage
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.ByteArrayOutputStream
import java.io.File
import java.util.concurrent.CompletableFuture
import java.util.concurrent.TimeUnit

/** Captures the real system splash, including device-specific icon scaling. No user input is sent. */
@SdkSuppress(minSdkVersion = 31)
class ActualSplashTest {
    @Test
    fun systemLaunchShowsACompleteCompactIcon() {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val context = instrumentation.targetContext
        val splash = CompletableFuture<SplashScreenView>()
        val monitor = ActivityLifecycleMonitorRegistry.getInstance()
        val callback =
            ActivityLifecycleCallback { activity, stage ->
                if (activity is MainActivity && stage == Stage.PRE_ON_CREATE) {
                    activity.splashScreen.setOnExitAnimationListener { splash.complete(it) }
                }
            }
        monitor.addLifecycleCallback(callback)
        try {
            context.startActivity(Intent(context, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
            val view = splash.get(10, TimeUnit.SECONDS)
            try {
                captureSplash(context.resources.displayMetrics.density)
            } finally {
                instrumentation.runOnMainSync { view.remove() }
            }
        } finally {
            monitor.removeLifecycleCallback(callback)
        }
    }

    private fun captureSplash(density: Float) {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val context = instrumentation.targetContext
        val automation = instrumentation.uiAutomation
        repeat(8) {
            val raw = automation.takeScreenshot() ?: return@repeat
            val frame = pngFrame(raw)
            raw.recycle()
            try {
                val bounds = splashBounds(frame) ?: return@repeat
                File(context.getExternalFilesDir(null), "kioku-actual-system-splash.png").outputStream().use {
                    frame.compress(Bitmap.CompressFormat.PNG, 100, it)
                }
                val width = (bounds[2] - bounds[0]) / density
                val height = (bounds[3] - bounds[1]) / density
                assertTrue("System splash width was $width dp", width in 40f..85f)
                assertTrue("System splash height was $height dp", height in 40f..85f)
                assertTrue("System splash glyph must not be cropped", width / height in 0.95f..1.08f)
                return
            } finally {
                frame.recycle()
            }
        }
        error("No real system splash frame was captured")
    }

    private fun pngFrame(raw: Bitmap): Bitmap {
        val bytes =
            ByteArrayOutputStream().use {
                raw.compress(Bitmap.CompressFormat.PNG, 100, it)
                it.toByteArray()
            }
        return requireNotNull(BitmapFactory.decodeByteArray(bytes, 0, bytes.size))
    }

    private fun splashBounds(frame: Bitmap): IntArray? {
        val bounds = intArrayOf(frame.width, frame.height, -1, -1)
        var outsideSamples = 0
        var outsideDark = 0
        var inkSamples = 0
        for (y in frame.height / 10 until frame.height * 9 / 10 step 4) {
            for (x in 0 until frame.width step 4) {
                val pixel = frame.getPixel(x, y)
                if (y < frame.height / 3 || y > frame.height * 2 / 3) {
                    outsideSamples++
                    if (Color.red(pixel) < 8 && Color.green(pixel) < 12 && Color.blue(pixel) < 8) outsideDark++
                }
                if (isIconPixel(pixel)) {
                    inkSamples++
                    bounds[0] = minOf(bounds[0], x)
                    bounds[1] = minOf(bounds[1], y)
                    bounds[2] = maxOf(bounds[2], x)
                    bounds[3] = maxOf(bounds[3], y)
                }
            }
        }
        val area = (bounds[2] - bounds[0]) * (bounds[3] - bounds[1]) / 16.0
        return bounds.takeIf {
            area > 0 && inkSamples / area > 0.25 &&
                outsideDark.toDouble() / outsideSamples > 0.995
        }
    }

    private fun isIconPixel(pixel: Int) =
        Color.green(pixel) > 200 && Color.red(pixel) in 40..130 && Color.blue(pixel) in 90..180
}
