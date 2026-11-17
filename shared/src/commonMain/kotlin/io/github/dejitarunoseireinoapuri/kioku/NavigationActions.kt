package io.github.dejitarunoseireinoapuri.kioku

import androidx.compose.runtime.Composable
import androidx.navigation3.runtime.NavKey
import androidx.navigation3.runtime.entryProvider
import io.github.dejitarunoseireinoapuri.kioku.di.ConversationDependencies
import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureOutcome
import io.github.dejitarunoseireinoapuri.kioku.domain.EditableSource
import io.github.dejitarunoseireinoapuri.kioku.domain.MemoryChange
import io.github.dejitarunoseireinoapuri.kioku.domain.MemoryChangeDescription
import io.github.dejitarunoseireinoapuri.kioku.feature.account.AccountState
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.ConversationEvent
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.ConversationScreen
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.ConversationState
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.ConversationViewModel
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.canManage
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.contentLoadingStatus
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.savedMessageSources
import io.github.dejitarunoseireinoapuri.kioku.feature.settings.SettingsScreen
import io.github.dejitarunoseireinoapuri.kioku.feature.source.SourceControlRoute
import io.github.dejitarunoseireinoapuri.kioku.feature.source.SourceScreen
import io.github.dejitarunoseireinoapuri.kioku.navigation.Route

internal data class NavigationActions(
    val signOut: () -> Unit,
    val refresh: () -> Unit,
    val back: () -> Unit,
    val navigate: (Route) -> Unit,
    val changed: (MemoryChange.Confirmed, MemoryChangeDescription?) -> Unit,
    val current: NavKey?,
    val markMemoryChange: () -> Unit = {},
)

@Composable
internal fun kiokuEntries(
    state: ConversationState,
    account: AccountState.Authorized,
    model: ConversationViewModel,
    dependencies: ConversationDependencies,
    actions: NavigationActions,
) = entryProvider<NavKey> {
    val loading = contentLoadingStatus(state, account.refreshing)
    entry<Route.Conversation> {
        ConversationScreen(
            state,
            model::onEvent,
            { actions.navigate(Route.Settings) },
            loading = loading.takeIf { actions.current == Route.Conversation },
            onManage = { id -> manageSavedSource(id, model, dependencies, actions) },
        ) { id ->
            model.checkMemory { if (model.openSource(id)) actions.navigate(Route.Source(id)) }
        }
    }
    entry<Route.Settings> {
        SettingsScreen(
            account,
            actions.signOut,
            actions.refresh,
            actions.back,
            examplesEnabled = loading == null && dependencies.conversation == null && dependencies.captures == null,
        ) { scenario ->
            model.onEvent(ConversationEvent.ShowExample(scenario))
            actions.back()
        }
    }
    entry<Route.Source> { route ->
        SourceScreen(
            state.source?.takeIf { it.id == route.id && !state.concealingMemory },
            state.feedback,
            actions.back,
            {
                if (dependencies.controls !=
                    null
                ) {
                    actions.navigate(Route.Control(route.id))
                } else {
                    model.sourceActionUnavailable()
                }
            },
            loading = state.query.sourceLoading || state.conversation?.sourceLoading == true || state.concealingMemory,
            manageable = dependencies.controls != null,
        )
    }
    entry<Route.Control> { route ->
        ControlDestination(route.ids, dependencies, actions)
    }
}

@Composable
private fun ControlDestination(
    ids: List<String>,
    dependencies: ConversationDependencies,
    actions: NavigationActions,
) {
    dependencies.controls?.let { repository ->
        CompositionViewModels {
            SourceControlRoute(
                ids,
                repository,
                actions.back,
                onMutation = actions.markMemoryChange,
                onChanged = actions.changed,
            )
        }
    }
}

private fun manageSavedSource(
    ids: List<String>,
    model: ConversationViewModel,
    dependencies: ConversationDependencies,
    actions: NavigationActions,
) {
    if (model.state.value.canManage(ids) && dependencies.controls != null) {
        actions.navigate(Route.Control(ids))
    } else {
        model.sourceActionUnavailable()
    }
}
