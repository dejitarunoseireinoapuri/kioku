package io.github.dejitarunoseireinoapuri.kioku.feature.conversation

import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureOutcome
import io.github.dejitarunoseireinoapuri.kioku.domain.TextCommand
import io.github.dejitarunoseireinoapuri.kioku.domain.TextOutcome

internal val TextOutcome.savedRevision: Long?
    get() = ((this as? TextOutcome.Captured)?.capture as? CaptureOutcome.Saved)?.memoryRevision

internal fun CaptureOutcome?.isUnresolvedCapture(): Boolean =
    this == CaptureOutcome.Processing || this == CaptureOutcome.Unconfirmed

internal fun TextConversationState.pendingCaptureMessages(): List<TextMessage> {
    val selected = mutableSetOf<Long>()
    messages.forEachIndexed { index, message ->
        if (message is TextMessage.Result && message.captureCommand != null) {
            selected.add(message.id)
            messages
                .take(index)
                .filterIsInstance<TextMessage.Owner>()
                .findLast { it.id == message.ownerId || message.ownerId == null }
                ?.let { selected.add(it.id) }
        }
    }
    return messages.filter { it.id in selected }
}

internal fun TextConversationState.recoveredCapture(
    messageId: Long,
    command: TextCommand,
    result: CaptureOutcome,
): TextConversationState {
    val outcome = TextOutcome.Captured(result)
    val ready = status as? TextStatus.Ready
    val updated =
        messages.map { message ->
            if (message.id == messageId && message is TextMessage.Result) {
                message.copy(outcome = outcome, captureCommand = command.takeIf { result.isUnresolvedCapture() })
            } else {
                message
            }
        }
    val needsReply = result is CaptureOutcome.Clarification
    val active = needsReply || ready?.command?.ids == command.ids || status == TextStatus.Idle
    return copy(
        checkingCapture = null,
        messages =
            if (needsReply) {
                updated.filter {
                    it.id != messageId
                } + updated.filter { it.id == messageId }
            } else {
                updated
            },
        status = if (active) TextStatus.Ready(command, outcome) else status,
    )
}
