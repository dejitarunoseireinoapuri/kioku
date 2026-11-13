package io.github.dejitarunoseireinoapuri.kioku.feature.conversation

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import io.github.dejitarunoseireinoapuri.kioku.design.ActionButton
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuColors
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuSpacing
import io.github.dejitarunoseireinoapuri.kioku.design.Panel
import io.github.dejitarunoseireinoapuri.kioku.design.ScreenHeading
import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureIssue
import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureOutcome
import io.github.dejitarunoseireinoapuri.kioku.resources.Res
import io.github.dejitarunoseireinoapuri.kioku.resources.capture_check
import io.github.dejitarunoseireinoapuri.kioku.resources.capture_configuration
import io.github.dejitarunoseireinoapuri.kioku.resources.capture_denied
import io.github.dejitarunoseireinoapuri.kioku.resources.capture_error
import io.github.dejitarunoseireinoapuri.kioku.resources.capture_expired
import io.github.dejitarunoseireinoapuri.kioku.resources.capture_ignored
import io.github.dejitarunoseireinoapuri.kioku.resources.capture_invalid
import io.github.dejitarunoseireinoapuri.kioku.resources.capture_limited
import io.github.dejitarunoseireinoapuri.kioku.resources.capture_more_context
import io.github.dejitarunoseireinoapuri.kioku.resources.capture_restart
import io.github.dejitarunoseireinoapuri.kioku.resources.capture_saved
import io.github.dejitarunoseireinoapuri.kioku.resources.capture_uncertain
import io.github.dejitarunoseireinoapuri.kioku.resources.clarification_hint
import io.github.dejitarunoseireinoapuri.kioku.resources.clarification_pending
import io.github.dejitarunoseireinoapuri.kioku.resources.retry
import io.github.dejitarunoseireinoapuri.kioku.resources.saved_title
import io.github.dejitarunoseireinoapuri.kioku.resources.view_source
import org.jetbrains.compose.resources.stringResource

@Composable
fun CaptureBody(
    state: ConversationState,
    onEvent: (ConversationEvent) -> Unit,
    onSource: (String) -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(KiokuSpacing.Large)) {
        if (state.capturing) {
            Panel { Text(state.draft) }
        } else {
            when (val outcome = state.capture) {
                is CaptureOutcome.Saved -> {
                    SavedCapture(outcome, onSource)
                }

                is CaptureOutcome.Clarification -> {
                    PendingClarification(outcome)
                }

                CaptureOutcome.Processing -> {
                    Text(stringResource(Res.string.capture_uncertain))
                    ActionButton(
                        stringResource(Res.string.capture_check),
                        { onEvent(ConversationEvent.RecoverCapture) },
                    )
                }

                is CaptureOutcome.Failed -> {
                    Text(stringResource(captureError(outcome.issue)), color = KiokuColors.Coral)
                    if (outcome.issue != CaptureIssue.MoreContext) {
                        ActionButton(stringResource(Res.string.retry), { onEvent(ConversationEvent.Submit) })
                    }
                    ActionButton(stringResource(Res.string.capture_restart), {
                        onEvent(ConversationEvent.CancelExample)
                    })
                }

                CaptureOutcome.Ignored -> {
                    Text(stringResource(Res.string.capture_ignored))
                }

                CaptureOutcome.Expired -> {
                    Text(stringResource(Res.string.capture_expired))
                }

                null -> {}
            }
        }
    }
}

@Composable
private fun SavedCapture(
    outcome: CaptureOutcome.Saved,
    onSource: (String) -> Unit,
) {
    Panel { Text(outcome.source.originalText) }
    Panel {
        ScreenHeading(stringResource(Res.string.saved_title))
        Text(stringResource(Res.string.capture_saved))
        ActionButton(stringResource(Res.string.view_source), { onSource(outcome.source.id) })
    }
}

@Composable
private fun PendingClarification(outcome: CaptureOutcome.Clarification) {
    Text(stringResource(Res.string.clarification_pending), color = KiokuColors.Coral)
    Panel { Text(outcome.question) }
    Text(stringResource(Res.string.clarification_hint), color = KiokuColors.Secondary)
}

private fun captureError(issue: CaptureIssue) =
    when (issue) {
        CaptureIssue.Denied -> Res.string.capture_denied
        CaptureIssue.Invalid -> Res.string.capture_invalid
        CaptureIssue.Limited -> Res.string.capture_limited
        CaptureIssue.NotConfigured -> Res.string.capture_configuration
        CaptureIssue.Unavailable -> Res.string.capture_error
        CaptureIssue.MoreContext -> Res.string.capture_more_context
    }
