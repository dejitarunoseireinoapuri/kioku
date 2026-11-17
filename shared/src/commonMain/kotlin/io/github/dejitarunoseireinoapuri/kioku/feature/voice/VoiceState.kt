package io.github.dejitarunoseireinoapuri.kioku.feature.voice

import io.github.dejitarunoseireinoapuri.kioku.domain.VoiceIssue

sealed interface VoiceState {
    data object Idle : VoiceState

    data object Preparing : VoiceState

    data class Listening(
        val text: String = "",
    ) : VoiceState

    data class Finishing(
        val text: String,
    ) : VoiceState

    data class Failed(
        val issue: VoiceIssue,
        val text: String = "",
    ) : VoiceState

    data class Completed(
        val text: String,
    ) : VoiceState
}

val VoiceState.busy: Boolean
    get() = this is VoiceState.Preparing || this is VoiceState.Listening || this is VoiceState.Finishing

val VoiceState.transcript: String
    get() =
        when (this) {
            is VoiceState.Listening -> text
            is VoiceState.Finishing -> text
            is VoiceState.Failed -> text
            is VoiceState.Completed -> text
            else -> ""
        }

enum class VoiceAction { Start, Finish, Cancel, Permission, KeepText }
