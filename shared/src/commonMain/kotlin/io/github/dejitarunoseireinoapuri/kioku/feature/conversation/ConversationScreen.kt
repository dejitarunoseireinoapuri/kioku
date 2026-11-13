package io.github.dejitarunoseireinoapuri.kioku.feature.conversation

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuSpacing
import io.github.dejitarunoseireinoapuri.kioku.design.SettingsAction
import io.github.dejitarunoseireinoapuri.kioku.design.TopBar
import io.github.dejitarunoseireinoapuri.kioku.resources.Res
import io.github.dejitarunoseireinoapuri.kioku.resources.app_name
import org.jetbrains.compose.resources.stringResource

@Composable
fun ConversationScreen(
    state: ConversationState,
    onEvent: (ConversationEvent) -> Unit,
    onSettings: () -> Unit,
    onSource: (String) -> Unit,
) {
    Column(Modifier.fillMaxSize()) {
        TopBar(
            title = stringResource(Res.string.app_name),
            trailing = { SettingsAction(onSettings) },
        )
        Column(Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(KiokuSpacing.Large)) {
            ConversationBody(state, onEvent, onSource)
            state.feedback?.let { FeedbackMessage(it) }
        }
        if (state.scenario == PreviewScenario.Locked) LockedActions(onEvent) else ConversationComposer(state, onEvent)
    }
}
