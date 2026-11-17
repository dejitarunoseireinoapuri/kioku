package io.github.dejitarunoseireinoapuri.kioku

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.view.ContextThemeWrapper
import androidx.test.filters.SdkSuppress
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File
import kotlin.math.abs
import kotlin.math.roundToInt

@SdkSuppress(minSdkVersion = 31)
class SplashIconTest {
    @Test
    fun launchThemeRendersASmallCenteredMarkInsideTheSystemSplashCanvas() {
        val context = ContextThemeWrapper(InstrumentationRegistry.getInstrumentation().targetContext, R.style.AppTheme)
        val attributes = context.obtainStyledAttributes(intArrayOf(android.R.attr.windowSplashScreenAnimatedIcon))
        val icon =
            try {
                requireNotNull(attributes.getDrawable(0))
            } finally {
                attributes.recycle()
            }
        val density = context.resources.displayMetrics.density
        val side = (288 * density).roundToInt()
        val bitmap = Bitmap.createBitmap(side, side, Bitmap.Config.ARGB_8888)
        try {
            val canvas = Canvas(bitmap)
            canvas.drawColor(Color.rgb(2, 6, 4))
            icon.setBounds(0, 0, side, side)
            icon.draw(canvas)
            val bounds = inkBounds(bitmap)
            val width = (bounds[2] - bounds[0] + 1) / density
            val height = (bounds[3] - bounds[1] + 1) / density
            assertTrue("Splash mark width must stay compact: $width dp", width in 60f..66f)
            assertTrue("Splash mark height must stay compact: $height dp", height in 60f..66f)
            assertTrue(abs((bounds[0] + bounds[2]) / 2f - side / 2f) <= density)
            assertTrue(abs((bounds[1] + bounds[3]) / 2f - side / 2f) <= density)
            if (InstrumentationRegistry.getArguments().getString("brandScreenshots") == "true") {
                File(context.getExternalFilesDir(null), "kioku-native-splash-icon.png").outputStream().use {
                    bitmap.compress(Bitmap.CompressFormat.PNG, 100, it)
                }
            }
        } finally {
            bitmap.recycle()
        }
    }

    private fun inkBounds(bitmap: Bitmap): IntArray {
        val bounds = intArrayOf(bitmap.width, bitmap.height, -1, -1)
        for (y in 0 until bitmap.height) {
            for (x in 0 until bitmap.width) {
                val pixel = bitmap.getPixel(x, y)
                if (Color.green(pixel) > 100 && Color.green(pixel) > Color.red(pixel) * 2) {
                    bounds[0] = minOf(bounds[0], x)
                    bounds[1] = minOf(bounds[1], y)
                    bounds[2] = maxOf(bounds[2], x)
                    bounds[3] = maxOf(bounds[3], y)
                }
            }
        }
        return bounds
    }
}
