package io.github.dejitarunoseireinoapuri.kioku.design

import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.graphics.Color

data class ButtonFeedback(
    val interactionSource: MutableInteractionSource,
    val contentColor: Color,
)

/** Pointer release/cancellation restores the label; keyboard focus remains visible without a halo. */
@Composable
fun rememberButtonFeedback(restingColor: Color): ButtonFeedback {
    val interaction = remember { MutableInteractionSource() }
    val pressed by interaction.collectIsPressedAsState()
    val focused by interaction.collectIsFocusedAsState()
    return ButtonFeedback(interaction, if (pressed || focused) KiokuColors.Coral else restingColor)
}
