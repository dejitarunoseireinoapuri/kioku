package io.github.dejitarunoseireinoapuri.kioku.di

import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureRepository
import io.github.dejitarunoseireinoapuri.kioku.domain.QueryRepository

data class ConversationDependencies(
    val captures: CaptureRepository?,
    val queries: QueryRepository? = null,
)
