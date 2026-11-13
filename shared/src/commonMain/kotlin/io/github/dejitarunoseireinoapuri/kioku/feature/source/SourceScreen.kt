package io.github.dejitarunoseireinoapuri.kioku.feature.source

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import io.github.dejitarunoseireinoapuri.kioku.design.ActionButton
import io.github.dejitarunoseireinoapuri.kioku.design.IconAction
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuColors
import io.github.dejitarunoseireinoapuri.kioku.design.Panel
import io.github.dejitarunoseireinoapuri.kioku.design.TopBar
import io.github.dejitarunoseireinoapuri.kioku.domain.MemorySource
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.FeedbackMessage
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.PreviewFeedback
import io.github.dejitarunoseireinoapuri.kioku.resources.Res
import io.github.dejitarunoseireinoapuri.kioku.resources.back
import io.github.dejitarunoseireinoapuri.kioku.resources.correction_label
import io.github.dejitarunoseireinoapuri.kioku.resources.forget
import io.github.dejitarunoseireinoapuri.kioku.resources.icon_back
import io.github.dejitarunoseireinoapuri.kioku.resources.original_label
import io.github.dejitarunoseireinoapuri.kioku.resources.original_title
import io.github.dejitarunoseireinoapuri.kioku.resources.preview_banner
import io.github.dejitarunoseireinoapuri.kioku.resources.source_unavailable
import org.jetbrains.compose.resources.stringResource

@Composable
fun SourceScreen(
    source: MemorySource?,
    feedback: PreviewFeedback?,
    onBack: () -> Unit,
    onForget: () -> Unit,
) {
    Column(Modifier.fillMaxSize()) {
        TopBar(
            stringResource(Res.string.original_title),
            leading = { IconAction(Res.drawable.icon_back, stringResource(Res.string.back), onBack) },
            trailing = { if (source != null) ActionButton(stringResource(Res.string.forget), onForget) },
        )
        Column(
            Modifier.verticalScroll(rememberScrollState()).padding(24.dp),
            verticalArrangement = Arrangement.spacedBy(24.dp),
        ) {
            Text(stringResource(Res.string.preview_banner), color = KiokuColors.Secondary)
            if (source == null) {
                Text(stringResource(Res.string.source_unavailable))
            } else {
                Text(source.recordedOn, color = KiokuColors.Secondary)
                Panel {
                    Text(stringResource(Res.string.original_label), color = KiokuColors.Secondary)
                    Text(source.originalText)
                }
                source.correction?.let { correction ->
                    Panel {
                        Text(stringResource(Res.string.correction_label), color = KiokuColors.Coral)
                        Text(correction.instruction)
                        Text(correction.currentSummary, color = KiokuColors.Secondary)
                    }
                }
            }
            feedback?.let { FeedbackMessage(it) }
        }
    }
}
