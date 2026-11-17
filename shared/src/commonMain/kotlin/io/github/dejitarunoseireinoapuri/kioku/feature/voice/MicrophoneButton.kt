package io.github.dejitarunoseireinoapuri.kioku.feature.voice

import androidx.compose.foundation.layout.size
import androidx.compose.material.Icon
import androidx.compose.material.IconButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuColors
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuSpacing
import io.github.dejitarunoseireinoapuri.kioku.resources.Res
import io.github.dejitarunoseireinoapuri.kioku.resources.icon_microphone
import io.github.dejitarunoseireinoapuri.kioku.resources.voice_microphone
import org.jetbrains.compose.resources.painterResource
import org.jetbrains.compose.resources.stringResource

@Composable
fun MicrophoneButton(enabled: Boolean) {
    val interaction = LocalVoiceInteraction.current
    IconButton(
        onClick = { interaction.act(VoiceAction.Start) },
        enabled = enabled,
        modifier = Modifier.size(KiokuSpacing.TouchTarget).testTag("voice-microphone"),
    ) {
        Icon(
            painterResource(Res.drawable.icon_microphone),
            stringResource(Res.string.voice_microphone),
            tint = if (enabled) KiokuColors.Accent else KiokuColors.Secondary,
        )
    }
}
