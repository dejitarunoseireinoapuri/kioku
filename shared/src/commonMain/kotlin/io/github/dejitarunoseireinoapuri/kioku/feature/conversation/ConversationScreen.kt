package io.github.dejitarunoseireinoapuri.kioku.feature.conversation

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import io.github.dejitarunoseireinoapuri.kioku.design.IconAction
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuColors
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuSpacing
import io.github.dejitarunoseireinoapuri.kioku.design.TopBar
import io.github.dejitarunoseireinoapuri.kioku.resources.Res
import io.github.dejitarunoseireinoapuri.kioku.resources.app_name
import io.github.dejitarunoseireinoapuri.kioku.resources.icon_settings
import io.github.dejitarunoseireinoapuri.kioku.resources.preview_banner
import io.github.dejitarunoseireinoapuri.kioku.resources.settings
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
            trailing = { IconAction(Res.drawable.icon_settings, stringResource(Res.string.settings), onSettings) },
        )
        Text(
            stringResource(Res.string.preview_banner),
            color = KiokuColors.Secondary,
            modifier = Modifier.padding(horizontal = KiokuSpacing.Large, vertical = KiokuSpacing.Small),
        )
        Column(Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(KiokuSpacing.Large)) {
            ConversationBody(state, onEvent, onSource)
            state.feedback?.let { FeedbackMessage(it) }
        }
        if (state.scenario == PreviewScenario.Locked) LockedActions(onEvent) else ConversationComposer(state, onEvent)
    }
}
