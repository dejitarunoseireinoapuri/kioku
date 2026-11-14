package io.github.dejitarunoseireinoapuri.kioku.feature.conversation

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.ime
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.sizeIn
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.Button
import androidx.compose.material.ButtonDefaults
import androidx.compose.material.Divider
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Surface
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.unit.dp
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuColors
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuSpacing
import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureOutcome
import io.github.dejitarunoseireinoapuri.kioku.resources.Res
import io.github.dejitarunoseireinoapuri.kioku.resources.ask
import io.github.dejitarunoseireinoapuri.kioku.resources.ask_placeholder
import io.github.dejitarunoseireinoapuri.kioku.resources.clarify_placeholder
import io.github.dejitarunoseireinoapuri.kioku.resources.offline_composer
import io.github.dejitarunoseireinoapuri.kioku.resources.tell_action
import io.github.dejitarunoseireinoapuri.kioku.resources.tell_placeholder
import io.github.dejitarunoseireinoapuri.kioku.resources.voice_hint
import org.jetbrains.compose.resources.StringResource
import org.jetbrains.compose.resources.stringResource

@Composable
fun ConversationComposer(
    state: ConversationState,
    onEvent: (ConversationEvent) -> Unit,
) {
    val enabled = state.canEdit
    val keyboardVisible = WindowInsets.ime.getBottom(LocalDensity.current) > 0
    val focus = LocalFocusManager.current
    val keyboard = LocalSoftwareKeyboardController.current
    val inputEvent: (ConversationEvent) -> Unit = { event ->
        if (event == ConversationEvent.Submit) {
            focus.clearFocus()
            keyboard?.hide()
        }
        onEvent(event)
    }
    Surface(color = KiokuColors.Surface) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Divider(color = KiokuColors.Rule)
            TextComposer(state, enabled, inputEvent)
            if (!keyboardVisible) {
                IntentControls(state.intent, state.canSwitchIntent, onEvent)
                Text(
                    stringResource(Res.string.voice_hint),
                    style = MaterialTheme.typography.body2,
                    color = KiokuColors.Secondary,
                )
            }
        }
    }
}

@Composable
private fun IntentControls(
    selected: MemoryIntent,
    enabled: Boolean,
    onEvent: (ConversationEvent) -> Unit,
) {
    val measurer = rememberTextMeasurer()
    val tell = stringResource(Res.string.tell_action)
    val ask = stringResource(Res.string.ask)
    val style = MaterialTheme.typography.button
    val width = maxOf(measurer.measure(tell, style).size.width, measurer.measure(ask, style).size.width)
    val minimumButtonWidth = with(LocalDensity.current) { width.toDp() } + KiokuSpacing.Medium * 2
    BoxWithConstraints(Modifier.fillMaxWidth()) {
        if ((maxWidth - 12.dp) / 2 >= minimumButtonWidth) {
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                IntentButton(MemoryIntent.Tell, selected, enabled, Modifier.weight(1f), onEvent)
                IntentButton(MemoryIntent.Ask, selected, enabled, Modifier.weight(1f), onEvent)
            }
        } else {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                IntentButton(MemoryIntent.Tell, selected, enabled, Modifier.fillMaxWidth(), onEvent)
                IntentButton(MemoryIntent.Ask, selected, enabled, Modifier.fillMaxWidth(), onEvent)
            }
        }
    }
}

@Composable
private fun TextComposer(
    state: ConversationState,
    enabled: Boolean,
    onEvent: (ConversationEvent) -> Unit,
) {
    Surface(shape = MaterialTheme.shapes.small, border = BorderStroke(1.dp, KiokuColors.Rule)) {
        Row(Modifier.fillMaxWidth().padding(start = 16.dp), verticalAlignment = Alignment.CenterVertically) {
            BasicTextField(
                value = state.draft,
                onValueChange = { onEvent(ConversationEvent.EditDraft(it)) },
                modifier = Modifier.weight(1f).padding(vertical = 16.dp).testTag("text-composer"),
                enabled = enabled,
                maxLines = 4,
                textStyle = MaterialTheme.typography.body1.copy(color = KiokuColors.Text),
                cursorBrush = SolidColor(KiokuColors.Coral),
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Send),
                keyboardActions = KeyboardActions(onSend = { onEvent(ConversationEvent.Submit) }),
                decorationBox = { field ->
                    Box {
                        if (state.draft.isEmpty()) {
                            Text(
                                stringResource(placeholder(state)),
                                color = KiokuColors.Secondary,
                            )
                        }
                        field()
                    }
                },
            )
            SendAction(enabled && state.draft.isNotBlank()) { onEvent(ConversationEvent.Submit) }
        }
    }
}

@Composable
private fun IntentButton(
    intent: MemoryIntent,
    selected: MemoryIntent,
    enabled: Boolean,
    modifier: Modifier,
    onEvent: (ConversationEvent) -> Unit,
) {
    val active = selected == intent
    Button(
        onClick = { onEvent(ConversationEvent.SelectIntent(intent)) },
        enabled = enabled,
        modifier =
            modifier
                .sizeIn(minHeight = KiokuSpacing.IntentHeight)
                .semantics { this.selected = active }
                .testTag("intent-${intent.name}"),
        elevation = null,
        border = if (active) null else BorderStroke(1.dp, KiokuColors.Rule),
        colors =
            ButtonDefaults.buttonColors(
                backgroundColor = if (active) KiokuColors.Coral else KiokuColors.Surface,
                contentColor = if (active) KiokuColors.Background else KiokuColors.Secondary,
            ),
    ) {
        Text(
            stringResource(if (intent == MemoryIntent.Tell) Res.string.tell_action else Res.string.ask),
            maxLines = 1,
            softWrap = false,
        )
    }
}

private fun placeholder(state: ConversationState): StringResource =
    when {
        state.capture is CaptureOutcome.Clarification -> Res.string.clarify_placeholder
        state.scenario == PreviewScenario.Offline -> Res.string.offline_composer
        state.scenario == PreviewScenario.Clarification -> Res.string.clarify_placeholder
        state.intent == MemoryIntent.Ask -> Res.string.ask_placeholder
        else -> Res.string.tell_placeholder
    }
