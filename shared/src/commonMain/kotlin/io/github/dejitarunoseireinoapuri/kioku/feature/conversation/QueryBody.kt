package io.github.dejitarunoseireinoapuri.kioku.feature.conversation

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import io.github.dejitarunoseireinoapuri.kioku.design.ActionButton
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuColors
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuSpacing
import io.github.dejitarunoseireinoapuri.kioku.design.Panel
import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureIssue
import io.github.dejitarunoseireinoapuri.kioku.domain.QueryOutcome
import io.github.dejitarunoseireinoapuri.kioku.resources.Res
import io.github.dejitarunoseireinoapuri.kioku.resources.query_error
import io.github.dejitarunoseireinoapuri.kioku.resources.query_limit
import io.github.dejitarunoseireinoapuri.kioku.resources.query_repeat
import io.github.dejitarunoseireinoapuri.kioku.resources.query_reset
import io.github.dejitarunoseireinoapuri.kioku.resources.query_restart
import io.github.dejitarunoseireinoapuri.kioku.resources.query_searching
import io.github.dejitarunoseireinoapuri.kioku.resources.query_source
import io.github.dejitarunoseireinoapuri.kioku.resources.retry
import org.jetbrains.compose.resources.stringResource

@Composable
fun QueryBody(
    state: QueryState,
    onEvent: (ConversationEvent) -> Unit,
    onSource: (String) -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(KiokuSpacing.Large)) {
        Panel { Text(state.question) }
        if (state.busy) {
            Text(
                stringResource(Res.string.query_searching),
                color = KiokuColors.Coral,
                modifier = Modifier.semantics { liveRegion = LiveRegionMode.Polite },
            )
        } else {
            QueryResultBody(state.outcome, onEvent, onSource)
        }
        if (state.awaitingClarification) {
            ActionButton(
                stringResource(Res.string.query_reset),
                { onEvent(ConversationEvent.Query(QueryAction.Reset)) },
            )
        }
    }
}

@Composable
private fun QueryResultBody(
    outcome: QueryOutcome?,
    onEvent: (ConversationEvent) -> Unit,
    onSource: (String) -> Unit,
) {
    when (outcome) {
        is QueryOutcome.Reply -> {
            Panel { Text(outcome.text) }
            outcome.sources.forEachIndexed { index, source ->
                ActionButton(
                    stringResource(Res.string.query_source, index + 1, source.recordedOn),
                    { onSource(source.sourceId) },
                )
            }
        }

        is QueryOutcome.Failed, QueryOutcome.Processing -> {
            val limited = (outcome as? QueryOutcome.Failed)?.issue == CaptureIssue.MoreContext
            Text(
                stringResource(if (limited) Res.string.query_limit else Res.string.query_error),
                color = KiokuColors.Coral,
            )
            ActionButton(stringResource(if (limited) Res.string.query_reset else Res.string.retry), {
                onEvent(ConversationEvent.Query(if (limited) QueryAction.Reset else QueryAction.Retry))
            })
        }

        QueryOutcome.RepeatRequired -> {
            Text(stringResource(Res.string.query_repeat))
            ActionButton(
                stringResource(Res.string.query_restart),
                { onEvent(ConversationEvent.Query(QueryAction.Restart)) },
            )
        }

        null -> {}
    }
}
