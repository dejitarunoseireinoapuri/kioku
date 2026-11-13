package io.github.dejitarunoseireinoapuri.kioku.feature.account

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.sizeIn
import androidx.compose.material.ButtonDefaults
import androidx.compose.material.MaterialTheme
import androidx.compose.material.OutlinedButton
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import io.github.dejitarunoseireinoapuri.kioku.resources.Res
import io.github.dejitarunoseireinoapuri.kioku.resources.google_continue
import io.github.dejitarunoseireinoapuri.kioku.resources.google_g
import io.github.dejitarunoseireinoapuri.kioku.resources.google_sans
import org.jetbrains.compose.resources.Font
import org.jetbrains.compose.resources.painterResource
import org.jetbrains.compose.resources.stringResource

private object GoogleBrand {
    val Text = Color(0xFF1F1F1F)
    val Border = Color(0xFF747775)
}

/** Official light branding; original G asset is rendered without tint or stretching. */
@Composable
fun GoogleButton(
    enabled: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val insets = googleButtonInsets()
    OutlinedButton(
        onClick = onClick,
        enabled = enabled,
        modifier = modifier.sizeIn(minHeight = 52.dp),
        shape = MaterialTheme.shapes.small,
        colors = ButtonDefaults.outlinedButtonColors(backgroundColor = Color.White, contentColor = GoogleBrand.Text),
        border = BorderStroke(1.dp, GoogleBrand.Border),
        contentPadding = PaddingValues(horizontal = insets.first.dp, vertical = 12.dp),
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(insets.second.dp),
        ) {
            Image(painterResource(Res.drawable.google_g), null, Modifier.size(18.dp))
            Text(
                stringResource(Res.string.google_continue),
                style =
                    TextStyle(
                        fontFamily = FontFamily(Font(Res.font.google_sans, FontWeight.Medium)),
                        fontWeight = FontWeight.Medium,
                        fontSize = 14.sp,
                        lineHeight = 20.sp,
                    ),
            )
        }
    }
}

internal expect fun googleButtonInsets(): Pair<Int, Int>
