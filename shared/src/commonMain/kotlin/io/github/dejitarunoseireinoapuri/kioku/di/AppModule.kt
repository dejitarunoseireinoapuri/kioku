package io.github.dejitarunoseireinoapuri.kioku.di

import io.github.dejitarunoseireinoapuri.kioku.data.DemoSourceRepository
import io.github.dejitarunoseireinoapuri.kioku.domain.AccountRepository
import io.github.dejitarunoseireinoapuri.kioku.domain.ReadReferencedSource
import io.github.dejitarunoseireinoapuri.kioku.domain.SourceRepository
import io.github.dejitarunoseireinoapuri.kioku.feature.account.AccountViewModel
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.ConversationViewModel
import org.koin.core.module.dsl.viewModel
import org.koin.dsl.module

fun appModule() =
    module {
        single<SourceRepository> { DemoSourceRepository() }
        factory { ReadReferencedSource(get()) }
        viewModel { (dependencies: ConversationDependencies) ->
            ConversationViewModel(get(), dependencies.captures, dependencies.queries)
        }
        viewModel { (account: AccountRepository) -> AccountViewModel(account) }
    }
