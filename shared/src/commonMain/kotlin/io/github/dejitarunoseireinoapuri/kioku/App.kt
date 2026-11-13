package io.github.dejitarunoseireinoapuri.kioku

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.material.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation3.runtime.entryProvider
import androidx.navigation3.runtime.rememberNavBackStack
import androidx.navigation3.ui.NavDisplay
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuColors
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuTheme
import io.github.dejitarunoseireinoapuri.kioku.di.appModule
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.ConversationEvent
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.ConversationScreen
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.ConversationViewModel
import io.github.dejitarunoseireinoapuri.kioku.feature.settings.SettingsScreen
import io.github.dejitarunoseireinoapuri.kioku.feature.source.SourceScreen
import io.github.dejitarunoseireinoapuri.kioku.navigation.Route
import io.github.dejitarunoseireinoapuri.kioku.navigation.navigationConfiguration
import org.koin.compose.KoinApplication
import org.koin.compose.viewmodel.koinViewModel
import org.koin.dsl.koinConfiguration

@Composable
fun KiokuApp() {
    KoinApplication(configuration = koinConfiguration { modules(appModule) }) {
        KiokuTheme {
            Surface(color = KiokuColors.Background, contentColor = KiokuColors.Text) {
                Column(Modifier.fillMaxSize().safeDrawingPadding().imePadding()) {
                    KiokuNavigation()
                }
            }
        }
    }
}

@Composable
private fun KiokuNavigation(viewModel: ConversationViewModel = koinViewModel()) {
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
                    SettingsScreen(back) { scenario ->
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
