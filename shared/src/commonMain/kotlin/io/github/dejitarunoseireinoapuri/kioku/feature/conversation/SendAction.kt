package io.github.dejitarunoseireinoapuri.kioku.feature.conversation

import androidx.compose.foundation.background
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.material.Icon
import androidx.compose.material.IconButton
import androidx.compose.material.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuColors
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuSpacing
import io.github.dejitarunoseireinoapuri.kioku.resources.Res
import io.github.dejitarunoseireinoapuri.kioku.resources.icon_send
import io.github.dejitarunoseireinoapuri.kioku.resources.send
import org.jetbrains.compose.resources.painterResource
import org.jetbrains.compose.resources.stringResource

@Composable
internal fun SendAction(
    enabled: Boolean,
    onSend: () -> Unit,
) {
    val interaction = remember { MutableInteractionSource() }
    val pressed by interaction.collectIsPressedAsState()
    val focused by interaction.collectIsFocusedAsState()
    val tint =
        when {
            !enabled -> KiokuColors.Secondary
            pressed || focused -> KiokuColors.Background.copy(alpha = 0.7f)
            else -> KiokuColors.Background
        }
    IconButton(
        onClick = onSend,
        enabled = enabled,
        interactionSource = interaction,
        modifier = Modifier.size(KiokuSpacing.TouchTarget).testTag("send-action"),
    ) {
        Box(
            Modifier
                .size(KiokuSpacing.SendBackground)
                .background(if (enabled) KiokuColors.Coral else Color.Transparent, MaterialTheme.shapes.small),
            contentAlignment = Alignment.Center,
        ) {
            Icon(painterResource(Res.drawable.icon_send), stringResource(Res.string.send), tint = tint)
        }
    }
}
