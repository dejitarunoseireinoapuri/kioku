package io.github.dejitarunoseireinoapuri.kioku.feature.account

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.layout.Row
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.graphics.drawscope.clipRect
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.text
import androidx.compose.ui.text.AnnotatedString
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuColors
import io.github.dejitarunoseireinoapuri.kioku.resources.Res
import io.github.dejitarunoseireinoapuri.kioku.resources.account_loading
import io.github.dejitarunoseireinoapuri.kioku.resources.account_loading_label
import io.github.dejitarunoseireinoapuri.kioku.resources.loading_dots
import org.jetbrains.compose.resources.stringResource

@Composable
internal fun LoadingStatusText(modifier: Modifier = Modifier) {
    val announcement = stringResource(Res.string.account_loading)
    val transition = rememberInfiniteTransition(label = "loading-dots")
    val phase by transition.animateFloat(
        initialValue = 0f,
        targetValue = 4f,
        animationSpec = infiniteRepeatable(tween(1200, easing = LinearEasing)),
        label = "visible-dots",
    )
    Row(modifier.clearAndSetSemantics { text = AnnotatedString(announcement) }) {
        Text(stringResource(Res.string.account_loading_label), color = KiokuColors.BrandSecondary)
        Text(
            stringResource(Res.string.loading_dots),
            color = KiokuColors.BrandSecondary,
            // Always measure all three dots. Only drawing changes, so the label never recenters.
            modifier =
                Modifier.drawWithContent {
                    val visibleFraction = phase.toInt().coerceIn(0, 3) / 3f
                    clipRect(right = size.width * visibleFraction) { this@drawWithContent.drawContent() }
                },
        )
    }
}
