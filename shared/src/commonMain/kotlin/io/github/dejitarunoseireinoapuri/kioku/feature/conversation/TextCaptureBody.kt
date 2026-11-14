package io.github.dejitarunoseireinoapuri.kioku.feature.conversation

import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.text.font.FontWeight
import io.github.dejitarunoseireinoapuri.kioku.design.ActionButton
import io.github.dejitarunoseireinoapuri.kioku.design.ContentLoadingNotice
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuColors
import io.github.dejitarunoseireinoapuri.kioku.design.Panel
import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureIssue
import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureOutcome
import io.github.dejitarunoseireinoapuri.kioku.resources.Res
import io.github.dejitarunoseireinoapuri.kioku.resources.capture_check
import io.github.dejitarunoseireinoapuri.kioku.resources.capture_checking
import io.github.dejitarunoseireinoapuri.kioku.resources.capture_expired
import io.github.dejitarunoseireinoapuri.kioku.resources.capture_ignored
import io.github.dejitarunoseireinoapuri.kioku.resources.capture_processing
import io.github.dejitarunoseireinoapuri.kioku.resources.capture_uncertain
import io.github.dejitarunoseireinoapuri.kioku.resources.retry
import io.github.dejitarunoseireinoapuri.kioku.resources.saved_title
import io.github.dejitarunoseireinoapuri.kioku.resources.view_source
import org.jetbrains.compose.resources.stringResource

@Composable
internal fun TextCaptureBody(
    capture: CaptureOutcome,
    interactive: Boolean,
    onEvent: (ConversationEvent) -> Unit,
    onSource: (String) -> Unit,
    recovery: CaptureRecoveryUi?,
) {
    when (capture) {
        is CaptureOutcome.Saved -> {
            Panel {
                Text(stringResource(Res.string.saved_title), fontWeight = FontWeight.SemiBold)
                ActionButton(stringResource(Res.string.view_source), { onSource(capture.source.id) })
            }
        }

        is CaptureOutcome.Clarification -> {
            Panel { Text(capture.question) }
        }

        CaptureOutcome.Ignored -> {
            Text(stringResource(Res.string.capture_ignored))
        }

        CaptureOutcome.Expired -> {
            Text(stringResource(Res.string.capture_expired), color = KiokuColors.Coral)
        }

        CaptureOutcome.Processing, CaptureOutcome.Unconfirmed -> {
            PendingCapture(capture, recovery, onEvent)
        }

        is CaptureOutcome.Failed -> {
            Text(stringResource(captureError(capture.issue)), color = KiokuColors.Coral)
            if (interactive && capture.issue != CaptureIssue.MoreContext) {
                ActionButton(
                    stringResource(Res.string.retry),
                    { onEvent(ConversationEvent.Message(MessageAction.Retry)) },
                )
            }
        }
    }
}

@Composable
private fun PendingCapture(
    capture: CaptureOutcome,
    recovery: CaptureRecoveryUi?,
    onEvent: (ConversationEvent) -> Unit,
) {
    Panel {
        Text(
            stringResource(
                if (capture ==
                    CaptureOutcome.Processing
                ) {
                    Res.string.capture_processing
                } else {
                    Res.string.capture_uncertain
                },
            ),
        )
        if (recovery?.checking == true) {
            ContentLoadingNotice(stringResource(Res.string.capture_checking))
        } else if (recovery != null) {
            ActionButton(
                stringResource(Res.string.capture_check),
                { onEvent(ConversationEvent.CheckCapture(recovery.messageId)) },
                enabled = recovery.enabled,
            )
        }
    }
}
