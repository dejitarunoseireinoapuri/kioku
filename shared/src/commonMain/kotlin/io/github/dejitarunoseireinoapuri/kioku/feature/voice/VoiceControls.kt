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
import io.github.dejitarunoseireinoapuri.kioku.resources.icon_voice_cancel
import io.github.dejitarunoseireinoapuri.kioku.resources.icon_voice_stop
import io.github.dejitarunoseireinoapuri.kioku.resources.voice_cancel
import io.github.dejitarunoseireinoapuri.kioku.resources.voice_finish
import org.jetbrains.compose.resources.DrawableResource
import org.jetbrains.compose.resources.painterResource
import org.jetbrains.compose.resources.stringResource

@Composable
fun VoiceControls() {
    val interaction = LocalVoiceInteraction.current
    VoiceIconAction(Res.drawable.icon_voice_cancel, stringResource(Res.string.voice_cancel), "voice-cancel") {
        interaction.act(VoiceAction.Cancel)
    }
    VoiceIconAction(
        Res.drawable.icon_voice_stop,
        stringResource(Res.string.voice_finish),
        "voice-stop",
        interaction.state !is VoiceState.Finishing,
    ) { interaction.act(VoiceAction.Finish) }
}

@Composable
private fun VoiceIconAction(
    drawable: DrawableResource,
    label: String,
    tag: String,
    enabled: Boolean = true,
    action: () -> Unit,
) {
    IconButton(action, Modifier.size(KiokuSpacing.TouchTarget).testTag(tag), enabled = enabled) {
        Icon(
            painterResource(drawable),
            label,
            tint = if (enabled) KiokuColors.Accent else KiokuColors.Secondary,
        )
    }
}
