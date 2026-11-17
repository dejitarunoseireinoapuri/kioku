package io.github.dejitarunoseireinoapuri.kioku.feature.voice

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.text.style.TextOverflow
import io.github.dejitarunoseireinoapuri.kioku.design.ActionButton
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuColors
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuSpacing
import io.github.dejitarunoseireinoapuri.kioku.domain.VoiceIssue
import io.github.dejitarunoseireinoapuri.kioku.resources.Res
import io.github.dejitarunoseireinoapuri.kioku.resources.voice_cancel
import io.github.dejitarunoseireinoapuri.kioku.resources.voice_finish
import io.github.dejitarunoseireinoapuri.kioku.resources.voice_finishing
import io.github.dejitarunoseireinoapuri.kioku.resources.voice_interrupted
import io.github.dejitarunoseireinoapuri.kioku.resources.voice_keep_text
import io.github.dejitarunoseireinoapuri.kioku.resources.voice_language_missing
import io.github.dejitarunoseireinoapuri.kioku.resources.voice_listening
import io.github.dejitarunoseireinoapuri.kioku.resources.voice_locked
import io.github.dejitarunoseireinoapuri.kioku.resources.voice_no_speech
import io.github.dejitarunoseireinoapuri.kioku.resources.voice_permission
import io.github.dejitarunoseireinoapuri.kioku.resources.voice_permission_action
import io.github.dejitarunoseireinoapuri.kioku.resources.voice_preparing
import io.github.dejitarunoseireinoapuri.kioku.resources.voice_too_long
import io.github.dejitarunoseireinoapuri.kioku.resources.voice_unavailable
import io.github.dejitarunoseireinoapuri.kioku.resources.voice_unsupported
import org.jetbrains.compose.resources.stringResource

@Composable
fun VoiceStatus() {
    val interaction = LocalVoiceInteraction.current
    val state = interaction.state
    if (state is VoiceState.Idle || state is VoiceState.Completed) return
    Column(verticalArrangement = Arrangement.spacedBy(KiokuSpacing.Small)) {
        Text(
            stringResource(
                voiceStatusText(state),
            ),
            color = KiokuColors.Accent,
        )
        if (state.transcript.isNotBlank()) Text(state.transcript, maxLines = 4, overflow = TextOverflow.Ellipsis)
        if (state.locked) ActionButton(stringResource(Res.string.voice_finish), { interaction.act(VoiceAction.Finish) })
        if (state is VoiceState.Failed && state.issue == VoiceIssue.Permission) {
            ActionButton(
                stringResource(Res.string.voice_permission_action),
                { interaction.act(VoiceAction.Permission) },
            )
        }
        if (state is VoiceState.Failed && state.text.isNotBlank()) {
            ActionButton(stringResource(Res.string.voice_keep_text), { interaction.act(VoiceAction.KeepText) })
        }
        ActionButton(stringResource(Res.string.voice_cancel), { interaction.act(VoiceAction.Cancel) })
    }
}

private fun voiceStatusText(state: VoiceState) =
    when (state) {
        is VoiceState.Preparing -> Res.string.voice_preparing
        is VoiceState.Listening -> if (state.locked) Res.string.voice_locked else Res.string.voice_listening
        is VoiceState.Finishing -> Res.string.voice_finishing
        is VoiceState.Failed -> voiceIssueText(state.issue)
        else -> Res.string.voice_unavailable
    }

private fun voiceIssueText(issue: VoiceIssue) =
    when (issue) {
        VoiceIssue.Unsupported -> Res.string.voice_unsupported
        VoiceIssue.LanguageMissing -> Res.string.voice_language_missing
        VoiceIssue.Permission -> Res.string.voice_permission
        VoiceIssue.Interrupted -> Res.string.voice_interrupted
        VoiceIssue.NoSpeech -> Res.string.voice_no_speech
        VoiceIssue.TooLong -> Res.string.voice_too_long
        VoiceIssue.Unavailable -> Res.string.voice_unavailable
    }
