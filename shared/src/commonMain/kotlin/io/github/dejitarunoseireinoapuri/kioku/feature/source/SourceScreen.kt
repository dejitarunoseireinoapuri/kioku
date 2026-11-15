package io.github.dejitarunoseireinoapuri.kioku.feature.source

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import io.github.dejitarunoseireinoapuri.kioku.design.ActionButton
import io.github.dejitarunoseireinoapuri.kioku.design.ContentLoadingNotice
import io.github.dejitarunoseireinoapuri.kioku.design.IconAction
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuColors
import io.github.dejitarunoseireinoapuri.kioku.design.Panel
import io.github.dejitarunoseireinoapuri.kioku.design.TopBar
import io.github.dejitarunoseireinoapuri.kioku.domain.MemorySource
import io.github.dejitarunoseireinoapuri.kioku.domain.SourceKind
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.FeedbackMessage
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.PreviewFeedback
import io.github.dejitarunoseireinoapuri.kioku.resources.Res
import io.github.dejitarunoseireinoapuri.kioku.resources.back
import io.github.dejitarunoseireinoapuri.kioku.resources.control_manage
import io.github.dejitarunoseireinoapuri.kioku.resources.correction_label
import io.github.dejitarunoseireinoapuri.kioku.resources.forget
import io.github.dejitarunoseireinoapuri.kioku.resources.icon_back
import io.github.dejitarunoseireinoapuri.kioku.resources.original_label
import io.github.dejitarunoseireinoapuri.kioku.resources.original_title
import io.github.dejitarunoseireinoapuri.kioku.resources.source_corrected_label
import io.github.dejitarunoseireinoapuri.kioku.resources.source_current_title
import io.github.dejitarunoseireinoapuri.kioku.resources.source_loading
import io.github.dejitarunoseireinoapuri.kioku.resources.source_recorded_on
import io.github.dejitarunoseireinoapuri.kioku.resources.source_retained_label
import io.github.dejitarunoseireinoapuri.kioku.resources.source_unavailable
import org.jetbrains.compose.resources.stringResource

@Composable
fun SourceScreen(
    source: MemorySource?,
    feedback: PreviewFeedback?,
    onBack: () -> Unit,
    onForget: () -> Unit,
    loading: Boolean = false,
    manageable: Boolean = false,
) {
    Column(Modifier.fillMaxSize()) {
        TopBar(
            stringResource(
                if (source != null &&
                    source.kind != SourceKind.Original
                ) {
                    Res.string.source_current_title
                } else {
                    Res.string.original_title
                },
            ),
            leading = { IconAction(Res.drawable.icon_back, stringResource(Res.string.back), onBack) },
            trailing = {
                if (source !=
                    null
                ) {
                    ActionButton(
                        stringResource(if (manageable) Res.string.control_manage else Res.string.forget),
                        onForget,
                    )
                }
            },
        )
        Column(
            Modifier.verticalScroll(rememberScrollState()).padding(24.dp),
            verticalArrangement = Arrangement.spacedBy(24.dp),
        ) {
            if (loading) ContentLoadingNotice(stringResource(Res.string.source_loading))
            if (source == null && !loading) {
                Text(stringResource(Res.string.source_unavailable))
            } else if (source != null) {
                SourceContent(source)
            }
            feedback?.let { FeedbackMessage(it) }
        }
    }
}

@Composable
private fun SourceContent(source: MemorySource) {
    Panel {
        SourceRecordedDate(source)
        val label =
            when (source.kind) {
                SourceKind.Original -> Res.string.original_label
                SourceKind.Retained -> Res.string.source_retained_label
                SourceKind.Correction -> Res.string.source_corrected_label
            }
        Text(stringResource(label), color = KiokuColors.Secondary)
        Text(source.originalText)
    }
    source.correction?.let { correction ->
        Panel {
            Text(stringResource(Res.string.correction_label), color = KiokuColors.Accent)
            Text(correction.instruction)
            Text(correction.currentSummary, color = KiokuColors.Secondary)
        }
    }
}

@Composable
internal fun SourceRecordedDate(source: MemorySource) {
    val date =
        source.receivedAt?.let { formatSourceDate(it) }
            ?: formatSourceDate("${source.recordedOn}T12:00:00Z", "UTC")
            ?: source.recordedOn
    Text(
        stringResource(Res.string.source_recorded_on, date),
        color = KiokuColors.BrandSecondary,
        style = MaterialTheme.typography.body2,
        fontWeight = FontWeight.SemiBold,
    )
}
