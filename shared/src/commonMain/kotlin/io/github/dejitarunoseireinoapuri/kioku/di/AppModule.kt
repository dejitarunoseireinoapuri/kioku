package io.github.dejitarunoseireinoapuri.kioku.di

import io.github.dejitarunoseireinoapuri.kioku.data.DemoSourceRepository
import io.github.dejitarunoseireinoapuri.kioku.domain.ReadReferencedSource
import io.github.dejitarunoseireinoapuri.kioku.domain.SourceRepository
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.ConversationViewModel
import org.koin.core.module.dsl.viewModel
import org.koin.dsl.module

val appModule =
    module {
        single<SourceRepository> { DemoSourceRepository() }
        factory { ReadReferencedSource(get()) }
        viewModel { ConversationViewModel(get()) }
    }
