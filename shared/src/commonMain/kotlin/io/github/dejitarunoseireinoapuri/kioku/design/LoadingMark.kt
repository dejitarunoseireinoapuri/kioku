package io.github.dejitarunoseireinoapuri.kioku.design

import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.graphicsLayer

@Composable
internal fun LoadingMark(modifier: Modifier) {
    // InfiniteTransition honors MotionDurationScale; Reduce Motion leaves the mark fully opaque.
    val transition = rememberInfiniteTransition(label = "brand-wait")
    val opacity by transition.animateFloat(
        initialValue = 0.65f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(tween(600), RepeatMode.Reverse),
        label = "brand-opacity",
    )
    KiokuMark(modifier.graphicsLayer { alpha = opacity })
}
