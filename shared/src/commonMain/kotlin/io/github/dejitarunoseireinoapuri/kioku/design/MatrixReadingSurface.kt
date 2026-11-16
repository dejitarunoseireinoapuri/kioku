package io.github.dejitarunoseireinoapuri.kioku.design

import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color

private const val RAIN_UNDER_CONTENT_ALPHA = 0.3f
private val LocalRainCovered = staticCompositionLocalOf { false }

/** Attenuates the existing rain once per reading group, keeping foreground colors at full opacity. */
@Composable
internal fun MatrixReadingSurface(
    separateWindow: Boolean = false,
    content: @Composable (Color) -> Unit,
) {
    val scrim =
        if (LocalRainCovered.current && !separateWindow) {
            Color.Transparent
        } else {
            KiokuColors.Background.copy(alpha = 1f - RAIN_UNDER_CONTENT_ALPHA)
        }
    CompositionLocalProvider(LocalRainCovered provides true) { content(scrim) }
}
