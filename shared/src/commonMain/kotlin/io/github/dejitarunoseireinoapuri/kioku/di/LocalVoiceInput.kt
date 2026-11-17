package io.github.dejitarunoseireinoapuri.kioku.di

import androidx.compose.runtime.staticCompositionLocalOf
import io.github.dejitarunoseireinoapuri.kioku.domain.VoiceInput

/** Native hosts provide their microphone boundary here, before the account-scoped UI. */
val LocalVoiceInput = staticCompositionLocalOf<VoiceInput?> { null }
