package io.github.dejitarunoseireinoapuri.kioku.design

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.size
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.TextUnit
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
fun KiokuWordmark(size: TextUnit = 38.sp) {
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
