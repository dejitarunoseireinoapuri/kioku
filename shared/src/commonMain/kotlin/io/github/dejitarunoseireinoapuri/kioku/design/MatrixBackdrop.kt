package io.github.dejitarunoseireinoapuri.kioku.design

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.State
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.text.drawText
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.unit.sp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.compose.LocalLifecycleOwner

private const val RAIN_CYCLE_MILLIS = 24_000
private const val RAIN_TRAIL_LENGTH = 12
private const val RAIN_MAX_COLUMNS = 32
private const val RAIN_GLYPH_CHANGES = 24
private const val RAIN_SYMBOLS = "アイウエオカキクケコサシスセソタチツテトナニヌネノ012345789"

/** Decorative only: no touch handlers, user data, network, or accessibility announcements. */
@Composable
fun MatrixBackdrop(content: @Composable () -> Unit) {
    val lifecycle by LocalLifecycleOwner.current.lifecycle.currentStateFlow
        .collectAsState()
    Box(Modifier.fillMaxSize().background(KiokuColors.Background)) {
        MatrixRain(lifecycle.isAtLeast(Lifecycle.State.RESUMED), Modifier.matchParentSize())
        content()
    }
}

@Composable
internal fun MatrixRain(
    active: Boolean,
    modifier: Modifier = Modifier,
) {
    val phase = rainPhase(active)
    val measurer = rememberTextMeasurer(cacheSize = RAIN_SYMBOLS.length)
    val style = MaterialTheme.typography.body2.copy(fontSize = 14.sp)
    val glyphs =
        remember(measurer, style) { RAIN_SYMBOLS.map { measurer.measure(AnnotatedString(it.toString()), style) } }
    Canvas(modifier.testTag("matrix-rain").clearAndSetSemantics {}) {
        drawRain(glyphs, phase.value)
        drawRect(
            Brush.verticalGradient(
                listOf(Color.Black.copy(alpha = 0.24f), Color.Transparent, Color.Black.copy(alpha = 0.32f)),
            ),
        )
    }
}

@Composable
private fun rainPhase(active: Boolean): State<Float> =
    if (active) {
        // The platform MotionDurationScale freezes this decorative motion when animations are disabled.
        rememberInfiniteTransition(label = "matrix-rain").animateFloat(
            initialValue = 0f,
            targetValue = 1f,
            animationSpec = infiniteRepeatable(tween(RAIN_CYCLE_MILLIS, easing = LinearEasing)),
            label = "matrix-fall",
        )
    } else {
        rememberUpdatedState(0f)
    }

private fun DrawScope.drawRain(
    glyphs: List<TextLayoutResult>,
    phase: Float,
) {
    val cell = KiokuSpacing.RainCell.toPx()
    val line = KiokuSpacing.RainLine.toPx()
    val travel = size.height + RAIN_TRAIL_LENGTH * line
    val columns = (size.width / cell).toInt().coerceIn(1, RAIN_MAX_COLUMNS)
    repeat(columns) { column ->
        val head = ((phase * (1 + column % 3) + column * 0.173f) * travel) % travel
        repeat(RAIN_TRAIL_LENGTH) { step ->
            val y = head - step * line
            if (y >= -line && y < size.height) {
                val index = (column * 7 + step * 5 + (phase * RAIN_GLYPH_CHANGES).toInt()) % glyphs.size
                val color = if (step == 0) KiokuColors.RainHead else KiokuColors.Rain
                val alpha = if (step == 0) 0.38f else 0.24f * (1f - step.toFloat() / RAIN_TRAIL_LENGTH)
                val glyph = glyphs[index]
                val x = column * cell + (cell - glyph.size.width) / 2
                drawText(glyph, color.copy(alpha = alpha), Offset(x, y))
            }
        }
    }
}
