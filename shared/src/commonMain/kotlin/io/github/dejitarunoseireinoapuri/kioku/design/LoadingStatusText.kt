package io.github.dejitarunoseireinoapuri.kioku.design

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.text
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.withStyle
import io.github.dejitarunoseireinoapuri.kioku.resources.Res
import io.github.dejitarunoseireinoapuri.kioku.resources.loading_dots
import org.jetbrains.compose.resources.stringResource

@Composable
internal fun LoadingStatusText(
    status: String,
    modifier: Modifier = Modifier,
    textAlign: TextAlign = TextAlign.Center,
) {
    val dots = stringResource(Res.string.loading_dots)
    val label = status.removeSuffix(dots)
    val announcement = label + dots
    val transition = rememberInfiniteTransition(label = "loading-dots")
    val phase by transition.animateFloat(
        initialValue = 0f,
        targetValue = 4f,
        animationSpec = infiniteRepeatable(tween(1200, easing = LinearEasing)),
        label = "visible-dots",
    )
    val statusText =
        buildAnnotatedString {
            append(label)
            // Keep all dots in the layout, including when a long status wraps with large system text.
            dots.forEachIndexed { index, dot ->
                val color = if (index < phase.toInt()) KiokuColors.BrandSecondary else Color.Transparent
                withStyle(SpanStyle(color = color)) { append(dot) }
            }
        }
    Text(
        statusText,
        modifier.clearAndSetSemantics { text = AnnotatedString(announcement) },
        color = KiokuColors.BrandSecondary,
        textAlign = textAlign,
    )
}
