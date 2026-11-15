package io.github.dejitarunoseireinoapuri.kioku.feature.conversation

import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.sizeIn
import androidx.compose.material.DropdownMenu
import androidx.compose.material.DropdownMenuItem
import androidx.compose.material.Icon
import androidx.compose.material.IconButton
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.disabled
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuColors
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuSpacing
import io.github.dejitarunoseireinoapuri.kioku.design.TranscriptMessage
import io.github.dejitarunoseireinoapuri.kioku.design.rememberButtonFeedback
import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureOutcome
import io.github.dejitarunoseireinoapuri.kioku.domain.TextOutcome
import io.github.dejitarunoseireinoapuri.kioku.resources.Res
import io.github.dejitarunoseireinoapuri.kioku.resources.control_manage
import io.github.dejitarunoseireinoapuri.kioku.resources.icon_more
import io.github.dejitarunoseireinoapuri.kioku.resources.memory_historical
import io.github.dejitarunoseireinoapuri.kioku.resources.memory_manage
import io.github.dejitarunoseireinoapuri.kioku.resources.memory_saved
import org.jetbrains.compose.resources.painterResource
import org.jetbrains.compose.resources.stringResource

/** Only a confirmed server result associates a management action with its original owner turn. */
internal fun TextConversationState.savedMessageSources(): Map<Long, String> =
    savedMessageGroups().mapValues { it.value.first() }

internal fun TextConversationState.savedMessageGroups(): Map<Long, List<String>> {
    val legacy =
        messages
            .filterIsInstance<TextMessage.Result>()
            .mapNotNull { message ->
                val saved = (message.outcome as? TextOutcome.Captured)?.capture as? CaptureOutcome.Saved
                message.ownerId?.let { owner -> saved?.let { owner to it.source.id } }
            }.toMap()
    return messages
        .filterIsInstance<TextMessage.Owner>()
        .filterNot { it.historical }
        .associate { owner ->
            owner.id to (owner.sourceIds ?: listOfNotNull(legacy[owner.id]))
        }.filterValues { it.isNotEmpty() }
}

@Composable
internal fun OwnerMemoryMessage(
    text: String,
    sourceId: String?,
    enabled: Boolean,
    onManage: (String) -> Unit,
    historical: Boolean = false,
) {
    val savedLabel = stringResource(Res.string.memory_saved)
    val historicalLabel = stringResource(Res.string.memory_historical)
    Row(horizontalArrangement = Arrangement.spacedBy(KiokuSpacing.Small)) {
        TranscriptMessage(
            Modifier.weight(1f).semantics { if (sourceId != null && !historical) stateDescription = savedLabel },
            owner = true,
        ) {
            Text(
                text,
                color = if (historical) KiokuColors.Secondary else KiokuColors.Text,
                modifier =
                    Modifier.semantics {
                        if (historical) {
                            disabled()
                            stateDescription = historicalLabel
                        }
                    },
            )
        }
        if (sourceId != null && !historical) {
            MemoryActionsMenu(enabled) { onManage(sourceId) }
        }
    }
}

@Composable
internal fun MemoryActionsMenu(
    enabled: Boolean,
    onManage: () -> Unit,
) {
    var expanded by remember(enabled) { mutableStateOf(false) }
    val feedback = rememberButtonFeedback(KiokuColors.Secondary)
    val menuFeedback = rememberButtonFeedback(KiokuColors.Text)
    Box {
        IconButton(
            onClick = { expanded = true },
            enabled = enabled,
            interactionSource = feedback.interactionSource,
            modifier = Modifier.sizeIn(KiokuSpacing.TouchTarget, KiokuSpacing.TouchTarget),
        ) {
            Icon(
                painterResource(Res.drawable.icon_more),
                stringResource(Res.string.memory_manage),
                tint = if (enabled) feedback.contentColor else KiokuColors.Rule,
            )
        }
        DropdownMenu(
            expanded && enabled,
            { expanded = false },
            modifier = Modifier.border(KiokuSpacing.Stroke, KiokuColors.Rule).testTag("saved-memory-menu"),
        ) {
            DropdownMenuItem(
                onClick = {
                    expanded = false
                    onManage()
                },
                interactionSource = menuFeedback.interactionSource,
            ) { Text(stringResource(Res.string.control_manage), color = menuFeedback.contentColor) }
        }
    }
}
