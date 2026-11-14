package io.github.dejitarunoseireinoapuri.kioku.feature.conversation

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.sizeIn
import androidx.compose.material.Icon
import androidx.compose.material.IconButton
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuColors
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuSpacing
import io.github.dejitarunoseireinoapuri.kioku.design.Panel
import io.github.dejitarunoseireinoapuri.kioku.design.rememberButtonFeedback
import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureOutcome
import io.github.dejitarunoseireinoapuri.kioku.domain.TextOutcome
import io.github.dejitarunoseireinoapuri.kioku.resources.Res
import io.github.dejitarunoseireinoapuri.kioku.resources.icon_more
import io.github.dejitarunoseireinoapuri.kioku.resources.memory_manage
import io.github.dejitarunoseireinoapuri.kioku.resources.memory_saved
import org.jetbrains.compose.resources.painterResource
import org.jetbrains.compose.resources.stringResource

/** Only a confirmed server result associates a management action with its original owner turn. */
internal fun TextConversationState.savedMessageSources(): Map<Long, String> =
    messages
        .filterIsInstance<TextMessage.Result>()
        .mapNotNull { message ->
            val saved = (message.outcome as? TextOutcome.Captured)?.capture as? CaptureOutcome.Saved
            message.ownerId?.let { owner -> saved?.let { owner to it.source.id } }
        }.toMap()

@Composable
internal fun OwnerMemoryMessage(
    text: String,
    sourceId: String?,
    enabled: Boolean,
    onManage: (String) -> Unit,
) {
    val savedLabel = stringResource(Res.string.memory_saved)
    Row(horizontalArrangement = Arrangement.spacedBy(KiokuSpacing.Small)) {
        Panel(Modifier.weight(1f).semantics { if (sourceId != null) stateDescription = savedLabel }) {
            Text(text)
        }
        if (sourceId != null) {
            val feedback = rememberButtonFeedback(KiokuColors.Secondary)
            IconButton(
                onClick = { onManage(sourceId) },
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
        }
    }
}
