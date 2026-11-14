package io.github.dejitarunoseireinoapuri.kioku.feature.conversation

import io.github.dejitarunoseireinoapuri.kioku.domain.OfferDecision
import io.github.dejitarunoseireinoapuri.kioku.domain.TextCommand
import io.github.dejitarunoseireinoapuri.kioku.domain.TextContext
import io.github.dejitarunoseireinoapuri.kioku.domain.TextConversationRepository
import io.github.dejitarunoseireinoapuri.kioku.domain.TextOutcome

internal fun handleMessageEvent(
    event: ConversationEvent,
    session: TextConversationSession,
) {
    when (event) {
        is ConversationEvent.Message -> {
            session.act(event.action)
        }

        is ConversationEvent.CheckCapture -> {
            session.checkCapture(event.messageId)
        }

        else -> {}
    }
}

internal fun TextStatus.Ready.nextCommand(
    action: MessageAction,
    repository: TextConversationRepository?,
    context: TextContext,
): TextCommand? =
    when (action) {
        MessageAction.ConfirmForget -> {
            (outcome as? TextOutcome.ConfirmForget)?.let { command.copy(forgetApproval = it.preview) }
        }

        MessageAction.Accept, MessageAction.Reject -> {
            command.takeIf { outcome is TextOutcome.Offered }?.copy(
                decision = if (action == MessageAction.Accept) OfferDecision.Accept else OfferDecision.Reject,
            )
        }

        MessageAction.Restart -> {
            repository?.prepare(command.text, command.intent, context)
        }

        MessageAction.Retry -> {
            command.takeUnless { (outcome as? TextOutcome.Captured)?.capture.isUnresolvedCapture() }
        }

        MessageAction.Reset, MessageAction.CancelForget -> {
            null
        }
    }
