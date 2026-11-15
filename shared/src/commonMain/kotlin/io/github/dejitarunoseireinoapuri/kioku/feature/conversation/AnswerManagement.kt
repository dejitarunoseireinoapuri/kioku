package io.github.dejitarunoseireinoapuri.kioku.feature.conversation

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuSpacing
import io.github.dejitarunoseireinoapuri.kioku.design.TranscriptMessage
import io.github.dejitarunoseireinoapuri.kioku.domain.QueryOutcome

internal data class AnswerManagement(
    val enabled: Boolean,
    val open: (List<String>) -> Unit,
)

@Composable
internal fun AnswerMemoryMessage(
    answer: QueryOutcome.Reply,
    management: AnswerManagement,
) {
    val ids = answer.sources.map { it.sourceId }.distinct()
    Row(horizontalArrangement = Arrangement.spacedBy(KiokuSpacing.Small), verticalAlignment = Alignment.Top) {
        TranscriptMessage(Modifier.weight(1f)) { Text(answer.text) }
        if (ids.isNotEmpty()) {
            MemoryActionsMenu(management.enabled) { management.open(ids) }
        }
    }
}
