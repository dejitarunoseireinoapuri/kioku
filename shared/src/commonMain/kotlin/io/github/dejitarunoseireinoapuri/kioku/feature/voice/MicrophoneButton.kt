package io.github.dejitarunoseireinoapuri.kioku.feature.voice

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.sizeIn
import androidx.compose.material.Icon
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.layout.positionInWindow
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.CustomAccessibilityAction
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.customActions
import androidx.compose.ui.semantics.disabled
import androidx.compose.ui.semantics.onClick
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuColors
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuSpacing
import io.github.dejitarunoseireinoapuri.kioku.resources.Res
import io.github.dejitarunoseireinoapuri.kioku.resources.icon_microphone
import io.github.dejitarunoseireinoapuri.kioku.resources.voice_cancel
import io.github.dejitarunoseireinoapuri.kioku.resources.voice_finish
import io.github.dejitarunoseireinoapuri.kioku.resources.voice_microphone
import org.jetbrains.compose.resources.painterResource
import org.jetbrains.compose.resources.stringResource

@Composable
fun MicrophoneButton(
    enabled: Boolean,
    modifier: Modifier = Modifier,
) {
    val interaction = LocalVoiceInteraction.current
    val latest by rememberUpdatedState(interaction)
    val available by rememberUpdatedState(enabled && interaction.state !is VoiceState.Finishing)
    var windowY by remember { mutableFloatStateOf(0f) }
    val label = stringResource(Res.string.voice_microphone)
    val finish = stringResource(Res.string.voice_finish)
    val cancel = stringResource(Res.string.voice_cancel)
    Box(
        modifier
            .sizeIn(minWidth = KiokuSpacing.TouchTarget, minHeight = KiokuSpacing.TouchTarget)
            .testTag("voice-microphone")
            .onGloballyPositioned { windowY = it.positionInWindow().y }
            .semantics {
                role = Role.Button
                contentDescription = label
                if (!available) disabled()
                onClick {
                    if (available) latest.act(VoiceAction.AccessibleToggle)
                    available
                }
                customActions =
                    listOf(
                        CustomAccessibilityAction(finish) {
                            latest.act(VoiceAction.Finish)
                            true
                        },
                        CustomAccessibilityAction(cancel) {
                            latest.act(VoiceAction.Cancel)
                            true
                        },
                    )
            }.voiceGesture({ available }, { latest }, { windowY }),
        contentAlignment = Alignment.Center,
    ) {
        Icon(
            painterResource(Res.drawable.icon_microphone),
            null,
            tint = if (enabled) KiokuColors.Accent else KiokuColors.Secondary,
        )
    }
}
