package io.github.dejitarunoseireinoapuri.kioku.design

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.LocalContentAlpha
import androidx.compose.material.LocalRippleConfiguration
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Shapes
import androidx.compose.material.Typography
import androidx.compose.material.darkColors
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import io.github.dejitarunoseireinoapuri.kioku.resources.Res
import io.github.dejitarunoseireinoapuri.kioku.resources.jetbrains_mono_bold
import io.github.dejitarunoseireinoapuri.kioku.resources.jetbrains_mono_regular
import io.github.dejitarunoseireinoapuri.kioku.resources.jetbrains_mono_semibold
import org.jetbrains.compose.resources.Font

object KiokuColors {
    val Background = Color(0xFF14171B)
    val Surface = Color(0xFF1A1E23)
    val Raised = Color(0xFF22272E)
    val Text = Color(0xFFF2F3F4)
    val Secondary = Color(0xFFA7AFBA)
    val BrandSecondary = Color(0xFFB9C0C9)
    val Rule = Color(0xFF343B44)
    val Coral = Color(0xFFFF674F)
}

object KiokuSpacing {
    val Small = 8.dp
    val Medium = 16.dp
    val Large = 24.dp
    val TouchTarget = 48.dp
    val SendBackground = 40.dp
    val IntentHeight = 64.dp
    val Corner = 6.dp
    val Mark = 112.dp
    val LoadingMark = 96.dp
    val InlineLoadingMark = 32.dp
    val Stroke = 1.dp
    val LoginVertical = 32.dp
    val LoadingVertical = 48.dp
    val LoginHeadlineGap = 64.dp
}

@Composable
fun KiokuTheme(content: @Composable () -> Unit) {
    val font =
        FontFamily(
            Font(Res.font.jetbrains_mono_regular, FontWeight.Normal),
            Font(Res.font.jetbrains_mono_semibold, FontWeight.SemiBold),
            Font(Res.font.jetbrains_mono_bold, FontWeight.Bold),
        )
    val text = TextStyle(fontFamily = font, fontFeatureSettings = "'liga' 0, 'calt' 0")
    MaterialTheme(
        colors =
            darkColors(
                primary = KiokuColors.Coral,
                onPrimary = KiokuColors.Background,
                background = KiokuColors.Background,
                onBackground = KiokuColors.Text,
                surface = KiokuColors.Surface,
                onSurface = KiokuColors.Text,
                secondary = KiokuColors.Coral,
            ),
        typography =
            Typography(
                defaultFontFamily = font,
                h5 =
                    text.copy(
                        fontSize = 24.sp,
                        lineHeight = 32.sp,
                        fontWeight = FontWeight.SemiBold,
                    ),
                body1 = text.copy(fontSize = 16.sp, lineHeight = 24.sp),
                body2 = text.copy(fontSize = 14.sp, lineHeight = 20.sp),
                button =
                    text.copy(
                        fontSize = 16.sp,
                        lineHeight = 24.sp,
                        fontWeight = FontWeight.SemiBold,
                    ),
            ),
        shapes = Shapes(small = RoundedCornerShape(6.dp), medium = RoundedCornerShape(8.dp)),
        content = {
            CompositionLocalProvider(
                LocalContentAlpha provides 1f,
                LocalRippleConfiguration provides null,
                content = content,
            )
        },
    )
}
