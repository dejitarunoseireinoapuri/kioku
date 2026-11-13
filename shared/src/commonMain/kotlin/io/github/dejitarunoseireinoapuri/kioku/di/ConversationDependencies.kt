package io.github.dejitarunoseireinoapuri.kioku.di

import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureRepository

data class ConversationDependencies(
    val captures: CaptureRepository?,
)
