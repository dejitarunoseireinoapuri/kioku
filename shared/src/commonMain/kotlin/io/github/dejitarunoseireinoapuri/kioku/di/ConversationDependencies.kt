package io.github.dejitarunoseireinoapuri.kioku.di

import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureRepository
import io.github.dejitarunoseireinoapuri.kioku.domain.MemoryControlRepository
import io.github.dejitarunoseireinoapuri.kioku.domain.QueryRepository
import io.github.dejitarunoseireinoapuri.kioku.domain.TextConversationRepository

data class ConversationDependencies(
    val captures: CaptureRepository?,
    val queries: QueryRepository? = null,
    val controls: MemoryControlRepository? = null,
    val conversation: TextConversationRepository? = null,
)
