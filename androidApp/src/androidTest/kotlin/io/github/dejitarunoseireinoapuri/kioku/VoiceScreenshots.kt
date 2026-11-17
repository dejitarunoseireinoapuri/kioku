package io.github.dejitarunoseireinoapuri.kioku

import android.app.Activity
import android.graphics.Bitmap
import android.os.Handler
import android.os.Looper
import android.view.PixelCopy
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import java.io.File
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicInteger

/** Copy only the synthetic test Activity's window, independently of Compose's root capture. */
internal fun captureVoiceWindow(
    activity: Activity,
    name: String,
) {
    if (InstrumentationRegistry.getArguments().getString("brandScreenshots") != "true") return
    val instrumentation = InstrumentationRegistry.getInstrumentation()
    val view = activity.window.decorView
    val image = Bitmap.createBitmap(view.width, view.height, Bitmap.Config.ARGB_8888)
    val copied = CountDownLatch(1)
    val result = AtomicInteger(-1)
    instrumentation.runOnMainSync {
        view.postOnAnimation {
            PixelCopy.request(activity.window, image, {
                result.set(it)
                copied.countDown()
            }, Handler(Looper.getMainLooper()))
        }
    }
    assertTrue("Synthetic fixture frame must be captured", copied.await(5, TimeUnit.SECONDS))
    assertEquals(PixelCopy.SUCCESS, result.get())
    File(activity.getExternalFilesDir(null), name).outputStream().use {
        assertTrue(image.compress(Bitmap.CompressFormat.PNG, 100, it))
    }
    image.recycle()
}
