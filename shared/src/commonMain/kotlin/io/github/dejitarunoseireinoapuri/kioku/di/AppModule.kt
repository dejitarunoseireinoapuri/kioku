package io.github.dejitarunoseireinoapuri.kioku.di

import io.github.dejitarunoseireinoapuri.kioku.data.DemoSourceRepository
import io.github.dejitarunoseireinoapuri.kioku.domain.AccountRepository
import io.github.dejitarunoseireinoapuri.kioku.domain.AppearanceRepository
import io.github.dejitarunoseireinoapuri.kioku.domain.MemoryControlRepository
import io.github.dejitarunoseireinoapuri.kioku.domain.ReadReferencedSource
import io.github.dejitarunoseireinoapuri.kioku.domain.SourceRepository
import io.github.dejitarunoseireinoapuri.kioku.feature.account.AccountViewModel
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.ConversationViewModel
import io.github.dejitarunoseireinoapuri.kioku.feature.settings.AppearanceViewModel
import io.github.dejitarunoseireinoapuri.kioku.feature.source.SourceControlViewModel
import org.koin.core.module.dsl.viewModel
import org.koin.dsl.module

fun appModule() =
    module {
        single<SourceRepository> { DemoSourceRepository() }
        factory { ReadReferencedSource(get()) }
        viewModel { (dependencies: ConversationDependencies) ->
            ConversationViewModel(
                get(),
                dependencies.captures,
                dependencies.queries,
                dependencies.controls,
                dependencies.conversation,
            )
        }
        viewModel { parameters ->
            SourceControlViewModel(parameters.get<MemoryControlRepository>(), parameters.get<List<String>>())
        }
        viewModel { (account: AccountRepository) -> AccountViewModel(account) }
        viewModel { (appearance: AppearanceRepository) -> AppearanceViewModel(appearance) }
    }
