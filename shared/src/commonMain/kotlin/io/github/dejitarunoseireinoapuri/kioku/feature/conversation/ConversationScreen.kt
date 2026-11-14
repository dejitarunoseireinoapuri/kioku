package io.github.dejitarunoseireinoapuri.kioku.feature.conversation

import androidx.compose.foundation.ScrollState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.ime
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalDensity
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
    val scroll = conversationScroll(state, loading)
    Column(Modifier.fillMaxSize()) {
        ConversationHeader(onSettings)
        Column(
            Modifier
                .weight(1f)
                .testTag("conversation-messages")
                .verticalScroll(scroll)
                .padding(KiokuSpacing.Large),
            verticalArrangement = Arrangement.spacedBy(KiokuSpacing.Large),
        ) {
            if (!state.concealingMemory) {
                ConversationBody(state, onEvent, onSource)
                state.feedback?.let { FeedbackMessage(it) }
            }
            if (loading != null) ContentLoadingNotice(stringResource(loading))
        }
        if (state.scenario == PreviewScenario.Locked) {
            LockedActions(onEvent)
        } else {
            ConversationComposer(if (state.concealingMemory) state.copy(draft = "") else state, onEvent)
        }
    }
}

@Composable
private fun conversationScroll(
    state: ConversationState,
    loading: StringResource?,
): ScrollState {
    val scroll = rememberScrollState()
    val newest =
        state.query.messages
            .lastOrNull()
            ?.id
    LaunchedEffect(newest, state.capture, state.feedback, loading, scroll.maxValue) {
        val hasConversation = state.showingQuery || state.showingCapture
        if (hasConversation || state.feedback != null || loading != null) {
            scroll.animateScrollTo(scroll.maxValue)
        }
    }
    return scroll
}

@Composable
private fun ConversationHeader(onSettings: () -> Unit) {
    BoxWithConstraints {
        val keyboardVisible = WindowInsets.ime.getBottom(LocalDensity.current) > 0
        if (!keyboardVisible || maxHeight >= KiokuSpacing.CompactContentHeight) {
            TopBar(
                title = stringResource(Res.string.app_name),
                trailing = { SettingsAction(onSettings) },
            )
        }
    }
}
