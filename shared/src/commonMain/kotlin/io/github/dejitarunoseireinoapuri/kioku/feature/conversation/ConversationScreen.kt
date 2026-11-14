package io.github.dejitarunoseireinoapuri.kioku.feature.conversation

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import io.github.dejitarunoseireinoapuri.kioku.design.ContentLoadingNotice
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuSpacing
import io.github.dejitarunoseireinoapuri.kioku.design.SettingsAction
import io.github.dejitarunoseireinoapuri.kioku.design.TopBar
import io.github.dejitarunoseireinoapuri.kioku.resources.Res
import io.github.dejitarunoseireinoapuri.kioku.resources.app_name
import org.jetbrains.compose.resources.StringResource
import org.jetbrains.compose.resources.stringResource

@Composable
fun ConversationScreen(
    state: ConversationState,
    onEvent: (ConversationEvent) -> Unit,
    onSettings: () -> Unit,
    loading: StringResource? = null,
    onSource: (String) -> Unit,
) {
    val scroll = rememberScrollState()
    val newest =
        state.query.messages
            .lastOrNull()
            ?.id
    LaunchedEffect(newest, state.capture, loading, scroll.maxValue) {
        if (state.showingQuery || state.showingCapture || loading != null) scroll.animateScrollTo(scroll.maxValue)
    }
    Column(Modifier.fillMaxSize()) {
        TopBar(
            title = stringResource(Res.string.app_name),
            trailing = { SettingsAction(onSettings) },
        )
        Column(
            Modifier
                .weight(1f)
                .testTag("conversation-messages")
                .verticalScroll(scroll)
                .padding(KiokuSpacing.Large),
            verticalArrangement = Arrangement.spacedBy(KiokuSpacing.Large),
        ) {
            ConversationBody(state, onEvent, onSource)
            state.feedback?.let { FeedbackMessage(it) }
            if (loading != null) ContentLoadingNotice(stringResource(loading))
        }
        if (state.scenario == PreviewScenario.Locked) LockedActions(onEvent) else ConversationComposer(state, onEvent)
    }
}
