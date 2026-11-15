package io.github.dejitarunoseireinoapuri.kioku.design

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import io.github.dejitarunoseireinoapuri.kioku.resources.Res
import io.github.dejitarunoseireinoapuri.kioku.resources.brand_wordmark
import io.github.dejitarunoseireinoapuri.kioku.resources.kioku_mark
import org.jetbrains.compose.resources.painterResource
import org.jetbrains.compose.resources.stringResource

/** Outlined Noto Sans JP 900 glyph: identical geometry on Android and Apple, no font fallback. */
@Composable
fun KiokuMark(modifier: Modifier = Modifier.size(KiokuSpacing.Mark)) {
    Image(painterResource(Res.drawable.kioku_mark), contentDescription = null, modifier = modifier)
}

@Composable
fun TerminalBrandMark(modifier: Modifier = Modifier) {
    Box(
        modifier.size(KiokuSpacing.BrandFrame).drawBehind {
            val arm = 9.dp.toPx()
            val stroke = KiokuSpacing.Stroke.toPx()
            listOf(Offset.Zero, Offset(size.width, 0f), Offset(0f, size.height), Offset(size.width, size.height))
                .forEach { corner ->
                    val x = if (corner.x == 0f) arm else -arm
                    val y = if (corner.y == 0f) arm else -arm
                    drawLine(KiokuColors.Accent, corner, corner + Offset(x, 0f), stroke)
                    drawLine(KiokuColors.Accent, corner, corner + Offset(0f, y), stroke)
                }
        },
        contentAlignment = Alignment.Center,
    ) { KiokuMark(Modifier.size(KiokuSpacing.Mark)) }
}

@Composable
fun KiokuWordmark(size: TextUnit = 24.sp) {
    Text(
        stringResource(Res.string.brand_wordmark),
        color = KiokuColors.Text,
        style =
            MaterialTheme.typography.h5.copy(
                fontSize = size,
                lineHeight = size * 1.2f,
                fontWeight = FontWeight.Bold,
            ),
    )
}
