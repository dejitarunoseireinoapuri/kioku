package io.github.dejitarunoseireinoapuri.kioku.feature.source

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.sizeIn
import androidx.compose.material.Divider
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Text
import androidx.compose.material.TextButton
import androidx.compose.material.TextField
import androidx.compose.material.TextFieldDefaults
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import io.github.dejitarunoseireinoapuri.kioku.design.ActionButton
import io.github.dejitarunoseireinoapuri.kioku.design.ContentLoadingNotice
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuColors
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuSpacing
import io.github.dejitarunoseireinoapuri.kioku.design.rememberButtonFeedback
import io.github.dejitarunoseireinoapuri.kioku.domain.ChangeAction
import io.github.dejitarunoseireinoapuri.kioku.domain.MemoryItem
import io.github.dejitarunoseireinoapuri.kioku.resources.Res
import io.github.dejitarunoseireinoapuri.kioku.resources.control_apply
import io.github.dejitarunoseireinoapuri.kioku.resources.control_cancel
import io.github.dejitarunoseireinoapuri.kioku.resources.control_correcting
import io.github.dejitarunoseireinoapuri.kioku.resources.control_correction_hint
import io.github.dejitarunoseireinoapuri.kioku.resources.control_edit
import io.github.dejitarunoseireinoapuri.kioku.resources.control_edit_help
import io.github.dejitarunoseireinoapuri.kioku.resources.control_forget_help
import io.github.dejitarunoseireinoapuri.kioku.resources.control_forget_item
import io.github.dejitarunoseireinoapuri.kioku.resources.control_forgetting
import io.github.dejitarunoseireinoapuri.kioku.resources.control_new_fact_help
import org.jetbrains.compose.resources.StringResource
import org.jetbrains.compose.resources.stringResource

@Composable
internal fun SourceControlContent(
    state: SourceControlState,
    onEvent: (SourceControlEvent) -> Unit,
) {
    val ready = (state as? SourceControlState.Working)?.previous ?: state as SourceControlState.Ready
    val working = state is SourceControlState.Working
    val enabled = !working && ready.feedback != ControlFeedback.Processing && ready.forget == null
    var index = 0
    ready.sources.forEach { source ->
        SourceRecordedDate(source.source)
        source.items.forEach { item ->
            ControlItem(item, index++, ready, enabled, onEvent)
        }
    }
    ready.notice?.let { ControlChangeNotice(it, ready.description) }
    if (working) {
        ContentLoadingNotice(
            stringResource(
                if (state.action ==
                    ChangeAction.Correct
                ) {
                    Res.string.control_correcting
                } else {
                    Res.string.control_forgetting
                },
            ),
        )
    }
    ControlFeedbackNotice(ready.feedback, working, onEvent)
}

@Composable
private fun ControlItem(
    item: MemoryItem,
    index: Int,
    ready: SourceControlState.Ready,
    enabled: Boolean,
    onEvent: (SourceControlEvent) -> Unit,
) {
    Column(
        Modifier.fillMaxWidth().testTag("memory-item-${item.id}"),
        verticalArrangement = Arrangement.spacedBy(KiokuSpacing.Medium),
    ) {
        Row(horizontalArrangement = Arrangement.spacedBy(KiokuSpacing.Medium)) {
            Text((index + 1).toString().padStart(2, '0'), color = KiokuColors.Secondary)
            Text(item.text, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
        }
        if (ready.editing == item.id) {
            CorrectionEditor(ready, enabled, onEvent)
        } else {
            ControlItemActions(item.id, enabled, onEvent)
        }
        Divider(color = KiokuColors.Rule)
    }
}

@Composable
private fun ControlItemActions(
    id: String,
    enabled: Boolean,
    onEvent: (SourceControlEvent) -> Unit,
) {
    BoxWithConstraints {
        val stacked = maxWidth < KiokuSpacing.CompactContentHeight * LocalDensity.current.fontScale
        val edit: @Composable (Modifier) -> Unit = { modifier ->
            Column(modifier, verticalArrangement = Arrangement.spacedBy(KiokuSpacing.Small)) {
                ControlTextAction(Res.string.control_edit, enabled, { onEvent(SourceControlEvent.Edit(id)) })
                ControlHint(Res.string.control_edit_help)
            }
        }
        val forget: @Composable (Modifier) -> Unit = { modifier ->
            Column(modifier, verticalArrangement = Arrangement.spacedBy(KiokuSpacing.Small)) {
                ControlTextAction(Res.string.control_forget_item, enabled, { onEvent(SourceControlEvent.Forget(id)) })
                ControlHint(Res.string.control_forget_help)
            }
        }
        if (stacked) {
            Column(verticalArrangement = Arrangement.spacedBy(KiokuSpacing.Medium)) {
                edit(Modifier)
                forget(Modifier)
            }
        } else {
            Row(horizontalArrangement = Arrangement.spacedBy(KiokuSpacing.Large)) {
                edit(Modifier.weight(1f))
                forget(Modifier.weight(1f))
            }
        }
    }
}

@Composable
private fun CorrectionEditor(
    ready: SourceControlState.Ready,
    enabled: Boolean,
    onEvent: (SourceControlEvent) -> Unit,
) {
    ControlHint(Res.string.control_correction_hint)
    TextField(
        value = ready.draft,
        onValueChange = { onEvent(SourceControlEvent.Draft(it)) },
        enabled = enabled,
        modifier = Modifier.fillMaxWidth().testTag("correction-input"),
        maxLines = 5,
        colors =
            TextFieldDefaults.textFieldColors(
                textColor = KiokuColors.Text,
                backgroundColor = KiokuColors.Surface,
                cursorColor = KiokuColors.Coral,
                focusedIndicatorColor = KiokuColors.Coral,
            ),
    )
    ControlHint(Res.string.control_new_fact_help)
    ActionButton(
        stringResource(Res.string.control_apply),
        { onEvent(SourceControlEvent.Apply) },
        primary = true,
        enabled = enabled && ready.draft.isNotBlank(),
    )
    ControlTextAction(Res.string.control_cancel, enabled, { onEvent(SourceControlEvent.Cancel) })
}

@Composable
private fun ControlTextAction(
    label: StringResource,
    enabled: Boolean,
    onClick: () -> Unit,
) {
    val feedback = rememberButtonFeedback(KiokuColors.Text)
    TextButton(
        onClick = onClick,
        enabled = enabled,
        interactionSource = feedback.interactionSource,
        contentPadding = PaddingValues(),
        modifier = Modifier.sizeIn(minHeight = KiokuSpacing.TouchTarget),
    ) {
        Text(stringResource(label), color = if (enabled) feedback.contentColor else KiokuColors.Secondary)
    }
}

@Composable
private fun ControlHint(text: StringResource) {
    Text(stringResource(text), style = MaterialTheme.typography.body2, color = KiokuColors.Secondary)
}
