package io.github.dejitarunoseireinoapuri.kioku.feature.conversation

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.text.font.FontWeight
import io.github.dejitarunoseireinoapuri.kioku.design.ActionButton
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuColors
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuSpacing
import io.github.dejitarunoseireinoapuri.kioku.design.Panel
import io.github.dejitarunoseireinoapuri.kioku.design.memoryChangeText
import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureIssue
import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureOutcome
import io.github.dejitarunoseireinoapuri.kioku.domain.QueryOutcome
import io.github.dejitarunoseireinoapuri.kioku.domain.TextOutcome
import io.github.dejitarunoseireinoapuri.kioku.resources.Res
import io.github.dejitarunoseireinoapuri.kioku.resources.capture_check
import io.github.dejitarunoseireinoapuri.kioku.resources.capture_ignored
import io.github.dejitarunoseireinoapuri.kioku.resources.capture_more_context
import io.github.dejitarunoseireinoapuri.kioku.resources.capture_restart
import io.github.dejitarunoseireinoapuri.kioku.resources.capture_uncertain
import io.github.dejitarunoseireinoapuri.kioku.resources.forget_cancelled
import io.github.dejitarunoseireinoapuri.kioku.resources.offer_accept
import io.github.dejitarunoseireinoapuri.kioku.resources.offer_decline
import io.github.dejitarunoseireinoapuri.kioku.resources.offer_title
import io.github.dejitarunoseireinoapuri.kioku.resources.query_source
import io.github.dejitarunoseireinoapuri.kioku.resources.saved_title
import io.github.dejitarunoseireinoapuri.kioku.resources.text_declined
import io.github.dejitarunoseireinoapuri.kioku.resources.text_expired
import io.github.dejitarunoseireinoapuri.kioku.resources.text_failure
import io.github.dejitarunoseireinoapuri.kioku.resources.text_offer_question
import io.github.dejitarunoseireinoapuri.kioku.resources.text_repeat
import io.github.dejitarunoseireinoapuri.kioku.resources.view_source
import org.jetbrains.compose.resources.stringResource

@Composable
fun TextConversationBody(
    state: TextConversationState,
    onEvent: (ConversationEvent) -> Unit,
    onSource: (String) -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(KiokuSpacing.Large)) {
        state.messages.forEach { message ->
            when (message) {
                is TextMessage.Owner -> {
                    Panel { Text(message.text) }
                }

                is TextMessage.Result -> {
                    TextOutcomeBody(
                        message.outcome,
                        interactive = !state.busy && message.id == state.messages.lastOrNull()?.id,
                        onEvent,
                        onSource,
                    )
                }
            }
        }
        val last = (state.messages.lastOrNull() as? TextMessage.Result)?.outcome
        state.outcome?.takeIf { !state.busy && it != last }?.let { TextOutcomeBody(it, true, onEvent, onSource) }
        if (state.clarification) MessageButton(MessageAction.Reset, stringResource(Res.string.capture_restart), onEvent)
    }
}

@Composable
private fun TextOutcomeBody(
    outcome: TextOutcome,
    interactive: Boolean,
    onEvent: (ConversationEvent) -> Unit,
    onSource: (String) -> Unit,
) {
    when (outcome) {
        is TextOutcome.Asked -> {
            TextAnswer(outcome.answer, interactive, onEvent, onSource)
        }

        is TextOutcome.Captured -> {
            TextCapture(outcome.capture, interactive, onEvent, onSource)
        }

        is TextOutcome.Offered -> {
            outcome.answer?.let { TextAnswer(it, false, onEvent, onSource) }
            MemoryOffer(outcome.fact, interactive, onEvent)
        }

        is TextOutcome.Clarification -> {
            Panel { Text(outcome.question) }
        }

        is TextOutcome.Changed -> {
            Text(memoryChangeText(outcome.result.action))
        }

        else -> {
            TextOutcomeNotice(outcome, interactive, onEvent)
        }
    }
}

@Composable
private fun TextOutcomeNotice(
    outcome: TextOutcome,
    interactive: Boolean,
    onEvent: (ConversationEvent) -> Unit,
) {
    when (outcome) {
        TextOutcome.ForgetCancelled -> {
            Text(stringResource(Res.string.forget_cancelled))
        }

        TextOutcome.Declined -> {
            Text(stringResource(Res.string.text_declined))
        }

        TextOutcome.Expired -> {
            TextProblem(Res.string.text_expired, MessageAction.Restart, interactive, onEvent)
        }

        TextOutcome.RepeatRequired -> {
            TextProblem(Res.string.text_repeat, MessageAction.Restart, interactive, onEvent)
        }

        TextOutcome.Processing -> {
            TextProblem(Res.string.capture_uncertain, MessageAction.Retry, interactive, onEvent)
        }

        is TextOutcome.Failed -> {
            FailureReceipt(outcome.issue, interactive, onEvent)
        }

        else -> {}
    }
}

@Composable
private fun FailureReceipt(
    issue: CaptureIssue,
    interactive: Boolean,
    onEvent: (ConversationEvent) -> Unit,
) {
    val limited = issue == CaptureIssue.MoreContext
    TextProblem(
        if (limited) Res.string.capture_more_context else Res.string.text_failure,
        if (limited) MessageAction.Reset else MessageAction.Retry,
        interactive,
        onEvent,
    )
}

@Composable
private fun MemoryOffer(
    fact: String,
    interactive: Boolean,
    onEvent: (ConversationEvent) -> Unit,
) {
    Panel {
        Text(
            stringResource(Res.string.offer_title),
            style = MaterialTheme.typography.body2,
            color = KiokuColors.Secondary,
        )
        Text(stringResource(Res.string.text_offer_question), fontWeight = FontWeight.SemiBold)
        Text(fact)
        if (interactive) {
            MessageButton(MessageAction.Accept, stringResource(Res.string.offer_accept), onEvent)
            MessageButton(MessageAction.Reject, stringResource(Res.string.offer_decline), onEvent)
        }
    }
}

@Composable
private fun TextAnswer(
    answer: QueryOutcome,
    interactive: Boolean,
    onEvent: (ConversationEvent) -> Unit,
    onSource: (String) -> Unit,
) {
    if (answer is QueryOutcome.Reply) {
        Panel { Text(answer.text) }
        answer.sources.forEachIndexed { index, source ->
            ActionButton(
                stringResource(Res.string.query_source, index + 1, source.recordedOn),
                { onSource(source.sourceId) },
            )
        }
    } else {
        TextProblem(
            Res.string.text_failure,
            if (answer ==
                QueryOutcome.RepeatRequired
            ) {
                MessageAction.Restart
            } else {
                MessageAction.Retry
            },
            interactive,
            onEvent,
        )
    }
}

@Composable
private fun TextCapture(
    capture: CaptureOutcome,
    interactive: Boolean,
    onEvent: (ConversationEvent) -> Unit,
    onSource: (String) -> Unit,
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
            TextProblem(Res.string.text_expired, MessageAction.Restart, interactive, onEvent)
        }

        CaptureOutcome.Processing -> {
            TextProblem(Res.string.capture_uncertain, MessageAction.Retry, interactive, onEvent)
        }

        is CaptureOutcome.Failed -> {
            TextProblem(Res.string.text_failure, MessageAction.Retry, interactive, onEvent)
        }
    }
}

@Composable
private fun TextProblem(
    text: org.jetbrains.compose.resources.StringResource,
    action: MessageAction,
    interactive: Boolean,
    onEvent: (ConversationEvent) -> Unit,
) {
    Text(stringResource(text), color = KiokuColors.Coral)
    if (interactive) {
        MessageButton(
            action,
            stringResource(
                if (action ==
                    MessageAction.Retry
                ) {
                    Res.string.capture_check
                } else {
                    Res.string.capture_restart
                },
            ),
            onEvent,
        )
    }
}

@Composable
private fun MessageButton(
    action: MessageAction,
    label: String,
    onEvent: (ConversationEvent) -> Unit,
) {
    ActionButton(label, { onEvent(ConversationEvent.Message(action)) })
}
