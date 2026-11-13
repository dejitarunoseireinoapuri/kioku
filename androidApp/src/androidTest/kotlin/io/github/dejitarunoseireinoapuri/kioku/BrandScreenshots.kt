package io.github.dejitarunoseireinoapuri.kioku

import android.content.Context
import android.graphics.Bitmap
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.asAndroidBitmap
import androidx.test.platform.app.InstrumentationRegistry
import java.io.File

internal fun captureBrandScreen(
    context: Context,
    name: String,
    capture: () -> ImageBitmap,
) {
    if (InstrumentationRegistry.getArguments().getString("brandScreenshots") != "true") return
    val image = capture().asAndroidBitmap()
    File(context.getExternalFilesDir(null), name).outputStream().use {
        image.compress(Bitmap.CompressFormat.PNG, 100, it)
    }
    image.recycle()
}
