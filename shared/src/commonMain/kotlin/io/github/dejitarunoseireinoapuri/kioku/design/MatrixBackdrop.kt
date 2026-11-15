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
import androidx.compose.ui.graphics.drawscope.withTransform
import androidx.compose.ui.graphics.lerp
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.text.drawText
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.sp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.compose.LocalLifecycleOwner
import kotlin.math.PI
import kotlin.math.sin
import kotlin.random.Random

private const val RAIN_CYCLE_MILLIS = 48_000
private const val RAIN_MAX_COLUMNS = 48
private const val RAIN_GLYPH_CHANGES = 96
private const val RAIN_COLOR_CYCLES = 24
private const val RAIN_SEED = 7169
private const val RAIN_MIN_TRAIL = 24
private const val RAIN_MAX_TRAIL = 39
private const val RAIN_MIN_CYCLES = 3
private const val RAIN_MAX_CYCLES = 7
private const val RAIN_GAP_ROWS = 6
private const val RAIN_MIN_INTENSITY = 0.7f
private const val RAIN_MIRROR_PERIOD = 3
private const val RAIN_SYMBOLS = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモラリルレロワヲン0123456789:+=*"

private data class RainColumn(
    val offset: Float,
    val cycles: Int,
    val trail: Int,
    val intensity: Float,
)

private data class RainGrid(
    val cell: Float,
    val line: Float,
    val rows: Int,
)

private fun rainColumns(): List<RainColumn> {
    val random = Random(RAIN_SEED)
    return List(RAIN_MAX_COLUMNS) {
        RainColumn(
            random.nextFloat(),
            random.nextInt(RAIN_MIN_CYCLES, RAIN_MAX_CYCLES),
            random.nextInt(RAIN_MIN_TRAIL, RAIN_MAX_TRAIL),
            RAIN_MIN_INTENSITY + random.nextFloat() * (1f - RAIN_MIN_INTENSITY),
        )
    }
}

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

/** Draws the single decorative layer beneath the transparent foreground. */
@Composable
internal fun MatrixRain(
    active: Boolean,
    modifier: Modifier = Modifier,
) {
    val phase = rainPhase(active)
    val columns = remember { rainColumns() }
    val density = LocalDensity.current
    val decorativeDensity = remember(density.density) { Density(density.density, 1f) }
    val measurer = rememberTextMeasurer(cacheSize = RAIN_SYMBOLS.length)
    val style = MaterialTheme.typography.body2.copy(fontSize = 13.sp, lineHeight = 18.sp)
    val glyphs =
        remember(measurer, style, decorativeDensity) {
            RAIN_SYMBOLS.map { measurer.measure(AnnotatedString(it.toString()), style, density = decorativeDensity) }
        }
    Canvas(modifier.testTag("matrix-rain").clearAndSetSemantics {}) {
        drawRain(glyphs, phase.value, columns)
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
    columns: List<RainColumn>,
) {
    val line = KiokuSpacing.RainLine.toPx()
    val count = (size.width / KiokuSpacing.RainCell.toPx()).toInt().coerceIn(1, RAIN_MAX_COLUMNS)
    val grid = RainGrid(size.width / count, line, (size.height / line).toInt() + 1)
    repeat(count) { index -> drawRainColumn(glyphs, phase, columns[index], index, grid) }
}

private fun DrawScope.drawRainColumn(
    glyphs: List<TextLayoutResult>,
    phase: Float,
    column: RainColumn,
    index: Int,
    grid: RainGrid,
) {
    val travel = grid.rows + column.trail + RAIN_GAP_ROWS
    val head = (((phase * column.cycles + column.offset) % 1f) * travel).toInt()
    repeat(column.trail) { step ->
        val row = head - step
        if (row in 0 until grid.rows) {
            val mutation = (phase * RAIN_GLYPH_CHANGES + column.offset + row * 0.17f).toInt()
            val glyph = glyphs[(index * 7 + row * 5 + mutation) % glyphs.size]
            val pulse = ((sin((phase * RAIN_COLOR_CYCLES + index * 0.37f + row * 0.17f) * 2 * PI) + 1) / 2).toFloat()
            val color = if (step == 0) KiokuColors.RainHead else lerp(KiokuColors.Rain, KiokuColors.Accent, pulse)
            val fade = 1f - step.toFloat() / column.trail
            val alpha = if (step == 0) 0.65f else (0.24f + 0.52f * pulse) * fade * column.intensity
            val x = index * grid.cell + (grid.cell - glyph.size.width) / 2
            drawRainGlyph(
                glyph,
                color.copy(alpha = alpha),
                Offset(x, row * grid.line),
                (index + row) % RAIN_MIRROR_PERIOD == 0,
            )
        }
    }
}

private fun DrawScope.drawRainGlyph(
    glyph: TextLayoutResult,
    color: Color,
    position: Offset,
    mirrored: Boolean,
) {
    if (mirrored) {
        val pivot = position + Offset(glyph.size.width / 2f, glyph.size.height / 2f)
        withTransform({ scale(-1f, 1f, pivot) }) { drawText(glyph, color, position) }
    } else {
        drawText(glyph, color, position)
    }
}
