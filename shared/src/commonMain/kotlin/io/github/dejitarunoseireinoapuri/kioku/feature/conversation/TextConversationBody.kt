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
import io.github.dejitarunoseireinoapuri.kioku.domain.QueryOutcome
import io.github.dejitarunoseireinoapuri.kioku.domain.TextOutcome
import io.github.dejitarunoseireinoapuri.kioku.resources.Res
import io.github.dejitarunoseireinoapuri.kioku.resources.capture_check
import io.github.dejitarunoseireinoapuri.kioku.resources.capture_more_context
import io.github.dejitarunoseireinoapuri.kioku.resources.capture_restart
import io.github.dejitarunoseireinoapuri.kioku.resources.forget_cancelled
import io.github.dejitarunoseireinoapuri.kioku.resources.offer_accept
import io.github.dejitarunoseireinoapuri.kioku.resources.offer_decline
import io.github.dejitarunoseireinoapuri.kioku.resources.offer_title
import io.github.dejitarunoseireinoapuri.kioku.resources.operation_uncertain
import io.github.dejitarunoseireinoapuri.kioku.resources.query_source
import io.github.dejitarunoseireinoapuri.kioku.resources.text_declined
import io.github.dejitarunoseireinoapuri.kioku.resources.text_expired
import io.github.dejitarunoseireinoapuri.kioku.resources.text_failure
import io.github.dejitarunoseireinoapuri.kioku.resources.text_offer_question
import io.github.dejitarunoseireinoapuri.kioku.resources.text_repeat
import org.jetbrains.compose.resources.stringResource

@Composable
fun TextConversationBody(
    state: TextConversationState,
    onEvent: (ConversationEvent) -> Unit,
    onSource: (String) -> Unit,
    onManage: (String) -> Unit = onSource,
) {
    val saved = state.savedMessageSources()
    Column(verticalArrangement = Arrangement.spacedBy(KiokuSpacing.Large)) {
        state.messages.forEach { message ->
            when (message) {
                is TextMessage.Owner -> {
                    OwnerMemoryMessage(
                        message.text,
                        saved[message.id],
                        !state.busy && !state.confirmingForget,
                        onManage,
                    )
                }

                is TextMessage.Result -> {
                    message.visibleOutcome(saved)?.let { outcome ->
                        TextOutcomeBody(
                            outcome,
                            interactive = !state.busy && message.id == state.messages.lastOrNull()?.id,
                            onEvent,
                            onSource,
                            message.captureCommand?.let {
                                CaptureRecoveryUi(message.id, state.checkingCapture == message.id, !state.busy)
                            },
                        )
                    }
                }
            }
        }
        val last = (state.messages.lastOrNull() as? TextMessage.Result)?.outcome
        state.outcome?.takeIf { !state.busy && it != last }?.let { TextOutcomeBody(it, true, onEvent, onSource) }
        if (state.clarification) MessageButton(MessageAction.Reset, stringResource(Res.string.capture_restart), onEvent)
    }
}

private fun TextMessage.Result.visibleOutcome(saved: Map<Long, String>): TextOutcome? {
    val offer = outcome as? TextOutcome.Offered
    return if (offer != null && ownerId in saved) offer.answer?.let { TextOutcome.Asked(it) } else outcome
}

@Composable
private fun TextOutcomeBody(
    outcome: TextOutcome,
    interactive: Boolean,
    onEvent: (ConversationEvent) -> Unit,
    onSource: (String) -> Unit,
    recovery: CaptureRecoveryUi? = null,
) {
    when (outcome) {
        is TextOutcome.Asked -> {
            TextAnswer(outcome.answer, interactive, onEvent, onSource)
        }

        is TextOutcome.Captured -> {
            TextCaptureBody(outcome.capture, interactive, onEvent, recovery)
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
            TextProblem(Res.string.operation_uncertain, MessageAction.Retry, interactive, onEvent)
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
