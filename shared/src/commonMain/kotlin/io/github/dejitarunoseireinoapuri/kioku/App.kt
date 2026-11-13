package io.github.dejitarunoseireinoapuri.kioku

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.material.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.lifecycle.ViewModelStore
import androidx.lifecycle.ViewModelStoreOwner
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.LocalViewModelStoreOwner
import androidx.navigation3.runtime.entryProvider
import androidx.navigation3.runtime.rememberNavBackStack
import androidx.navigation3.ui.NavDisplay
import io.github.dejitarunoseireinoapuri.kioku.data.DisconnectedAccountRepository
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuColors
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuTheme
import io.github.dejitarunoseireinoapuri.kioku.di.ConversationDependencies
import io.github.dejitarunoseireinoapuri.kioku.di.appModule
import io.github.dejitarunoseireinoapuri.kioku.domain.AccountRepository
import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureRepository
import io.github.dejitarunoseireinoapuri.kioku.feature.account.AccountScreen
import io.github.dejitarunoseireinoapuri.kioku.feature.account.AccountState
import io.github.dejitarunoseireinoapuri.kioku.feature.account.AccountViewModel
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.ConversationEvent
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.ConversationScreen
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.ConversationViewModel
import io.github.dejitarunoseireinoapuri.kioku.feature.settings.SettingsScreen
import io.github.dejitarunoseireinoapuri.kioku.feature.source.SourceScreen
import io.github.dejitarunoseireinoapuri.kioku.navigation.Route
import io.github.dejitarunoseireinoapuri.kioku.navigation.navigationConfiguration
import org.koin.compose.KoinApplication
import org.koin.compose.viewmodel.koinViewModel
import org.koin.core.parameter.parametersOf
import org.koin.dsl.koinConfiguration
import org.koin.dsl.module

@Composable
fun KiokuApp(
    accountRepository: AccountRepository = remember { DisconnectedAccountRepository() },
    captureRepository: CaptureRepository? = null,
) {
    val platform =
        remember(accountRepository, captureRepository) {
            module {
                single<AccountRepository> { accountRepository }
            }
        }
    val application = remember { appModule() }
    KoinApplication(configuration = koinConfiguration { modules(application, platform) }) {
        KiokuTheme {
            Surface(color = KiokuColors.Background, contentColor = KiokuColors.Text) {
                Column(Modifier.fillMaxSize().safeDrawingPadding()) {
                    CompositionViewModels { AccountGate(accountRepository, captureRepository) }
                }
            }
        }
    }
}

@Composable
private fun AccountGate(
    accountRepository: AccountRepository,
    captureRepository: CaptureRepository?,
    viewModel: AccountViewModel = koinViewModel(parameters = { parametersOf(accountRepository) }),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val authorized = state as? AccountState.Authorized
    if (authorized == null) {
        AccountScreen(state, viewModel::signIn, viewModel::retry, viewModel::signOut)
    } else {
        key(authorized.session.id, authorized.session.generation) {
            CompositionViewModels {
                Column(Modifier.fillMaxSize().imePadding()) {
                    KiokuNavigation(authorized, viewModel::signOut, viewModel::refresh, captureRepository)
                }
            }
        }
    }
}

@Composable
private fun CompositionViewModels(content: @Composable () -> Unit) {
    val owner =
        remember {
            object : ViewModelStoreOwner {
                override val viewModelStore = ViewModelStore()
            }
        }
    DisposableEffect(owner) { onDispose { owner.viewModelStore.clear() } }
    CompositionLocalProvider(LocalViewModelStoreOwner provides owner, content = content)
}

@Composable
private fun KiokuNavigation(
    account: AccountState.Authorized,
    onSignOut: () -> Unit,
    onRefresh: () -> Unit,
    captureRepository: CaptureRepository?,
    viewModel: ConversationViewModel =
        koinViewModel(
            parameters = { parametersOf(ConversationDependencies(captureRepository)) },
        ),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val backStack = rememberNavBackStack(navigationConfiguration, Route.Conversation)
    val back: () -> Unit = { if (backStack.size > 1) backStack.removeLastOrNull() }
    NavDisplay(
        backStack = backStack,
        onBack = back,
        entryProvider =
            entryProvider {
                entry<Route.Conversation> {
                    ConversationScreen(state, viewModel::onEvent, { backStack.add(Route.Settings) }) { id ->
                        if (viewModel.openSource(id)) backStack.add(Route.Source(id))
                    }
                }
                entry<Route.Settings> {
                    SettingsScreen(account, onSignOut, onRefresh, back) { scenario ->
                        viewModel.onEvent(ConversationEvent.ShowExample(scenario))
                        back()
                    }
                }
                entry<Route.Source> { route ->
                    SourceScreen(
                        state.source?.takeIf { it.id == route.id },
                        state.feedback,
                        back,
                        viewModel::sourceActionUnavailable,
                    )
                }
            },
    )
}
