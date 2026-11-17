package io.github.dejitarunoseireinoapuri.kioku.feature.voice

import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.compose.LifecycleEventEffect
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import io.github.dejitarunoseireinoapuri.kioku.di.LocalVoiceInput
import io.github.dejitarunoseireinoapuri.kioku.domain.VoiceInput
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.ConversationEvent
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.ConversationState
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.inputLimit
import org.koin.compose.viewmodel.koinViewModel
import org.koin.core.parameter.parametersOf

data class VoiceInteraction(
    val state: VoiceState = VoiceState.Idle,
    val act: (VoiceAction) -> Unit = {},
)

val LocalVoiceInteraction = staticCompositionLocalOf { VoiceInteraction() }

@Composable
fun VoiceCaptureHost(
    conversation: ConversationState,
    onEvent: (ConversationEvent) -> Unit,
    content: @Composable () -> Unit,
) {
    val input = LocalVoiceInput.current
    if (input == null) content() else NativeVoiceHost(input, conversation, onEvent, content)
}

@Composable
private fun NativeVoiceHost(
    input: VoiceInput,
    conversation: ConversationState,
    onEvent: (ConversationEvent) -> Unit,
    content: @Composable () -> Unit,
) {
    val model = koinViewModel<VoiceViewModel>(key = "voice-${input.hashCode()}", parameters = { parametersOf(input) })
    val state by model.state.collectAsStateWithLifecycle()
    var initialDraft by remember { mutableStateOf("") }
    val focus = LocalFocusManager.current
    val keyboard = LocalSoftwareKeyboardController.current
    DisposableEffect(model) { onDispose { model.cancel() } }
    LifecycleEventEffect(Lifecycle.Event.ON_PAUSE) { model.cancel() }
    LaunchedEffect(conversation.canEdit) { if (!conversation.canEdit && state.busy) model.cancel() }
    LaunchedEffect(state) {
        val result = state as? VoiceState.Completed ?: return@LaunchedEffect
        model.consume()
        if (conversation.canEdit) {
            val text = listOf(initialDraft, result.text).filter(String::isNotBlank).joinToString(" ")
            onEvent(ConversationEvent.EditDraft(text))
        }
    }
    val canStart = conversation.canEdit && conversation.draft.isEmpty()
    val action: (VoiceAction) -> Unit = act@{ event ->
        if (event == VoiceAction.Start) {
            if (!canStart || state.busy) return@act
            initialDraft = conversation.draft
            model.setTextLimit(conversation.inputLimit - initialDraft.length - if (initialDraft.isBlank()) 0 else 1)
            focus.clearFocus(force = true)
            keyboard?.hide()
        }
        model.act(event)
    }
    CompositionLocalProvider(LocalVoiceInteraction provides VoiceInteraction(state, action), content = content)
}
