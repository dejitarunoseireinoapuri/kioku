package io.github.dejitarunoseireinoapuri.kioku

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.compose.LifecycleEventEffect
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.LocalViewModelStoreOwner
import androidx.lifecycle.viewmodel.compose.rememberViewModelStoreOwner
import androidx.navigation3.runtime.entryProvider
import androidx.navigation3.runtime.rememberNavBackStack
import androidx.navigation3.ui.NavDisplay
import io.github.dejitarunoseireinoapuri.kioku.data.DisconnectedAccountRepository
import io.github.dejitarunoseireinoapuri.kioku.data.MemoryAppearanceRepository
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuColors
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuSafeArea
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuTheme
import io.github.dejitarunoseireinoapuri.kioku.design.MatrixBackdrop
import io.github.dejitarunoseireinoapuri.kioku.di.ConversationDependencies
import io.github.dejitarunoseireinoapuri.kioku.di.appModule
import io.github.dejitarunoseireinoapuri.kioku.domain.AccountRepository
import io.github.dejitarunoseireinoapuri.kioku.domain.AppearanceRepository
import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureRepository
import io.github.dejitarunoseireinoapuri.kioku.domain.MemoryControlRepository
import io.github.dejitarunoseireinoapuri.kioku.domain.QueryRepository
import io.github.dejitarunoseireinoapuri.kioku.domain.TextConversationRepository
import io.github.dejitarunoseireinoapuri.kioku.feature.account.AccountScreen
import io.github.dejitarunoseireinoapuri.kioku.feature.account.AccountState
import io.github.dejitarunoseireinoapuri.kioku.feature.account.AccountViewModel
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.ConversationEvent
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.ConversationScreen
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.ConversationViewModel
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.contentLoadingStatus
import io.github.dejitarunoseireinoapuri.kioku.feature.settings.AppearanceSettingsState
import io.github.dejitarunoseireinoapuri.kioku.feature.settings.AppearanceViewModel
import io.github.dejitarunoseireinoapuri.kioku.feature.settings.LocalAppearanceSettings
import io.github.dejitarunoseireinoapuri.kioku.feature.settings.SettingsScreen
import io.github.dejitarunoseireinoapuri.kioku.feature.source.SourceControlRoute
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
    queryRepository: QueryRepository? = null,
    controlRepository: MemoryControlRepository? = null,
    conversationRepository: TextConversationRepository? = null,
    appearanceRepository: AppearanceRepository = remember { MemoryAppearanceRepository() },
) {
    val platform =
        remember(accountRepository, captureRepository) {
            module {
                single<AccountRepository> { accountRepository }
            }
        }
    val application = remember { appModule() }
    KoinApplication(configuration = koinConfiguration { modules(application, platform) }) {
        AppAppearance(appearanceRepository) {
            Surface(color = KiokuColors.Background, contentColor = KiokuColors.Text) {
                MatrixBackdrop {
                    KiokuSafeArea {
                        CompositionViewModels {
                            AccountGate(
                                accountRepository,
                                ConversationDependencies(
                                    captureRepository,
                                    queryRepository,
                                    controlRepository,
                                    conversationRepository,
                                ),
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun AppAppearance(
    repository: AppearanceRepository,
    content: @Composable () -> Unit,
) {
    val model = koinViewModel<AppearanceViewModel>(parameters = { parametersOf(repository) })
    val enabled by model.fallingLetters.collectAsStateWithLifecycle()
    KiokuTheme {
        CompositionLocalProvider(
            LocalAppearanceSettings provides AppearanceSettingsState(enabled, model::setFallingLetters),
            content = content,
        )
    }
}

@Composable
private fun AccountGate(
    accountRepository: AccountRepository,
    dependencies: ConversationDependencies,
    viewModel: AccountViewModel = koinViewModel(parameters = { parametersOf(accountRepository) }),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val authorized = state as? AccountState.Authorized
    if (authorized == null) {
        AccountScreen(state, viewModel::signIn, viewModel::retry, viewModel::signOut)
    } else {
        key(authorized.session.id, authorized.session.generation) {
            CompositionViewModels {
                KiokuNavigation(
                    authorized,
                    viewModel::signOut,
                    viewModel::refresh,
                    dependencies,
                )
            }
        }
    }
}

@Composable
internal fun CompositionViewModels(content: @Composable () -> Unit) {
    val owner = rememberViewModelStoreOwner()
    CompositionLocalProvider(LocalViewModelStoreOwner provides owner, content = content)
}

@Composable
private fun KiokuNavigation(
    account: AccountState.Authorized,
    onSignOut: () -> Unit,
    onRefresh: () -> Unit,
    dependencies: ConversationDependencies,
    viewModel: ConversationViewModel =
        koinViewModel(
            parameters = { parametersOf(dependencies) },
        ),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val backStack = rememberNavBackStack(navigationConfiguration, Route.Conversation)
    val controlChanged =
        androidx.compose.runtime.saveable.rememberSaveable {
            androidx.compose.runtime.mutableStateOf(false)
        }
    LifecycleEventEffect(Lifecycle.Event.ON_RESUME) { viewModel.checkMemory() }
    LifecycleEventEffect(Lifecycle.Event.ON_PAUSE) { viewModel.checkMemory(visible = false) }

    val back: () -> Unit = {
        if (backStack.lastOrNull() is Route.Control) {
            if (controlChanged.value) viewModel.memoryChanged()
            viewModel.checkMemory()
            backStack.clear()
            backStack.add(Route.Conversation)
        } else if (backStack.size > 1) {
            backStack.removeLastOrNull()
        }
    }
    val actions =
        NavigationActions(onSignOut, onRefresh, back, {
            if (it is Route.Control) controlChanged.value = false
            backStack.add(it)
        }, { result, description ->
            viewModel.memoryChanged(result, description = description)
            controlChanged.value = false
        }, backStack.lastOrNull(), { controlChanged.value = true })
    NavDisplay(
        backStack = backStack,
        modifier = Modifier.fillMaxSize(),
        onBack = back,
        entryProvider = kiokuEntries(state, account, viewModel, dependencies, actions),
    )
}
