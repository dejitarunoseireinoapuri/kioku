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
    val Background = Color(0xFF020604)
    val ReadingSurface = Background.copy(alpha = 0.94f)
    val Surface = Color(0xFF08110B)
    val Raised = Color(0xFF142319)
    val Text = Color(0xFFE5F4E9)
    val Secondary = Color(0xFF9DB5A3)
    val BrandSecondary = Color(0xFFB9D8C2)
    val Rule = Color(0xFF294333)
    val Accent = Color(0xFF55FF89)
    val Danger = Color(0xFFFFB4A2)
    val Rain = Color(0xFF20BA55)
    val RainHead = Color(0xFFB8FFD1)
}

object KiokuSpacing {
    val Small = 8.dp
    val Medium = 16.dp
    val Large = 24.dp
    val TouchTarget = 48.dp
    val SendBackground = 40.dp
    val IntentHeight = 48.dp
    val Corner = 2.dp
    val Mark = 64.dp
    val LoadingMark = 64.dp
    val InlineLoadingMark = 12.dp
    val CompactContentHeight = 240.dp
    val Stroke = 1.dp
    val LoginVertical = 32.dp
    val LoadingVertical = 48.dp
    val LoginHeadlineGap = 24.dp
    val BrandFrame = 96.dp
    val RainCell = 18.dp
    val RainLine = 18.dp
    val ConfirmationMaxHeight = 560.dp
    val ConfirmationTextHeight = 200.dp
}

@Composable
fun KiokuTheme(content: @Composable () -> Unit) {
    val font =
        FontFamily(
            Font(Res.font.jetbrains_mono_regular, FontWeight.Normal),
            Font(Res.font.jetbrains_mono_semibold, FontWeight.SemiBold),
            Font(Res.font.jetbrains_mono_bold, FontWeight.Bold),
        )
    MaterialTheme(
        colors =
            darkColors(
                primary = KiokuColors.Accent,
                onPrimary = KiokuColors.Background,
                background = KiokuColors.Background,
                onBackground = KiokuColors.Text,
                surface = KiokuColors.Surface,
                onSurface = KiokuColors.Text,
                secondary = KiokuColors.Accent,
            ),
        typography = terminalTypography(font),
        shapes =
            Shapes(
                small = RoundedCornerShape(KiokuSpacing.Corner),
                medium = RoundedCornerShape(KiokuSpacing.Corner),
            ),
        content = {
            CompositionLocalProvider(
                LocalContentAlpha provides 1f,
                LocalRippleConfiguration provides null,
                content = content,
            )
        },
    )
}

private fun terminalTypography(font: FontFamily): Typography {
    val text = TextStyle(fontFamily = font, fontFeatureSettings = "'liga' 0, 'calt' 0")
    return Typography(
        defaultFontFamily = font,
        h5 = text.copy(fontSize = 24.sp, lineHeight = 32.sp, fontWeight = FontWeight.SemiBold),
        body1 = text.copy(fontSize = 16.sp, lineHeight = 24.sp),
        body2 = text.copy(fontSize = 14.sp, lineHeight = 20.sp),
        button = text.copy(fontSize = 16.sp, lineHeight = 24.sp, fontWeight = FontWeight.SemiBold),
    )
}
