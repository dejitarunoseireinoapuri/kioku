package io.github.dejitarunoseireinoapuri.kioku.design

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.sizeIn
import androidx.compose.material.Button
import androidx.compose.material.ButtonDefaults
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color

@Composable
fun AccentButton(
    label: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
) {
    val feedback = rememberButtonFeedback(KiokuColors.Accent, KiokuColors.Text)
    Button(
        onClick = onClick,
        enabled = enabled,
        modifier = modifier.sizeIn(minHeight = KiokuSpacing.TouchTarget),
        colors =
            ButtonDefaults.buttonColors(
                backgroundColor = Color.Transparent,
                disabledBackgroundColor = Color.Transparent,
                contentColor = feedback.contentColor,
            ),
        elevation = null,
        border = BorderStroke(KiokuSpacing.Stroke, if (enabled) KiokuColors.Accent else KiokuColors.Rule),
        interactionSource = feedback.interactionSource,
    ) { Text(label) }
}
