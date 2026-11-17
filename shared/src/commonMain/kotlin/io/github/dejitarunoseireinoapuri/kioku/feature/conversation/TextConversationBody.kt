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
import io.github.dejitarunoseireinoapuri.kioku.design.TranscriptMessage
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
import io.github.dejitarunoseireinoapuri.kioku.resources.query_processing
import io.github.dejitarunoseireinoapuri.kioku.resources.query_repeat
import io.github.dejitarunoseireinoapuri.kioku.resources.retry
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
    onManage: (List<String>) -> Unit = { onSource(it.first()) },
    forgottenText: String? = null,
) {
    val presentation = MessageFeedPresentation(state, state.savedMessageSources(), forgottenText)
    Column(verticalArrangement = Arrangement.spacedBy(KiokuSpacing.Large)) {
        state.messages
            .filter {
                it !is TextMessage.Result || it.visibleOutcome(presentation.sources)?.hasContent() == true
            }.forEach { message ->
                TextMessageContent(message, presentation, onEvent, onManage)
            }
        TextConversationTail(state, onEvent, onManage)
    }
}

@Composable
internal fun TextConversationTail(
    state: TextConversationState,
    onEvent: (ConversationEvent) -> Unit,
    onManage: (List<String>) -> Unit,
) {
    state.tailOutcome()?.let {
        TextOutcomeBody(it, true, onEvent, AnswerManagement(!state.confirmingForget, onManage))
    }
}

@Composable
internal fun TextOutcomeBody(
    outcome: TextOutcome,
    interactive: Boolean,
    onEvent: (ConversationEvent) -> Unit,
    management: AnswerManagement,
    recovery: CaptureRecoveryUi? = null,
) {
    when (outcome) {
        is TextOutcome.Asked -> {
            TextAnswer(outcome.answer, interactive, onEvent, management)
        }

        is TextOutcome.Captured -> {
            TextCaptureBody(outcome.capture, interactive, onEvent, recovery)
        }

        is TextOutcome.Offered -> {
            outcome.answer?.let { TextAnswer(it, false, onEvent, management) }
            MemoryOffer(outcome.fact, interactive, onEvent)
        }

        is TextOutcome.Clarification -> {
            TranscriptMessage { Text(outcome.question) }
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
            TextProblem(
                Res.string.text_expired,
                MessageAction.Restart,
                interactive,
                onEvent,
                buttonLabel = Res.string.retry,
            )
        }

        TextOutcome.RepeatRequired -> {
            TextProblem(
                Res.string.text_repeat,
                MessageAction.Restart,
                interactive,
                onEvent,
                buttonLabel = Res.string.retry,
            )
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
        if (issue == CaptureIssue.Connection || issue == CaptureIssue.TimedOut) {
            queryFailureText(issue)
        } else if (limited) {
            Res.string.capture_more_context
        } else {
            Res.string.text_failure
        },
        if (limited) MessageAction.Reset else MessageAction.Retry,
        interactive,
        onEvent,
        buttonLabel =
            if (issue == CaptureIssue.Connection ||
                issue == CaptureIssue.TimedOut
            ) {
                Res.string.retry
            } else {
                null
            },
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
    management: AnswerManagement,
) {
    if (answer is QueryOutcome.Reply) {
        AnswerMemoryMessage(answer, management)
    } else {
        TextProblem(
            when (answer) {
                is QueryOutcome.Failed -> queryFailureText(answer.issue)
                QueryOutcome.RepeatRequired -> Res.string.query_repeat
                else -> Res.string.query_processing
            },
            if (answer ==
                QueryOutcome.RepeatRequired
            ) {
                MessageAction.Restart
            } else {
                MessageAction.Retry
            },
            interactive,
            onEvent,
            buttonLabel = Res.string.retry,
        )
    }
}

@Composable
private fun TextProblem(
    text: org.jetbrains.compose.resources.StringResource,
    action: MessageAction,
    interactive: Boolean,
    onEvent: (ConversationEvent) -> Unit,
    buttonLabel: org.jetbrains.compose.resources.StringResource? = null,
) {
    Text(stringResource(text), color = KiokuColors.Danger)
    if (interactive) {
        MessageButton(
            action,
            stringResource(
                buttonLabel ?: if (action ==
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
