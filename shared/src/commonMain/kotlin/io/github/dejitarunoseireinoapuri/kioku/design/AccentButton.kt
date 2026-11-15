package io.github.dejitarunoseireinoapuri.kioku.design

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
) {
    val feedback = rememberButtonFeedback(KiokuColors.Background, Color.Black)
    Button(
        onClick = onClick,
        modifier = modifier.sizeIn(minHeight = KiokuSpacing.TouchTarget),
        colors =
            ButtonDefaults.buttonColors(
                backgroundColor = KiokuColors.Coral,
                contentColor = feedback.contentColor,
            ),
        elevation = null,
        interactionSource = feedback.interactionSource,
    ) { Text(label) }
}
